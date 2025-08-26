"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInEmailAction } from "@/actions/sign-in.action";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      router.push("/prompt-chat");
    }
  }, [session?.user?.id, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      const { email, password } = data;

      const { error } = await signInEmailAction({ email, password });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Login successful. Good to have you back.");
        router.push("/prompt-chat");
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mx-auto"
      >
        <h1 className="text-3xl font-bold">Login</h1>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Password</FormLabel>
                <div className="flex justify-end">
                  <Link
                    tabIndex={-1}
                    href="/auth/forgot-password"
                    className="text-sm italic text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <FormControl>
                <Input
                  placeholder="Enter password"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full hover:cursor-pointer"
          disabled={isPending}
        >
          Login
        </Button>

        <div className="text-muted-foreground text-sm flex justify-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="hover:text-foreground ml-2">
            Register
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <SignInOauthButton provider="google" />
          {/* <SignInOauthButton provider="github" /> */}
        </div>
      </form>
    </Form>
  );
};
