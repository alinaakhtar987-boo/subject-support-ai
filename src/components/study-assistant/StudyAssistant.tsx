import { useCallback, useRef, useState } from "react";
import { BookOpen, Brain, Calculator, GraduationCap, Minus, Trash2, X } from "lucide-react";

import logo from "@/assets/study-assistant-logo.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { label: "Ask a Question", icon: BookOpen, prompt: "I have a question about my studies: " },
  { label: "Explain a Topic", icon: Brain, prompt: "Please explain this topic step by step: " },
  { label: "Solve a Problem", icon: Calculator, prompt: "Help me solve this problem step by step: " },
  { label: "Exam Help", icon: GraduationCap, prompt: "Help me prepare for my exam on: " },
];

const newId = () => Math.random().toString(36).slice(2);

export function StudyAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      const userMessage: ChatMessage = { id: newId(), role: "user", content: trimmed };
      const history = [...messages, userMessage];
      setMessages(history);
      setInput("");
      setLoading(true);

      const assistantId = newId();
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "The assistant could not respond. Please try again.");
        }

        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const handleSubmit = (message: PromptInputMessage) => {
    void send(message.text ?? input);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Study Assistant chat"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="relative flex size-6 items-center justify-center rounded-full bg-accent/20">
            <GraduationCap className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-accent" />
          </span>
          <span className="hidden sm:inline">Study Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end sm:inset-x-auto sm:bottom-5 sm:right-5">
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card shadow-elevated sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[420px] sm:rounded-2xl lg:w-[440px]">
            <header className="flex items-center gap-3 border-b border-border bg-gradient-header px-4 py-3">
              <img
                src={logo}
                alt="Study Assistant logo"
                width={512}
                height={512}
                loading="lazy"
                className="size-9 rounded-lg bg-card/90 p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-primary-foreground">
                  Study Assistant
                </p>
                <p className="truncate text-xs text-primary-foreground/70">
                  Any subject · English, اردو, Roman Urdu
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear chat"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                className="size-8 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Minimize chat"
                onClick={() => setOpen(false)}
                className="size-8 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Minus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="size-8 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <X className="size-4" />
              </Button>
            </header>

            <Conversation className="flex-1">
              <ConversationContent className="gap-4 px-4 py-4">
                {messages.length === 0 && (
                  <div className="rounded-xl border border-border bg-muted/50 p-4">
                    <p className="font-display text-base font-semibold text-foreground">
                      Assalam-o-Alaikum! 👋
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      I can help with Computer Science, Engineering, Medical, Business, Maths,
                      Physics, Chemistry, Biology, English and more. Ask in English, Urdu or Roman
                      Urdu.
                    </p>
                  </div>
                )}

                {messages.map((message) =>
                  message.role === "assistant" ? (
                    <Message key={message.id} from="assistant">
                      <MessageContent className="bg-transparent p-0 text-sm">
                        <MessageResponse>{message.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message key={message.id} from="user">
                      <MessageContent className="bg-primary text-sm text-primary-foreground">
                        {message.content}
                      </MessageContent>
                    </Message>
                  ),
                )}

                {loading && messages[messages.length - 1]?.role === "user" && (
                  <Shimmer className="text-sm">Thinking...</Shimmer>
                )}

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="border-t border-border bg-card px-3 pb-3 pt-2.5">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/15"
                  >
                    <action.icon className="size-3.5 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>

              <PromptInput onSubmit={handleSubmit}>
                <PromptInputTextarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask anything about your studies..."
                />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit
                    status={loading ? "streaming" : "ready"}
                    disabled={loading || input.trim().length === 0}
                  />
                </PromptInputFooter>
              </PromptInput>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                AI can make mistakes — always verify important answers.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
