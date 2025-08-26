"use server";

import { z } from "zod";
import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";

const registerSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function signUpEmailAction(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid data");
  }

  const { email, password, name } = parsed.data;

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return { error: null };
  } catch (err) {
    if (err instanceof APIError) {
      const errCode = err.body ? (err.body.code as ErrorCode) : "UNKNOWN";

      switch (errCode) {
        case "USER_ALREADY_EXISTS":
          return {
            error: "Oops! Something went wrong. Please try signup again.",
          };
        default:
          return { error: err.message };
      }
    }

    return { error: "Internal Server Error" };
  }
}
