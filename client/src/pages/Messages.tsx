import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesSquare, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { customerItems } from "@/data/customerMenu";
import { workerItems } from "@/data/workerMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HgAlert } from "@/components/ui/HgAlert";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageThread } from "@/components/chat/MessageThread";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import {
  messagingService,
  type ChatParticipant,
} from "@/services/messagingService";

/**
 * Inbox + conversation, in the two-pane layout every marketplace uses.
 *
 * Desktop shows both panes side by side. Below `md` only one is on screen at
 * a time -- the list, or the open conversation with a back button -- because
 * a 360px-wide split view is unusable for both.
 */
export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const threads = useChatStore((state) => state.threads);
  const threadsLoading = useChatStore((state) => state.threadsLoading);
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const messagesByThread = useChatStore((state) => state.messagesByThread);
  const pagingByThread = useChatStore((state) => state.pagingByThread);
  const typingByThread = useChatStore((state) => state.typingByThread);
  const connection = useChatStore((state) => state.connection);

  const [contacts, setContacts] = useState<ChatParticipant[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    actionLabel: "",
    onAction: () => undefined,
  });

  const myRole = user?.role === "worker" ? "worker" : "customer";

  const activeThread = useMemo(
    () => threads.find((thread) => thread.threadId === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  // ------------------------------------------------------------------
  // Deep links: /messages?worker=HGW-007 (or ?customer=…&booking=…)
  //
  // How "Message this worker" arrives from a profile or booking card. The
  // thread is created on demand and opened, then the params are dropped so a
  // refresh or a Back doesn't re-run it.
  // ------------------------------------------------------------------
  const handledDeepLink = useRef<string | null>(null);

  useEffect(() => {
    const workerId = searchParams.get("worker");
    const customerId = searchParams.get("customer");
    const bookingId = searchParams.get("booking") ?? undefined;
    const threadId = searchParams.get("thread");

    const key = `${workerId ?? ""}|${customerId ?? ""}|${threadId ?? ""}`;

    if (key === "||") {
      // Params were just cleared (either by us below, or the user navigated
      // here plainly). Forgetting what we handled is what lets the *same*
      // deep link work a second time -- otherwise tapping "Message Ali" on
      // his profile twice in one session silently does nothing the second
      // time.
      handledDeepLink.current = null;
      return;
    }

    if (handledDeepLink.current === key) return;

    handledDeepLink.current = key;

    const { startThread, openThread } = useChatStore.getState();

    const open = async () => {
      try {
        if (threadId) {
          await openThread(threadId);
          return;
        }

        const thread = await startThread({
          ...(workerId ? { workerId } : {}),
          ...(customerId ? { customerId } : {}),
          bookingId,
        });

        await openThread(thread.threadId);
      } catch (error: any) {
        toast.error(error?.message ?? "Could not open that conversation.");
      } finally {
        setSearchParams({}, { replace: true });
      }
    };

    open();
  }, [searchParams, setSearchParams]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const openPicker = async () => {
    setPickerOpen(true);

    if (contacts) return;

    try {
      setContacts(await messagingService.contacts());
    } catch {
      setContacts([]);
    }
  };

  const startWith = async (person: ChatParticipant) => {
    setPickerOpen(false);

    try {
      const thread = await useChatStore.getState().startThread(
        person.role === "worker"
          ? { workerId: person.id }
          : { customerId: person.id }
      );

      await useChatStore.getState().openThread(thread.threadId);
    } catch (error: any) {
      toast.error(error?.message ?? "Could not start that conversation.");
    }
  };

  const confirmClearThread = (threadId: string, name: string) => {
    setConfirm({
      open: true,
      title: "Delete this conversation?",
      description: `It will be removed from your inbox. ${name} keeps their copy, and a new message will bring the conversation back.`,
      actionLabel: "Delete",
      onAction: () => {
        useChatStore
          .getState()
          .clearThread(threadId)
          .then(() => toast.success("Conversation deleted"))
          .catch((error: any) =>
            toast.error(error?.message ?? "Could not delete the conversation.")
          );
      },
    });
  };

  const confirmDeleteMessage = (threadId: string, messageId: string) => {
    setConfirm({
      open: true,
      title: "Delete this message?",
      description:
        "It will be removed for both of you and replaced with “This message was deleted”.",
      actionLabel: "Delete",
      onAction: () => {
        useChatStore
          .getState()
          .deleteMessage(threadId, messageId)
          .catch((error: any) =>
            toast.error(error?.message ?? "Could not delete the message.")
          );
      },
    });
  };

  const toggleBlock = (threadId: string, blocked: boolean, name: string) => {
    if (!blocked) {
      useChatStore
        .getState()
        .setBlocked(threadId, false)
        .then(() => toast.success(`${name} unblocked`))
        .catch((error: any) => toast.error(error?.message ?? "Could not unblock."));
      return;
    }

    setConfirm({
      open: true,
      title: `Block ${name}?`,
      description:
        "Neither of you will be able to send messages in this conversation until you unblock them.",
      actionLabel: "Block",
      onAction: () => {
        useChatStore
          .getState()
          .setBlocked(threadId, true)
          .then(() => toast.success(`${name} blocked`))
          .catch((error: any) => toast.error(error?.message ?? "Could not block."));
      },
    });
  };

  const paging = activeThreadId ? pagingByThread[activeThreadId] : undefined;

  return (
    <DashboardLayout
      title={myRole === "worker" ? "Worker" : "Customer"}
      items={myRole === "worker" ? workerItems : customerItems}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">Messages</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {myRole === "worker"
                ? "Talk to customers before and during a job."
                : "Chat with workers before you book, and stay in touch after."}
            </p>
          </div>

          {connection !== "open" && connection !== "idle" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" />
              {connection === "connecting" ? "Connecting…" : "Reconnecting…"}
            </span>
          )}
        </div>

        {/*
          A fixed viewport-relative height, not `flex-1`: this sits inside the
          dashboard's normal document flow, so without one the message list
          would grow the page instead of scrolling inside its own pane.
        */}
        <div className="grid h-[calc(100vh-15rem)] min-h-[28rem] overflow-hidden rounded-3xl border border-border bg-card shadow-soft md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div
            className={`min-h-0 border-border md:block md:border-r ${
              activeThreadId ? "hidden" : "block"
            }`}
          >
            <ConversationList
              threads={threads}
              loading={threadsLoading}
              activeThreadId={activeThreadId}
              myRole={myRole}
              typingByThread={typingByThread}
              onSelect={(threadId) => useChatStore.getState().openThread(threadId)}
              onNewMessage={openPicker}
            />
          </div>

          <div
            className={`min-h-0 md:block ${activeThreadId ? "block" : "hidden"}`}
          >
            {activeThread ? (
              <MessageThread
                thread={activeThread}
                messages={messagesByThread[activeThread.threadId] ?? []}
                myRole={myRole}
                loading={!!paging?.loading && !paging?.loaded}
                hasMore={!!paging?.hasMore}
                loadingOlder={!!paging?.loading && !!paging?.loaded}
                typing={!!typingByThread[activeThread.threadId]}
                onBack={() => useChatStore.getState().closeThread()}
                onLoadOlder={() =>
                  useChatStore.getState().loadOlderMessages(activeThread.threadId)
                }
                onSend={(text) =>
                  useChatStore.getState().sendMessage(activeThread.threadId, text)
                }
                onSendFiles={(files, text) =>
                  useChatStore
                    .getState()
                    .sendAttachments(activeThread.threadId, files, text)
                }
                onTyping={(isTyping) =>
                  useChatStore
                    .getState()
                    .sendTyping(activeThread.threadId, isTyping)
                }
                onDeleteMessage={(messageId) =>
                  confirmDeleteMessage(activeThread.threadId, messageId)
                }
                onRetryMessage={(clientId) =>
                  useChatStore
                    .getState()
                    .retryMessage(activeThread.threadId, clientId)
                }
                onClearThread={() =>
                  confirmClearThread(
                    activeThread.threadId,
                    activeThread.participant.name
                  )
                }
                onToggleBlock={(blocked) =>
                  toggleBlock(
                    activeThread.threadId,
                    blocked,
                    activeThread.participant.name
                  )
                }
              />
            ) : (
              <div className="hidden h-full flex-col items-center justify-center gap-3 px-8 text-center md:flex">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessagesSquare className="h-7 w-7" />
                </div>
                <p className="text-lg font-bold">Your messages</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Pick a conversation on the left, or start a new one from a
                  {myRole === "worker" ? " customer's booking" : " worker's profile"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- New message picker ---------- */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>
              {myRole === "worker"
                ? "Customers you have worked with, who you haven't messaged yet."
                : "Workers you have booked, who you haven't messaged yet."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto">
            {contacts === null && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            )}

            {contacts?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No one new to message yet.
                {myRole === "customer" &&
                  " Open a worker's profile and tap Message to start a conversation."}
              </p>
            )}

            <ul className="space-y-1">
              {contacts?.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => startWith(person)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-accent"
                  >
                    <ChatAvatar
                      name={person.name}
                      src={person.avatar}
                      online={person.online}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {person.name}
                      </p>
                      {person.category && (
                        <p className="truncate text-xs text-muted-foreground">
                          {person.category}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <HgAlert
        open={confirm.open}
        onClose={() => setConfirm((state) => ({ ...state, open: false }))}
        type="warning"
        title={confirm.title}
        description={confirm.description}
        actionLabel={confirm.actionLabel}
        onAction={confirm.onAction}
        cancelLabel="Cancel"
      />
    </DashboardLayout>
  );
}
