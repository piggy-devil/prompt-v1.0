"use client";

import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { USER_CHATS_KEY } from "@/hooks/use-user-chats";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  ChatMessage,
  Message,
} from "@/app/(platform)/_components/chat-message";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function PromptChatIdPage() {
  const { chatId } = useParams();

  const [inputValue, setInputValue] = useState("");

  const [model, setModel] = useState<string>("");

  const [pending, startTransition] = useTransition();

  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useCurrentUser();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasRun = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    startTransition(async () => {
      const res = await fetch(`/api/prompt-chat/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputValue,
          role: "HUMAN",
        }),
      });

      mutate(USER_CHATS_KEY);

      const newMessage = await res.json();
      // const userMessageId = newMessage.id || "";

      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");

      const aiMessageId = uuidv4();

      try {
        const startTime = performance.now();

        const res = await fetch(
          process.env.NEXT_PUBLIC_IS_PRODUCTION === "true"
            ? "/apib/llm/search-rag/chat"
            : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/apib/llm/search-rag/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user?.id,
              chat_session_id: chatId as string,
              prompt: inputValue,
              model,
              stream: true,
            }),
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`Streaming request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let done = false;
        let aiContent = "";

        const timeToCreate = new Date().toISOString();

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value || new Uint8Array(), {
            stream: true,
          });
          aiContent += chunk;

          // ❗ แสดงผลระหว่าง AI กำลังตอบ
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "AI_TEMP"), // ลบอันเก่าออกก่อน
            {
              id: "ai-temp",
              chatSessionId: chatId as string,
              content: aiContent,
              createdAt: timeToCreate,
              role: "AI_TEMP", // แบบชั่วคราว
            },
          ]);
        }

        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000;

        // 🔁 เมื่อ stream จบ ค่อยเปลี่ยน role ให้เป็น "AI" จริง ๆ
        setMessages((prev) =>
          prev
            .filter((m) => m.role !== "AI_TEMP")
            .concat({
              id: aiMessageId,
              chatSessionId: chatId as string,
              content: aiContent.trim(),
              createdAt: timeToCreate,
              role: "AI",
              responseTime: responseTime,
            })
        );

        await fetch(`/api/prompt-chat/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: aiContent.trim(),
            role: "AI",
          }),
        });
      } catch (error) {
        console.error("Streaming error:", error);

        const errorMessage: Message = {
          id: uuidv4(),
          chatSessionId: chatId as string,
          role: "SYSTEM",
          content: "Sorry, I encountered an error processing your request.",
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/prompt-chat/${chatId}/messages`, {
        method: "GET",
      });
      const data = await res.json();

      setMessages(data);
    };

    if (chatId) fetchMessages();
  }, [chatId]);

  // 🔹 โหลดค่าจาก localStorage เมื่อ component ถูก mount
  useEffect(() => {
    const savedModel = localStorage.getItem("chat_selected_model");
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  // 🔹 อัปเดต localStorage ทุกครั้งที่ model เปลี่ยน
  useEffect(() => {
    localStorage.setItem("chat_selected_model", model);
  }, [model]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (hasRun.current) return;

    const initialPrompt = searchParams.get("initial");
    const prompt = searchParams.get("input");

    if (!chatId || initialPrompt !== "true" || !prompt || !user?.id) return;

    hasRun.current = true; // ✅ ตั้งค่าว่ารันแล้ว ตั้งไว้ตรงนี้ก่อนจะ fetch

    const aiMessageId = uuidv4();
    const timeToCreate = new Date().toISOString();

    startTransition(async () => {
      try {
        const startTime = performance.now();

        const res = await fetch(
          process.env.NEXT_PUBLIC_IS_PRODUCTION === "true"
            ? "/apib/llm/search-rag/chat"
            : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/apib/llm/search-rag/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              chat_session_id: chatId as string,
              prompt,
              model,
              stream: true,
            }),
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`Streaming request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let done = false;
        let aiContent = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value || new Uint8Array(), {
            stream: true,
          });
          aiContent += chunk;

          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "AI_TEMP"),
            {
              id: "ai-temp",
              chatSessionId: chatId as string,
              content: aiContent,
              createdAt: timeToCreate,
              role: "AI_TEMP",
            },
          ]);
        }

        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000;

        setMessages((prev) =>
          prev
            .filter((m) => m.role !== "AI_TEMP")
            .concat({
              id: aiMessageId,
              chatSessionId: chatId as string,
              content: aiContent.trim(),
              createdAt: timeToCreate,
              role: "AI",
              responseTime,
            })
        );

        await fetch(`/api/prompt-chat/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: aiContent.trim(),
            role: "AI",
          }),
        });

        // ✅ ลบ query param `initial` และ `input` จาก URL
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("initial");
        newParams.delete("input");

        const newUrl =
          newParams.toString().length > 0
            ? `${pathname}?${newParams.toString()}`
            : pathname;

        router.replace(newUrl);
      } catch (error) {
        console.error("Streaming error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            chatSessionId: chatId as string,
            role: "SYSTEM",
            content: "Sorry, I encountered an error processing your request.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
  }, [chatId, model, pathname, router, searchParams, user?.id]);

  return (
    <main className="flex flex-col h-full">
      <div className="flex flex-col p-0 overflow-y-auto pb-24 max-w-2xl">
        <div className="flex-grow space-y-2">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          <div ref={messagesEndRef} />

          {pending && (
            <div className="flex items-center px-4 py-2">
              <div className="text-sm text-muted-foreground">
                <span className="animate-pulse">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 w-full px-4 pb-2 mt-auto mx-auto">
        <Card className="border rounded-xl overflow-hidden p-2 mt-4 max-w-2xl mx-auto">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              disabled={pending}
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none py-4 px-2 h-auto text-base resize-none"
              placeholder="เริ่มคำถามของคุณ..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage().finally(() => {
                    textareaRef.current?.focus();
                  });
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Select value={model} onValueChange={setModel} disabled={pending}>
                <SelectTrigger className="border-0 bg-transparent px-3 py-1.5 h-9 w-auto gap-1 text-sm cursor-pointer">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="llama3.2">llama3.2</SelectItem>
                  <SelectItem value="gemma3:4b">gemma3:4b</SelectItem>
                  <SelectItem value="deepseek-r1:1:5b">
                    deepseek-r1:1:5b
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="icon"
                className="rounded-full size-8 bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || pending}
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
        <span className="flex items-center justify-center font-medium text-xs pt-2 text-slate-500">
          ผลงาน 1 ฝ่าย 1 นวัตกรรม ฝ่ายยุทธศาสตร์และนวัตกรรมดิจิทัล (ฝยท.)
        </span>
      </div>
    </main>
  );
}
