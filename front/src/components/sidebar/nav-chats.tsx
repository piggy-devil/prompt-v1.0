"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { USER_CHATS_KEY, useUserChats } from "@/hooks/use-user-chats";

export function NavChats() {
  const router = useRouter();
  const { chats } = useUserChats();
  const { isMobile } = useSidebar();

  if (chats.length === 0) {
    return <></>;
  }

  const handleChatDelete = async (userId: string, chatId: string) => {
    const confirmed = confirm("Are you sure you want to delete this chat?");
    if (!confirmed) return;

    await fetch(`/api/prompt-chat/${chatId}`, {
      method: "DELETE",
    });

    await fetch(
      process.env.NEXT_PUBLIC_IS_PRODUCTION === "true"
        ? "/apib/chat/delete"
        : `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/apib/chat/delete`,
      {
        // await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/apib/chat/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          chat_session_id: chatId,
        }),
      }
    );

    mutate(USER_CHATS_KEY); // รีโหลดแชททั้งหมดหลังลบ

    router.push("/prompt-chat");
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        {chats.length > 0 && chats.length == 1 ? "Chat" : "Chats"}
      </SidebarGroupLabel>
      <SidebarMenu>
        {chats.length > 0 &&
          chats.map((chat: any) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton asChild>
                <Link href={`/prompt-chat/${chat.id}`}>
                  <span className="truncate max-w-[160px]">
                    {chat.title || "Untitled Chat"}
                  </span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  className="hover:cursor-pointer focus-visible:outline-none focus-visible:ring-0 ring-0"
                >
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-32 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    className="flex items-center justify-center gap-2 cursor-pointer data-[highlighted]:bg-red-500/10"
                    onClick={() => handleChatDelete(chat.userId, chat.id)}
                  >
                    <Trash2
                      className="w-4 h-4 text-muted-foreground"
                      color="#fb2c36"
                    />
                    <span className="text-red-500">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
