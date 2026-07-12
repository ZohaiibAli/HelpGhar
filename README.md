# HelpGhar AI Assistant — RAG Chatbot Architecture

This document explains every file in the AI chatbot pipeline, what it's
responsible for, and how data flows from a user's message to a final
response. Read this before making changes — most bugs in this system
came from touching one file without understanding what three other
files assumed about it.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Directory Structure](#directory-structure)
3. [Environment Variables](#environment-variables)
4. [Request Flow, Step by Step](#request-flow-step-by-step)
5. [File Reference — `ai/`](#file-reference--ai)
6. [File Reference — `services/`](#file-reference--services)
7. [File Reference — `rag/`](#file-reference--rag)
8. [File Reference — `routes/`](#file-reference--routes)
9. [File Reference — `config/` and `model/`](#file-reference--config-and-model)
10. [File Reference — `documents/`](#file-reference--documents)
11. [Frontend — `ChatPage.tsx`](#frontend--chatpagetsx)
12. [The 9 Real Worker Categories](#the-9-real-worker-categories)
13. [Common Tasks (Runbook)](#common-tasks-runbook)
14. [Known Limitations](#known-limitations)
15. [Troubleshooting Log](#troubleshooting-log)

---

## High-Level Architecture

```
User message
     │
     ▼
ai/intent.py  ──────────► classifies into one of:
     │                     WORKER_SEARCH / BOOKING / POLICY /
     │                     PAYMENT / REVIEW / PROFILE / AUTH /
     │                     GREETING / GENERAL
     ▼
services/chat_service.py  (the orchestrator — routes based on intent)
     │
     ├── WORKER_SEARCH ──► ai/filter_extractor.py (parses category, city,
     │                     price, experience, rating from the question)
     │                          │
     │                          ▼
     │                     services/worker_service.py (queries MongoDB)
     │                          │
     │                          ▼
     │                     services/ranking_service.py (scores + sorts)
     │                          │
     │                          ▼
     │                     ai/context_builder.py + ai/worker_serializer.py
     │                     (turns worker docs into LLM-readable text)
     │                          │
     │                          ▼
     │                     services/prompt_service.py (builds the prompt)
     │                          │
     │                          ▼
     │                     ai/llm.py (calls Gemini)
     │
     └── BOOKING / POLICY / GENERAL ──► rag/retriever.py (searches Qdrant)
                                              │
                                              ▼
                                         services/prompt_service.py
                                              │
                                              ▼
                                         ai/llm.py (calls Gemini)

Every turn also passes through:
services/conversation_service.py — saves/loads chat history in MongoDB
```

Two completely separate retrieval systems exist and answer different
question types:

| Question type | Source of truth | Example |
|---|---|---|
| "Find me a home teacher under 15000" | **MongoDB** (`gigs` collection, structured filters) | Worker search |
| "What's your cancellation policy?" | **Qdrant** (vector search over `documents/*.txt`) | Policy/FAQ/general |

---

## Directory Structure

```
server/
├── main.py
├── .env
├── ai/
│   ├── intent.py
│   ├── filter_extractor.py
│   ├── context_builder.py
│   ├── worker_serializer.py
│   ├── llm.py
│   └── prompt.py
├── services/
│   ├── chat_service.py
│   ├── conversation_service.py
│   ├── prompt_service.py
│   ├── ranking_service.py
│   └── worker_service.py
├── rag/
│   ├── chunker.py
│   ├── document_loader.py
│   ├── embeddings.py
│   ├── ingest.py
│   ├── retriever.py
│   └── vector_store.py
├── routes/
│   └── chat_routes.py
├── config/
│   ├── db.py
│   ├── gemini.py
│   └── qdrant.py
├── model/
│   ├── chat_model.py
│   ├── chat_response.py
│   └── conversation_model.py
├── documents/                    ← source content ingested into Qdrant
│   ├── faq/
│   │   └── faq.txt
│   ├── policies/
│   │   ├── booking_policy.txt
│   │   ├── cancellation_policy.txt
│   │   ├── refund_policy.txt
│   │   └── verification_policy.txt
│   └── services/
│       ├── house_servants.txt
│       ├── drivers.txt
│       ├── baby_sitters.txt
│       ├── cooks.txt
│       ├── home_teachers.txt
│       ├── watchmen.txt
│       ├── electrician.txt
│       ├── plumber.txt
│       └── cleaner.txt
├── clear_qdrant.py               ← one-off: wipes the Qdrant collection
└── check_worker_data.py          ← one-off: inspects real Mongo field values

client/
└── src/pages/ChatPage.tsx
```

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `MONGO_URI`, `DB_NAME` | `config/db.py` | MongoDB connection (worker gigs + conversation history) |
| `GEMINI_API_KEY` | `ai/llm.py` | Auth for Gemini API |
| `GEMINI_MODEL` | `config/gemini.py` | Model name, e.g. `gemini-2.5-flash` |
| `QDRANT_URL`, `QDRANT_API_KEY` | `config/qdrant.py` | Qdrant Cloud connection |
| `QDRANT_COLLECTION` | `config/qdrant.py` | Collection name, e.g. `helpghar_docs` |
| `QDRANT_VECTOR_SIZE` | `config/qdrant.py` | Must match the embedding model's output dimension (384 for the current multilingual model) |

---

## Request Flow, Step by Step

1. Frontend `POST /api/chat` with `{ sessionId, message }`.
2. `chat_routes.py` calls `chat_service.chat(session_id, question)`.
3. `chat_service.chat()`:
   - Saves the user's message via `conversation_service.add_message()`.
   - Builds recent conversation history via `conversation_service.build_history()`.
   - Classifies intent via `ai/intent.py`'s `classify()`.
   - Routes to the matching handler (`handle_worker_search`, `handle_policy`, `handle_booking`, `handle_general`, `handle_auth`, `handle_greeting`).
4. **If worker search:** filters are extracted, MongoDB is queried and
   ranked, top 5 workers become the Gemini context, Gemini writes a
   natural-language summary, and the raw worker list is also returned
   separately so the frontend can render worker cards.
5. **If policy/booking/general:** the question is embedded and matched
   against Qdrant, the top chunks become the Gemini context, Gemini
   answers grounded in that text only.
6. The assistant's reply (and, for worker search, the worker list) is
   saved back to `conversation_service` as message metadata, so
   refreshing the page or navigating away and back restores it.

---

## File Reference — `ai/`

### `ai/intent.py`
Classifies a raw question into one `Intent` enum value. **Checks a
resolvable service category first** (via `filter_extractor.extract_category()`)
before any other keyword check — this was a deliberate fix: generic
keyword overlap (e.g. "verified" also being a policy keyword) used to
hijack obvious worker-search questions into the wrong intent. Order of
checks matters here; don't reorder without understanding why category
detection is checked first.

### `ai/filter_extractor.py`
Converts a natural-language question into a `WorkerSearchFilters`
Pydantic model (category, city, gender, price range, experience,
rating, verified, available). Contains:
- `CATEGORY_SYNONYMS` — maps each of the 9 real categories to phrases
  people actually type, including some Roman Urdu terms.
- `CITY_ALIASES` — maps each canonical city to every spelling/
  abbreviation seen in the real data (e.g. Karachi → "khi", "karachi").
- `extract_category()`, `extract_city()` — used both here and directly
  by `ai/intent.py`.
- Price extraction handles English (`"under 15000"`), Urdu-English
  mixed phrasing (`"budget"`, `"tak"`, `"andar"`, `"kam"`, `"sirf"`),
  and shorthand (`"15k"` → 15000).

**If category/price/city extraction breaks:** this is the file to fix.
It never calls Gemini — pure Python/regex logic only.

### `ai/context_builder.py`
Turns a list of ranked worker dicts into a single formatted text block
for the Gemini prompt (via `worker_serializer`). Also has
`build_empty_context()` (no matches) and `build_general_context()`
(static platform description) — note `build_general_context()` isn't
actually used by the RAG flow (which pulls from Qdrant instead), it's
a vestigial method kept for reference.

### `ai/worker_serializer.py`
Converts a raw MongoDB worker document into a clean, LLM-friendly
dict (formats price as a string, joins skill/badge arrays into text,
etc). Used by `context_builder.py`.

### `ai/llm.py`
Thin wrapper around the Gemini API using the current `google-genai`
SDK (not the deprecated `google-generativeai`). Exposes one function:
`generate(prompt) -> str`. Raises `GeminiQuotaExceededError`
specifically on HTTP 429 so `chat_service.py` can show a distinct
"we're rate-limited" message instead of a generic error.

### `ai/prompt.py`
Just `SYSTEM_PROMPT` — the constant instruction block prepended to
every Gemini call. Says to only use provided context, never invent
workers/prices/policies, and — important — to describe every worker
given even if unverified (your real data has no verified workers yet,
so an earlier version of this prompt caused Gemini to contradict the
actual results being shown).

---

## File Reference — `services/`

### `services/chat_service.py`
**The orchestrator.** Owns the `chat()` entry point and one handler
method per intent:
- `handle_worker_search()` — resolves filters *before* touching the
  DB; if no category is found, asks a clarifying question instead of
  running an unfiltered query (this used to be the "shows all gigs"
  bug). If filters resolve but zero workers match, returns a specific
  message naming the exact criteria used. On success, saves the
  worker list as message metadata (for history restoration) and
  returns both the Gemini summary and the structured worker list.
- `handle_policy()`, `handle_booking()`, `handle_general()` — all
  delegate to `generate_rag_response()`.
- `generate_rag_response()` — the shared Qdrant-based RAG path. Has a
  hard fallback: if Qdrant returns literally nothing, skips the
  Gemini call entirely and returns a canned "couldn't find that"
  message rather than letting Gemini improvise from nothing.
- Both worker-search and RAG paths catch `GeminiQuotaExceededError`
  separately from generic exceptions, for a clearer error message.

### `services/conversation_service.py`
All MongoDB persistence for chat history (`conversation_collection`).
Key methods: `add_message()` (accepts an optional `metadata` dict —
this is how worker cards get attached to a saved bot message),
`get_messages()`, `build_history()` (formats recent turns as plain
text for the Gemini prompt), `trim_messages()` (keeps only the last N
messages so history doesn't grow unbounded), `clear_conversation()`.

### `services/prompt_service.py`
Builds the actual prompt string sent to Gemini for each intent type
(`worker_search_prompt()`, `policy_prompt()`, `general_prompt()`,
etc). `chat_service.py` should never build a prompt string directly —
always go through this file, so instruction changes happen in one
place.

### `services/ranking_service.py`
Pure scoring/sorting logic, no I/O. Scores workers on rating,
experience, review count, badges, verification, and availability,
then `filter_low_scores()` drops anything below a minimum threshold
and `top_workers()` returns the best N.

### `services/worker_service.py`
The only file that talks to the `gigs` MongoDB collection for search
purposes. `search()` is the entry point used by `chat_service.py` —
**returns an empty list immediately if no category was resolved**,
rather than falling back to an unfiltered query (this was the root
cause of the "every worker query returns all gigs" bug). `build_query()`
uses case-insensitive regex matching for category/city/gender (your
real data has inconsistent casing and spelling — "Khi" vs "khi" vs
"Karachi ") rather than brittle exact-string equality.

---

## File Reference — `rag/`

### `rag/document_loader.py`
Recursively loads every `.txt` file under `documents/`, tagging each
with its filename and parent-folder name as `category` (this
"category" is just for payload bookkeeping in Qdrant — unrelated to
the worker categories in MongoDB).

### `rag/chunker.py`
Splits document text into ~500-character overlapping chunks using
LangChain's `RecursiveCharacterTextSplitter`, so retrieval can return
a focused paragraph instead of an entire document.

### `rag/embeddings.py`
Loads the sentence-embedding model used for both ingestion and
retrieval. Currently `intfloat/multilingual-e5-small` (384-dim,
supports Urdu/Roman Urdu/English — swapped from the original
English-only `BAAI/bge-small-en-v1.5`). **E5 models require an
instruction prefix** — `"passage: "` when embedding documents,
`"query: "` when embedding search queries. This is handled in
`ingest.py` and `retriever.py` respectively; don't call
`embedding_model.encode()` anywhere else without the correct prefix.

### `rag/ingest.py`
Reads all documents, chunks them, embeds each chunk (with the
`"passage: "` prefix), and uploads to Qdrant **in batches of 25** with
automatic retry on failure. (The original single-giant-upload approach
timed out against Qdrant Cloud over a slower connection — batching
fixed it.) Run via:
```bash
python -c "from rag.ingest import ingest; ingest()"
```

### `rag/retriever.py`
One function, `retrieve(query, limit=5)` — embeds the query (with the
`"query: "` prefix) and returns the top-N matching chunk payloads from
Qdrant.

### `rag/vector_store.py`
`create_collection()` (idempotent — no-ops if the collection already
exists), plus `insert_test_vector()` / `search_test()` debug helpers
(not used by the real pipeline, safe to ignore day-to-day).

---

## File Reference — `routes/`

### `routes/chat_routes.py`
Three endpoints under `/api/chat`:
- `POST /` — the main chat endpoint, calls `chat_service.chat()`.
- `GET /history/{session_id}` — returns the full saved conversation
  for a session, including any attached worker cards from metadata.
  Used by the frontend on mount so refreshing or navigating away and
  back doesn't lose the conversation.
- `DELETE /history/{session_id}` — deletes a stored conversation
  (used by the sidebar's per-chat delete button).

---

## File Reference — `config/` and `model/`

### `config/db.py`
MongoDB client + collection handles (`gig_collection`,
`conversation_collection`).

### `config/gemini.py`
Loads `GEMINI_MODEL` from `.env` into `MODEL_NAME`.

### `config/qdrant.py`
Qdrant client, with `timeout=60` explicitly set (the default ~5s
timeout was too short for batch uploads over a slower connection).

### `model/chat_model.py`
`ChatRequest` — the request body shape (`sessionId`, `message`).

### `model/chat_response.py`
`ChatResponse` — the response body shape (`success`, `intent`,
`message`, `workers_found`, `workers`, `sources`). **Note:** `sources`
is `List[str]`, so anything appended to it must never be `None` — a
stray Qdrant point missing a `filename` field caused a Pydantic crash
here once; `chat_service.py` filters those out defensively now.

### `model/conversation_model.py`
`Message` / `Conversation` Pydantic models — currently just documenting
shape, not actively enforced anywhere (MongoDB documents are read/
written as plain dicts via `conversation_service.py`).

---

## File Reference — `documents/`

Plain-text knowledge base ingested into Qdrant. Organized by folder
purely for your own navigation — the folder name becomes the `category`
payload field, but retrieval doesn't filter by it, it's pure semantic
search across everything.

- **`faq/faq.txt`** — general platform questions (what is HelpGhar,
  registration, verification, payments, disputes, multi-booking,
  budget search, etc).
- **`policies/*.txt`** — booking, cancellation, refund, and
  verification policy documents.
- **`services/*.txt`** — one file per worker category explaining what
  that service typically includes, pricing structure, and what to
  discuss before booking. **These filenames don't need to match the
  MongoDB category strings exactly** — they're just source text for
  Gemini to draw from when answering "what does X include" questions.

**When you add or edit a document, you must re-ingest** — see
[Common Tasks](#common-tasks-runbook) below. Editing the `.txt` file
alone does nothing until Qdrant is re-populated.

---

## Frontend — `ChatPage.tsx`

Single-file chat UI. Key pieces:
- **Session management** — a lightweight session list lives in
  `localStorage` (`helpghar-chat-sessions`), each entry just
  `{ id, title, updatedAt }`. The actual message content lives on the
  backend (`GET /api/chat/history/:id`), fetched on mount whenever the
  active session changes — this is what makes refresh/navigation-safe
  persistence work.
- **`renderMessageText()` / `renderInlineBold()`** — a small
  hand-rolled markdown renderer (bold + bullets only, not a full
  markdown library). Bullet lines that are entirely bold (e.g.
  `**Worker Name**`) are treated as section headers separating one
  worker's details from the next, and `Label: value` lines get the
  label dimmed and value emphasized for scannability.
- **`WorkerCardTile`** — renders a worker as a card with a "View
  Profile" link to `/workers/:id`, using the `id` field (Mongo `_id`)
  that `chat_service.py` includes in the `workers` array specifically
  for this purpose.

---

## The 9 Real Worker Categories

Confirmed via `gig_collection.distinct("category")` — **do not use
any other category names** in `CATEGORY_SYNONYMS`, prompts, or
documentation without updating the actual database first:

```
House Servants   Drivers          Baby Sitters
Cooks            Home Teachers    Watchmen
Electricians     Plumbers         Cleaners
```

(Earlier drafts of this project guessed at categories like "Tutor",
"Mechanic", "Carpenter", "Painter", "AC Technician" before the real
schema was confirmed — if you ever see those names anywhere, it's
leftover from that and should be corrected.)

---

## Common Tasks (Runbook)

### Add or edit a knowledge-base document
1. Edit/add the `.txt` file under `documents/`.
2. Clear and fully re-ingest (partial re-ingestion isn't supported —
   `ingest()` always re-embeds everything it finds, so leaving the old
   collection in place creates duplicate chunks):
   ```bash
   python clear_qdrant.py
   python -c "from rag.vector_store import create_collection; create_collection()"
   python -c "from rag.ingest import ingest; ingest()"
   ```

### Add a new worker category
1. Confirm the exact spelling stored in MongoDB (`check_worker_data.py`).
2. Add it to `CATEGORY_SYNONYMS` in `ai/filter_extractor.py` with
   likely phrasings (English + Roman Urdu).
3. Add a corresponding `documents/services/<category>.txt` file.
4. Re-ingest (see above).

### Add a new city
1. Add it to `CITY_ALIASES` in `ai/filter_extractor.py` with every
   spelling/abbreviation you expect (check actual DB values via
   `check_worker_data.py` first — city data has historically been
   messy).

### Debug why a worker search returns nothing
1. Check the terminal log for `Workers Found : N`.
2. If `N` is always 0 for a category that should have workers, run
   `check_worker_data.py` and confirm the category/city strings in
   `CATEGORY_SYNONYMS` / `CITY_ALIASES` actually match what's stored.
3. If filters aren't being extracted at all, test
   `ai.filter_extractor.extract_filters("your question")` directly in
   a Python shell to see what it resolves to.

### Debug why a policy/general answer seems off-topic
1. Run the retrieval test directly:
   ```python
   from rag.retriever import retrieve
   for doc in retrieve("your question", limit=5):
       print(doc.get("filename"), doc.get("text")[:100])
   ```
2. If the returned chunks are irrelevant, the knowledge base is either
   missing that content or needs a re-ingest.

---

## Known Limitations

- **Intent classification and filter extraction are keyword-based**,
  not semantic. Qdrant retrieval understands Urdu/Roman Urdu
  semantically now (multilingual embeddings), but routing a question
  to the right intent and extracting structured filters (category,
  city, price) still relies on recognizing specific words/phrases.
  Unusual phrasing can still fall through to the wrong intent.
- **No user-account scoping for chat sessions.** Sessions are
  identified by a random UUID stored in the browser's `localStorage`,
  not tied to a logged-in customer ID. This is fine for a single
  browser/device but won't sync across devices, and there's no way to
  list "all of a given user's sessions" server-side.
- **`gigs` collection has messy real-world data** (inconsistent city
  casing/spelling, all workers currently unverified). The code
  compensates for this (case-insensitive regex, honest prompt about
  verification status) but the underlying data quality is still worth
  cleaning up over time.

---

## Troubleshooting Log

Real issues hit during development, kept here so they're not
re-diagnosed from scratch next time:

| Symptom | Cause | Fix |
|---|---|---|
| "I'm sorry, something went wrong" on every general/policy question | `sources` field got `None` from a Qdrant point missing `filename` (a stray manual test point) | Filter `None` filenames before building `sources` list |
| Worker search always returns 0 or returns irrelevant workers | Category/city keyword lists didn't match real casing/spelling in MongoDB | Case-insensitive regex matching + `CATEGORY_SYNONYMS`/`CITY_ALIASES` built from actual DB values |
| `429 RESOURCE_EXHAUSTED` from Gemini | Free-tier daily quota (20 requests/day on `gemini-2.5-flash`) | Not a bug — either wait, enable billing, or use a cheaper model for dev |
| Bot says "couldn't find any verified X" while still showing workers | System prompt demanded "verified workers only" but real data has zero verified workers | Prompt now describes all workers honestly, noting verification status factually |
| Qdrant upload times out (`WriteTimeout`) | Uploading all chunks in one giant request against the default ~5s client timeout | Batch uploads (25 at a time) + `timeout=60` on the Qdrant client |
| Worker cards disappear after refresh / navigating to a profile and back | Chat history persistence only saved message text, not the attached `workers` array | Workers are now saved as message `metadata` and restored via the history endpoint |
| `**bold**` showing literally instead of rendering | Frontend rendered Gemini's markdown as raw text | Added a lightweight bold/bullet renderer in `ChatPage.tsx` |