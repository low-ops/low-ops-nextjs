import { GalleryVerticalEnd } from "lucide-react";

type LogoProps = {
  showText?: boolean;
};

export function Logo({ showText = true }: LogoProps) {
  return (
    <a href="#" className="flex items-center gap-2 font-medium">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <GalleryVerticalEnd className="size-4" />
      </div>
      {showText && "Acme Inc."}
    </a>
  );
}
