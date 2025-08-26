import { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

type AuthorizedProps = {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
};

export function Authorized({
  children,
  fallback = null,
  loading = null,
}: AuthorizedProps) {
  const { isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) return <>{loading}</>;
  if (isAuthenticated) return <>{children}</>;

  return <>{fallback}</>;
}
