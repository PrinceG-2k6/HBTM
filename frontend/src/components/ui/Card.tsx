import React from "react";
import { cn } from "../../utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, dark = false, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 sm:p-8 transition-all duration-300 border",
        dark
          ? "bg-zinc-950/90 text-white border-zinc-800/90 shadow-2xl"
          : "bg-zinc-950/70 backdrop-blur-2xl text-zinc-100 border-zinc-800/70 shadow-xl hover:border-zinc-700/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
