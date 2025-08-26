import { cn } from "@/lib/utils";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

export type Message = {
  id: string;
  chatSessionId: string;
  content: string;
  createdAt: string;
  role: "HUMAN" | "AI" | "SYSTEM" | "AI_TEMP" | "HUMAN_TEMP";
  responseTime?: number;
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "HUMAN";

  return (
    <div
      className={cn("flex gap-3 p-4", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex max-w-xl gap-3",
          isUser ? "flex-row-reverse items-end" : "items-start"
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm",
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <span className="font-medium">{isUser ? "You" : "Ai"}</span>
            <span>
              {new Date(message.createdAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Content */}
          <div
            className={cn(
              "relative text-sm dark:text-white whitespace-pre-wrap break-words leading-relaxed mt-1",
              isUser ? "" : "font-mono"
            )}
            style={{ overflowWrap: "anywhere" }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.role === "AI_TEMP" && (
              <span className="animate-pulse">▍</span>
            )}
            {message.responseTime && (
              <div className="absolute bottom-0 right-2 text-[10px] text-muted-foreground pr-1 pb-1 translate-3.5">
                ⏱ {message.responseTime.toFixed(2)}s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
