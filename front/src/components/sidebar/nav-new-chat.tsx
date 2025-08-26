"use client";

import { useRouter } from "next/navigation";
import { SquarePenIcon } from "lucide-react";
import { SidebarGroup, SidebarMenuButton } from "../ui/sidebar";

export const NavNewChat = () => {
  const router = useRouter();

  const handleNewChat = async () => {
    router.push("/prompt-chat");
  };

  return (
    <SidebarGroup>
      <SidebarMenuButton
        size="lg"
        onClick={handleNewChat}
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer"
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
          <SquarePenIcon className="mr-2 size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">เริ่มแชทใหม่</span>
        </div>
      </SidebarMenuButton>
    </SidebarGroup>
  );
};
