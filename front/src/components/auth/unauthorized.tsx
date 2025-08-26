import { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

type UnauthorizedProps = {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
};

export function Unauthorized({
  children,
  fallback = null,
  loading = null,
}: UnauthorizedProps) {
  const { isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) return <>{loading}</>;
  if (!isAuthenticated) return <>{children}</>;

  return <>{fallback}</>;
}
