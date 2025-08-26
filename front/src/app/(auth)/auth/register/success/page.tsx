import { ReturnButton } from "@/app/(auth)/_component/return-button";

export default function RegisterSuccessPage() {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/auth/login" label="Login" />

        <h1 className="text-3xl font-bold">Success</h1>

        <p className="text-muted-foreground">
          Congratulations! You have successfully registered. Please check your
          email for the verification link.
        </p>
      </div>
    </div>
  );
}
