import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizeName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const VALID_DOMAINS = () => {
  const domains = ["gmail.com", "mwa.co.th", "hotmail.com"];

  if (process.env.NODE_ENV === "development") {
    domains.push("example.com");
  }

  return domains;
};
