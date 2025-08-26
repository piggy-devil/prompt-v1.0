import type { auth } from "@/lib/auth";
import { ac, roles } from "@/lib/permissions";
import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  adminClient,
  customSessionClient,
} from "better-auth/client/plugins";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_FRONTEND_API_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient({ ac, roles }),
    customSessionClient<typeof auth>(),
  ],
});

export const {
  signUp,
  signOut,
  signIn,
  useSession,
  admin,
  sendVerificationEmail,
  forgetPassword,
  resetPassword,
  updateUser,
} = authClient;
