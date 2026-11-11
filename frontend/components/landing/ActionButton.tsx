"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionButtonVariant = "black" | "dark" | "white" | "amber" | "gold" | "emerald" | "outline";
export type ActionButtonSize = "sm" | "md" | "lg";

export interface ActionButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  type?: "button" | "submit" | "reset";
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  showIcon?: boolean;
  icon?: React.ReactNode;
  className?: string;
  badgeClassName?: string;
  iconClassName?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  id?: string;
}

const VARIANT_STYLES: Record<ActionButtonVariant, string> = {
  black:
    "bg-[#09090b] hover:bg-zinc-900 text-white border border-black/10 shadow-[0_8px_24px_-4px_rgba(9,9,11,0.18)] hover:shadow-[0_12px_32px_-4px_rgba(9,9,11,0.28)]",
  dark:
    "bg-[#09090b] hover:bg-zinc-900 text-white border border-black/10 shadow-[0_8px_24px_-4px_rgba(9,9,11,0.18)] hover:shadow-[0_12px_32px_-4px_rgba(9,9,11,0.28)]",
  white:
    "bg-white hover:bg-zinc-50 text-[#09090b] shadow-sm border border-zinc-200/90",
  amber:
    "bg-[#d4a574] hover:bg-[#c4956a] text-[#09090b] border border-[#b88655]/30 shadow-sm hover:shadow-md",
  gold:
    "bg-[#d4a574] hover:bg-[#c4956a] text-[#09090b] border border-[#b88655]/30 shadow-sm hover:shadow-md",
  emerald:
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md",
  outline:
    "bg-white hover:bg-[#faf9f6] text-[#09090b] border border-zinc-200/90 hover:border-zinc-300 shadow-sm",
};

const BADGE_STYLES: Record<ActionButtonVariant, string> = {
  black: "bg-white/12 text-white group-hover:bg-[#d4a574] group-hover:text-[#09090b]",
  dark: "bg-white/12 text-white group-hover:bg-[#d4a574] group-hover:text-[#09090b]",
  white: "bg-[#09090b] text-white group-hover:bg-[#d4a574] group-hover:text-[#09090b]",
  amber: "bg-[#09090b]/12 text-[#09090b] group-hover:bg-[#09090b] group-hover:text-white",
  gold: "bg-[#09090b]/12 text-[#09090b] group-hover:bg-[#09090b] group-hover:text-white",
  emerald: "bg-white/15 text-white group-hover:bg-white group-hover:text-emerald-800",
  outline: "bg-zinc-100 text-zinc-700 group-hover:bg-[#09090b] group-hover:text-white",
};

const SIZE_STYLES: Record<ActionButtonSize, { button: string; badge: string; icon: string }> = {
  sm: {
    button: "h-9 pl-4 pr-1.5 text-xs gap-2.5",
    badge: "w-6 h-6",
    icon: "w-3 h-3",
  },
  md: {
    button: "h-11 pl-5 pr-1.5 text-xs sm:text-sm gap-3",
    badge: "w-7 h-7 sm:w-8 sm:h-8",
    icon: "w-3.5 h-3.5",
  },
  lg: {
    button: "h-12 sm:h-[52px] pl-6 pr-2 text-sm gap-3.5",
    badge: "w-8 h-8 sm:w-9 sm:h-9",
    icon: "w-4 h-4",
  },
};

export function ActionButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "black",
  size = "md",
  showIcon = true,
  icon,
  className = "",
  badgeClassName = "",
  iconClassName = "",
  fullWidth = false,
  disabled = false,
  target,
  rel,
  ariaLabel,
  id,
}: ActionButtonProps) {
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;

  const buttonClasses = cn(
    "group relative rounded-full font-semibold inline-flex items-center justify-between transition-all duration-300 active:scale-[0.98] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4956a] focus-visible:ring-offset-2",
    VARIANT_STYLES[variant] || VARIANT_STYLES.black,
    sizeConfig.button,
    fullWidth ? "w-full" : "w-auto",
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
    className
  );

  const badgeClasses = cn(
    sizeConfig.badge,
    BADGE_STYLES[variant] || BADGE_STYLES.black,
    "rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:translate-x-0.5",
    badgeClassName
  );

  const content = (
    <>
      <span className="truncate">{children}</span>
      {showIcon ? (
        <span className={badgeClasses}>
          {icon || (
            <ArrowRight
              className={cn(sizeConfig.icon, "transition-transform duration-300", iconClassName)}
              strokeWidth={2.5}
            />
          )}
        </span>
      ) : null}
    </>
  );

  if (href) {
    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link
          href={href}
          id={id}
          className={buttonClasses}
          onClick={onClick}
          aria-label={ariaLabel}
          target={target}
          rel={rel}
        >
          {content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        id={id}
        className={buttonClasses}
        onClick={onClick}
        aria-label={ariaLabel}
        target={target}
        rel={rel}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      id={id}
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}

export default ActionButton;
