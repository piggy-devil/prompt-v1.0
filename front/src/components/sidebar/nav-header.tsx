"use client";

import { SidebarIcon } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function NavHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4 justify-between">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
