import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function Logo({ size = 24, className, alt = "Logo" }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
