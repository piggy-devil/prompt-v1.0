"use client";

import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { USER_CHATS_KEY } from "@/hooks/use-user-chats";

interface DeleteChatButtonProps {
  chatId: string;
  children: React.ReactNode;
  closeMenu?: () => void; // ฟังก์ชันปิด DropdownMenu
}

export function DeleteChatButton({
  chatId,
  children,
  closeMenu,
}: DeleteChatButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChatDelete = async () => {
    try {
      setLoading(true);
      await fetch(`/api/prompt-chat/${chatId}`, { method: "DELETE" });
      mutate(USER_CHATS_KEY);
      setOpen(false);
      closeMenu?.(); // ปิด DropdownMenu ด้วย
      router.push("/prompt-chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ปุ่มใน dropdown ที่เปิด AlertDialog */}
      <button
        className="flex w-full items-center gap-2"
        onClick={(e) => {
          e.preventDefault(); // กันไม่ให้ dropdown ปิดก่อน
          setOpen(true);
        }}
      >
        {children}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this chat?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The chat will be permanently removed
              from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              onClick={() => {
                setOpen(false);
                closeMenu?.(); // ปิดเมนูเมื่อกด Cancel
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              onClick={handleChatDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
