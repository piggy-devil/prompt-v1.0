import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";

const Logo = ({ children }: { children: React.ReactNode }) => {
  return (
    <Button
      asChild
      variant="ghost"
      className="hover:bg-transparent dark:hover:bg-transparent"
    >
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/brand/mwa-logo.png"
          width={100}
          height={100}
          alt="logo of mwa"
          className="size-8"
        />
        <h1 className="text-xl font-bold hidden md:block">{children}</h1>
      </Link>
    </Button>
  );
};

export default Logo;
