import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** full = full logo image, icon = icon mark only */
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  /** color variant for full logo: default (light bg) or darkblue */
  color?: "default" | "darkblue";
  className?: string;
}

const iconDimensions: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

const logoDimensions: Record<NonNullable<LogoProps["size"]>, { w: number; h: number }> = {
  sm: { w: 100, h: 28 },
  md: { w: 130, h: 36 },
  lg: { w: 160, h: 44 },
};

export function Logo({ variant = "full", size = "md", color = "default", className }: LogoProps) {
  if (variant === "icon") {
    const px = iconDimensions[size];
    const iconSrc = color === "darkblue" ? "/brand/flowpilot_icon_darkblue.png" : "/brand/flowpilot_icon.png";
    return (
      <Image
        src={iconSrc}
        alt="FlowPilot"
        width={px}
        height={px}
        className={cn("object-contain", className)}
      />
    );
  }

  const { w, h } = logoDimensions[size];
  const src = color === "darkblue" ? "/brand/flowpilot_logo_darkblue.png" : "/brand/flowpilot_logo.png";
  return (
    <Image
      src={src}
      alt="FlowPilot"
      width={w}
      height={h}
      className={cn("object-contain", className)}
    />
  );
}
