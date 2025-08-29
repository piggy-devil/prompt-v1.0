import Link from "next/link";
import React from "react";
import Image from "next/image";
import { BRAND_BLUE } from "@/lib/utils";
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
            src="/brand/mwa-logo.png"
            width={100}
            height={100}
            alt="logo of mwa"
            className="size-8"
          />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span
            className="text-sm font-medium tracking-wide"
            style={{ color: BRAND_BLUE }}
          >
            MWA Chatbot Platform
          </span>
          <span className="text-xs text-muted-foreground">การประปานครหลวง</span>
        </div>
      </SidebarMenuButton>
    </Link>
  );
};
