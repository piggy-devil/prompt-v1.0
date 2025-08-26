"use server";

import { z } from "zod";
import { auth, ErrorCode } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export async function signInEmailAction(data: LoginInput) {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid data");
  }

  const { email, password } = parsed.data;

  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });

    return { error: null };
  } catch (err) {
    if (err instanceof APIError) {
      const errCode = err.body ? (err.body.code as ErrorCode) : "UNKNOWN";
      console.dir(err, { depth: 5 });
      switch (errCode) {
        case "EMAIL_NOT_VERIFIED":
          redirect("/auth/verify?error=email_not_verified");
        default:
          return { error: err.message };
      }
    }

    return { error: "Internal Server Error" };
  }
}
