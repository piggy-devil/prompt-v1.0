import { NavHeader } from "@/components/sidebar/nav-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(10))]">
      <SidebarProvider className="flex flex-col">
        <NavHeader />
        <div className="flex flex-1 justify-center">
          <AppSidebar />
          <SidebarInset className="max-w-2xl">{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
