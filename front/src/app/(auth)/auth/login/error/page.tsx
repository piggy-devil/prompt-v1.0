import { ReturnButton } from "@/app/(auth)/_component/return-button";

interface ErrorPageProps {
  searchParams: Promise<{ error: string }>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const error = (await searchParams).error;

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/auth/login" label="Login" />

        <h1 className="text-3xl font-bold">Login Error</h1>
      </div>

      <p className="text-destructive">
        {error === "account_not_linked"
          ? "This account is already linked to another sign-in method."
          : "Oops! Something went wrong. Please try again."}
      </p>
    </div>
  );
}
