import { useSession } from "@/lib/auth-client";

export function useCurrentUser() {
  const { data, isPending } = useSession();

  const user = data?.user ?? null;
  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
    isLoading: isPending,
  };
}
