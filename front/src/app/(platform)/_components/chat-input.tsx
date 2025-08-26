"use client";

import { mutate } from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { USER_CHATS_KEY } from "@/hooks/use-user-chats";

interface ChatInputProps {
  selectedModel?: string;
}

const MODEL_STORAGE_KEY = "chat_selected_model";

export const ChatInput = ({ selectedModel = "gemma3:4b" }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const [model, setModel] = useState<string>(selectedModel);

  const [pending, startTransition] = useTransition();

  const router = useRouter();

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    startTransition(async () => {
      const newChatSession = await fetch("/api/prompt-chat/new", {
        method: "POST",
      });

      const data = await newChatSession.json();

      await fetch(`/api/prompt-chat/${data.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputValue,
          role: "HUMAN",
        }),
      });

      mutate(USER_CHATS_KEY);

      // router.push(`/prompt-chat/${data.id}?initial=true`);
      router.push(
        `/prompt-chat/${data.id}?initial=true&input=${encodeURIComponent(
          inputValue
        )}`
      );
    });
  };

  // 🔹 โหลดค่าจาก localStorage เมื่อ component ถูก mount
  useEffect(() => {
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  // 🔹 อัปเดต localStorage ทุกครั้งที่ model เปลี่ยน
  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, [model]);

  return (
    <Card className="border rounded-xl overflow-hidden p-2 mt-4 max-w-2xl mx-auto">
      <div className="flex items-end gap-2">
        <Textarea
          disabled={pending}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none py-4 px-2 h-auto text-base resize-none"
          placeholder="เริ่มคำถามของคุณ..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
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
              <SelectItem value="deepseek-r1:1:5b">deepseek-r1:1:5b</SelectItem>
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
  );
};
