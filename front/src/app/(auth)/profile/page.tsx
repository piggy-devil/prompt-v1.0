import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReturnButton } from "../_component/return-button";
import { SignOutButton } from "../_component/sign-out-button";
import { UpdateUserForm } from "../_component/update-user-form";
import { ChangePasswordForm } from "../_component/change-password-form";

const ProfilePage = async () => {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/auth/login");
  }

  const FULL_POST_ACCESS = await auth.api.userHasPermission({
    headers: headersList,
    body: {
      permissions: {
        posts: ["update", "delete"],
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { employeeId: true },
  });

  if (!user?.employeeId) {
    // redirect("/setup-employee-id");
  }

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/" label="Home" />

        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="flex items-center gap-2">
          {session.user.role === "ADMIN" && (
            <Button size="sm" asChild>
              <Link href="/dashboard">Admin Dashboard</Link>
            </Button>
          )}

          <SignOutButton />
        </div>
      </div>

      <h2 className="text-2xl font-bold">Permissions</h2>

      <div className="space-x-4">
        <Button size="sm">MANAGE OWN POSTS</Button>
        <Button size="sm" disabled={!FULL_POST_ACCESS.success}>
          MANAGE ALL POSTS
        </Button>
      </div>

      {session.user.image ? (
        <Image
          src={session?.user?.image}
          alt="User Image"
          width={128} // size-32 = 8rem = 128px
          height={128}
          className="border border-primary rounded-md object-cover size-32"
          priority
        />
      ) : (
        <div className="size-32 border border-primary rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <span className="uppercase text-lg font-bold">
            {session.user.name.slice(0, 2)}
          </span>
        </div>
      )}

      <pre className="text-sm overflow-clip">
        {JSON.stringify(session, null, 2)}
      </pre>

      <div className="space-y-4 p-4 rounded-b-md  border border-t-8 border-blue-600">
        <h2 className="text-2xl font-bold">Update User</h2>

        <UpdateUserForm
          name={session.user.name}
          image={session.user.image ?? ""}
        />
      </div>

      <div className="space-y-4 p-4 rounded-b-md  border border-t-8 border-red-600">
        <h2 className="text-2xl font-bold">Change Password</h2>

        <ChangePasswordForm />
      </div>
    </div>
  );
};

export default ProfilePage;
