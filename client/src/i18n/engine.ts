/**
 * Runtime translation engine (English / اردو / Roman Urdu).
 *
 * The app's UI text is written inline in ~100 components, so instead of
 * threading t() through every one of them, this engine translates the
 * rendered DOM: every text node and a few attributes (placeholder, title,
 * alt, aria-label) are looked up in a dictionary keyed by the English
 * source text. A MutationObserver keeps newly rendered content (route
 * changes, dialogs, toasts, API-driven lists) translated, and the original
 * English is remembered so switching back is lossless.
 *
 * Text that is not in the dictionary (user names, descriptions, data that
 * comes from the database) is left exactly as is.
 */

import { useSyncExternalStore } from "react";
import ur from "./ur";
import roman from "./roman";

export type Lang = "en" | "ur" | "roman";

export const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "ur", label: "اردو", short: "اردو" },
  { id: "roman", label: "Roman Urdu", short: "Roman" },
];

const STORAGE_KEY = "hg-lang";
const ATTRS = ["placeholder", "title", "alt", "aria-label"] as const;

const DICTS: Record<Exclude<Lang, "en">, Record<string, string>> = { ur, roman };

interface Pattern {
  regex: RegExp;
  literal: number;
  value: string;
}

const PATTERNS: Record<Exclude<Lang, "en">, Pattern[]> = { ur: [], roman: [] };
const cache: Record<Exclude<Lang, "en">, Map<string, string | null>> = {
  ur: new Map(),
  roman: new Map(),
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

(["ur", "roman"] as const).forEach((lang) => {
  const entries: Pattern[] = [];
  for (const [key, value] of Object.entries(DICTS[lang])) {
    if (!key.includes("{n}")) continue;
    const parts = key.split("{n}");
    const source = parts.map(escapeRegex).join("(.*?)");
    entries.push({
      regex: new RegExp(`^${source}$`),
      literal: parts.join("").length,
      value,
    });
  }
  // The most specific (longest literal) pattern wins.
  entries.sort((a, b) => b.literal - a.literal);
  PATTERNS[lang] = entries;
});

export function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ur" || stored === "roman" || stored === "en") return stored;
  } catch {
    /* storage blocked */
  }
  return "en";
}

let current: Lang = readLang();
const listeners = new Set<() => void>();

export const getLang = () => current;

/** Translate one string (without surrounding whitespace handling). */
function lookup(core: string, lang: Exclude<Lang, "en">): string | null {
  const memo = cache[lang];
  if (memo.has(core)) return memo.get(core)!;

  let result: string | null = DICTS[lang][core] ?? null;

  // Labels like "customer" are often styled with CSS `capitalize`, so the
  // DOM text is lowercase while the dictionary key is "Customer".
  if (result === null && /^[a-z]/.test(core)) {
    const capitalised = core[0].toUpperCase() + core.slice(1);
    result = DICTS[lang][capitalised] ?? null;
    if (result !== null && lang === "roman") result = result[0].toLowerCase() + result.slice(1);
  }

  if (result === null) {
    for (const pattern of PATTERNS[lang]) {
      const match = core.match(pattern.regex);
      if (match) {
        let index = 1;
        result = pattern.value.replace(/\{n\}/g, () => match[index++] ?? "");
        break;
      }
    }
  }

  if (memo.size > 5000) memo.clear();
  memo.set(core, result);
  return result;
}

/** Translate arbitrary text to the active language (for use in code). */
export function translate(text: string, lang: Lang = current): string {
  if (lang === "en" || !text) return text;
  const core = text.replace(/\s+/g, " ").trim();
  if (!core) return text;
  const hit = lookup(core, lang);
  if (hit === null) return text;
  const lead = text.match(/^\s*/)![0];
  const trail = text.match(/\s*$/)![0];
  return lead + hit + trail;
}

/* ---------------- DOM translation ---------------- */

const originalText = new WeakMap<Node, string>();
const writtenText = new WeakMap<Node, string>();
const originalAttrs = new WeakMap<Element, Record<string, string>>();
const writtenAttrs = new WeakMap<Element, Record<string, string>>();

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "CANVAS"]);

function skipped(el: Element | null): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName.toUpperCase())) return true;
    if (node.getAttribute("translate") === "no" || node.classList.contains("notranslate")) return true;
    if ((node as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function applyToText(node: Text) {
  const value = node.nodeValue ?? "";
  const known = originalText.get(node);

  // If React (or anything else) rewrote the node, its value is no longer
  // what we wrote -- treat the new value as the fresh English source.
  const source = known !== undefined && writtenText.get(node) === value ? known : value;
  if (source !== value || known === undefined) originalText.set(node, source);

  if (skipped(node.parentElement)) return;

  const next = current === "en" ? source : translate(source, current);
  if (next !== value) {
    node.nodeValue = next;
    writtenText.set(node, next);
  } else if (current === "en") {
    writtenText.delete(node);
  }
}

function applyToAttrs(el: Element) {
  if (skipped(el)) return;
  const originals = originalAttrs.get(el) ?? {};
  const written = writtenAttrs.get(el) ?? {};

  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (value === null) continue;
    const source = originals[attr] !== undefined && written[attr] === value ? originals[attr] : value;
    originals[attr] = source;
    const next = current === "en" ? source : translate(source, current);
    if (next !== value) {
      el.setAttribute(attr, next);
      written[attr] = next;
    }
  }

  originalAttrs.set(el, originals);
  writtenAttrs.set(el, written);
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    applyToText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const element = root as Element;
  if (SKIP_TAGS.has(element.tagName.toUpperCase())) return;
  applyToAttrs(element);

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) =>
      n.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has((n as Element).tagName.toUpperCase())
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });

  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) applyToText(n as Text);
    else applyToAttrs(n as Element);
    n = walker.nextNode();
  }
}

let observer: MutationObserver | null = null;

function observe() {
  observer?.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
}

function onMutations(records: MutationRecord[]) {
  // Our own writes must not re-trigger us.
  observer?.disconnect();
  try {
    for (const record of records) {
      if (record.type === "childList") {
        record.addedNodes.forEach((n) => walk(n));
      } else if (record.type === "characterData") {
        applyToText(record.target as Text);
      } else if (record.type === "attributes") {
        applyToAttrs(record.target as Element);
      }
    }
  } finally {
    observe();
  }
}

function applyDocument() {
  document.documentElement.lang = current === "ur" ? "ur" : current === "roman" ? "ur-Latn" : "en";
  document.documentElement.dir = current === "ur" ? "rtl" : "ltr";
  document.documentElement.dataset.lang = current;

  observer?.disconnect();
  try {
    walk(document.body);
    if (!originalTitle) originalTitle = document.title;
    document.title = current === "en" ? originalTitle : translate(originalTitle, current);
  } finally {
    observe();
  }
}

let originalTitle = "";

export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage blocked */
  }
  applyDocument();
  listeners.forEach((l) => l());
}

/** Call once at startup, after the root element exists. */
export function initI18n() {
  originalTitle = document.title;
  observer = new MutationObserver(onMutations);
  applyDocument();
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => "en" as Lang
  );
}
