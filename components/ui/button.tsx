"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-signal text-ink hover:bg-[#ffc247] border-black",
    secondary: "bg-gooseblue text-white hover:bg-[#1979d7] border-black",
    danger: "bg-ember text-white hover:bg-[#e94430] border-black",
    ghost: "bg-transparent text-parchment hover:bg-white/10 border-white/25"
  };
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-2 px-4 py-2 text-sm font-black uppercase tracking-normal transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
