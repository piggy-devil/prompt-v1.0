"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { signInEmailAction } from "@/actions/sign-in.action";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (session?.user?.id) router.push("/prompt-chat");
  }, [session?.user?.id, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      const { error } = await signInEmailAction(data);
      if (error) toast.error(error);
      else {
        toast.success("Login successful. Good to have you back.");
        router.push("/prompt-chat");
      }
    });
  };

  return (
    <div className="max-w-md mx-auto">
      {/* หัวการ์ดแบบ glass */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Welcome back
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Sign in to your account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue to your RAG workspace
        </p>
      </div>

      <div className="rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg p-6 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="you@company.com"
                        type="email"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password + toggle */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="••••••••"
                        type={showPw ? "text" : "password"}
                        className="pl-9 pr-9"
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label="toggle password"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Divider */}
            <div className="relative text-center">
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
              <span className="relative bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            {/* Social */}
            <div className="flex flex-col gap-2">
              <SignInOauthButton provider="google" />
              {/* <SignInOauthButton provider="github" /> */}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};
