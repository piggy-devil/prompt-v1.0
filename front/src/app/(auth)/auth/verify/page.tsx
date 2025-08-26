import { redirect } from "next/navigation";
import { ReturnButton } from "../../_component/return-button";
import { SendVerificationEmailForm } from "../../_component/send-verification-email-form";

interface VerifyPageProps {
  searchParams: Promise<{ error: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const error = (await searchParams).error;

  if (!error) redirect("/profile");

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/auth/login" label="Login" />

        <h1 className="text-3xl font-bold">Verify Email</h1>
      </div>

      <p className="text-destructive">
        <span className="capitalize">
          {error.replace(/_/g, " ").replace(/-/g, " ")}
        </span>{" "}
        - Please request a new verification email.
      </p>

      <SendVerificationEmailForm />
    </div>
  );
}
