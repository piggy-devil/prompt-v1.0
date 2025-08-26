"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavChats } from "./nav-chats";
import { LogoSidebar } from "./logo-sidebar";
import { NavUser } from "./nav-user";
import { useSession } from "@/lib/auth-client";
import { NavNewChat } from "./nav-new-chat";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useSession();

  const user = data?.user;

  return (
    <Sidebar
      collapsible="icon"
      // className="overflow-hidden *:data-[sidebar=sidebar]:flex-col"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <LogoSidebar />
      </SidebarHeader>
      <SidebarContent>
        <NavNewChat />
        <NavChats />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            name={user?.name}
            email={user?.email}
            avatar={user?.image || undefined}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
