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
          src="/logo-mwa.png"
          width={300}
          height={300}
          alt="logo of mwa"
          className="w-8 h-8"
        />
        <h1 className="text-xl font-bold hidden md:block">{children}</h1>
      </Link>
    </Button>
  );
};

export default Logo;
