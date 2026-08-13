"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Size preset: sm (sidebar/mobile), md (auth pages), lg (landing hero) */
  size?: "sm" | "md" | "lg";
  /** Show "UP TO AFRICA" subtitle text below MELODIA */
  showSubtitle?: boolean;
  /** Wrap in a link to homepage */
  link?: boolean;
  /** Additional className on the outer container */
  className?: string;
}

const sizeMap = {
  sm: { img: 32, text: "text-base", sub: "text-[8px]", gap: "gap-2" },
  md: { img: 44, text: "text-2xl", sub: "text-[10px]", gap: "gap-2.5" },
  lg: { img: 48, text: "text-3xl", sub: "text-[11px]", gap: "gap-3" },
};

export function Logo({
  size = "md",
  showSubtitle = false,
  link = true,
  className,
}: LogoProps) {
  const s = sizeMap[size];

  const inner = (
    <div className={cn("flex items-center", s.gap, className)}>
      {/* Logo image — fond sombre professionnel */}
      <Image
        src="/melodia-logo-dark.png"
        alt="Melodia"
        width={s.img}
        height={s.img}
        className="rounded-lg flex-shrink-0"
        priority
      />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            s.text,
            "font-extrabold text-white tracking-wider"
          )}
        >
          MELODIA
        </span>
        {showSubtitle && (
          <span
            className={cn(
              s.sub,
              "text-purple-400 font-semibold tracking-widest uppercase mt-0.5"
            )}
          >
            UP TO AFRICA
          </span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href="/" className="inline-flex">
        {inner}
      </Link>
    );
  }

  return inner;
}
