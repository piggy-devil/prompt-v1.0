import Link from "next/link";
import React from "react";
import Image from "next/image";
import { SidebarMenuButton } from "../ui/sidebar";

export const LogoSidebar = () => {
  return (
    <Link href="/">
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer"
      >
        <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <Image
            src="/logo-mwa.png"
            width={200}
            height={200}
            alt="logo of mwa"
            className="size-8"
          />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Prompt พร้อม</span>
        </div>
      </SidebarMenuButton>
    </Link>
  );
};
