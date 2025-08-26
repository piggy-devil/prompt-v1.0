import React from "react";
import { ReturnButton } from "../../_component/return-button";
import { ForgotPasswordForm } from "../../_component/forgot-password-form";

const ForgotPasswordPage = () => {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/auth/login" label="Login" />

        <h1 className="text-3xl font-bold">Forgot Password</h1>

        <p className="text-muted-foreground">
          Please enter your email address to receive a password reset link.
        </p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
