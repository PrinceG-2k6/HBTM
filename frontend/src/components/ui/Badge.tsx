import React from "react";
import { cn } from "../../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "ai-adapted" | "upcoming" | "completed" | "warning" | "neutral" | "dark";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className }) => {
  const variantStyles = {
    "ai-adapted": "bg-amber-100 text-amber-800 border-amber-300",
    "upcoming": "bg-blue-100 text-blue-800 border-blue-200",
    "completed": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "warning": "bg-rose-100 text-rose-800 border-rose-200",
    "neutral": "bg-gray-100 text-gray-700 border-gray-200",
    "dark": "bg-zinc-800 text-zinc-200 border-zinc-700"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs border transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
