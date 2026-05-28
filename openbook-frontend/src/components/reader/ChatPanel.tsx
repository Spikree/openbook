import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { OpenBook } from "@/store/openBookStore";
import { useOpenBookStore } from "@/store/openBookStore";
import { Button } from "@/components/ui/button";
import {
  SendHorizonal,
  Bot,
  User,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import ReactMarkdown from "react-markdown";
import { useTTS } from "@/hooks/useTTS";

interface ChatPanelProps {
  openBook: OpenBook;
}

export function ChatPanel({ openBook }: ChatPanelProps) {
  const { addMessage, clearConversation } = useOpenBookStore();
  const { pendingChatMessage, setPendingChatMessage } = useUIStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { speak, stop, isSpeaking } = useTTS();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [openBook.conversations, streamingContent]);

  const handleSpeak = (id: string, content: string) => {
    if (speakingId === id && isSpeaking) {
      stop();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      speak(content, () => setSpeakingId(null));
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    addMessage(openBook.id, userMessage);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      await api.chat(
        openBook.id,
        userMessage.content,
        openBook.selectedDocumentIds,
        openBook.conversations.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        (full) => {
          addMessage(openBook.id, {
            id: crypto.randomUUID(),
            role: "assistant",
            content: full,
            createdAt: new Date().toISOString(),
          });
          setStreamingContent("");
          setIsLoading(false);
        },
      );
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  useEffect(() => {
    if (pendingChatMessage) {
      const msg = pendingChatMessage;
      setPendingChatMessage(null);
      setTimeout(() => handleSendMessage(msg), 0);
    }
  }, [pendingChatMessage]);

  const handleSend = async () => {
    await handleSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <p className="text-xs text-muted-foreground">
          {openBook.selectedDocumentIds.length} document
          {openBook.selectedDocumentIds.length !== 1 ? "s" : ""} selected
        </p>
        {openBook.conversations.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive"
            onClick={() => clearConversation(openBook.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {openBook.conversations.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Bot className="w-8 h-8 opacity-20" />
            <p className="text-sm">Ask anything about your documents</p>
            <p className="text-xs opacity-60">
              Select text anywhere to explain, simplify or define
            </p>
          </div>
        ) : (
          <>
            {openBook.conversations.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}

                {msg.role === "assistant" ? (
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className="rounded-xl px-3 py-2 text-sm bg-muted text-foreground">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                    >
                      {speakingId === msg.id && isSpeaking ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          Listen
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-primary text-primary-foreground">
                    {msg.content}
                  </div>
                )}

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-muted text-foreground">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-1 h-3 bg-primary ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {isLoading && !streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              openBook.selectedDocumentIds.length === 0
                ? "Select documents first..."
                : "Ask about your documents..."
            }
            disabled={openBook.selectedDocumentIds.length === 0}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary max-h-32 overflow-y-auto disabled:opacity-50"
            style={{ minHeight: "38px" }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={
              !input.trim() ||
              isLoading ||
              openBook.selectedDocumentIds.length === 0
            }
            className="shrink-0"
          >
            <SendHorizonal className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
