"use client";

import { toast } from "sonner";
import { useTransition } from "react";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/actions/delete-user.action";

interface DeleteUserButtonProps {
  userId: string;
}

export const DeleteUserButton = ({ userId }: DeleteUserButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await deleteUserAction({ userId });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("User deleted successfully");
      }
    });
  };

  return (
    <Button
      size="icon"
      variant="destructive"
      className="size-7 rounded-sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <span className="sr-only">Delete User</span>
      <TrashIcon />
    </Button>
  );
};

export const PlaceholderDeleteUserButton = () => {
  return (
    <Button
      size="icon"
      variant="destructive"
      className="size-7 rounded-sm"
      disabled
    >
      <span className="sr-only">Delete User</span>
      <TrashIcon />
    </Button>
  );
};
