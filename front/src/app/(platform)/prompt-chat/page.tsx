import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatInput } from "@/app/(platform)/_components/chat-input";

export default async function PromptChatPage() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 overflow-hidden bg-background mt-36">
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-medium text-foreground mb-8">
          สวัสดี, {session?.user.name}
        </h1>
      </div>
      <ChatInput />
    </div>
  );
}
