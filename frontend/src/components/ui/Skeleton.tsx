import React from "react";
import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "3xl" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = "3xl" }) => {
  const roundedClass = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-zinc-900/80 via-purple-950/30 to-zinc-900/80 bg-[length:200%_100%] transition-opacity duration-300 opacity-90",
        roundedClass,
        className
      )}
      style={{
        animationDuration: "1.2s",
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className }) => (
  <div className={cn("bg-zinc-900/40 backdrop-blur-2xl rounded-3xl p-6 space-y-3.5 shadow-xl transition-opacity duration-300", className)}>
    <Skeleton className="h-5 w-1/3" rounded="full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === rows - 1 ? "w-2/3" : "w-full"}`} rounded="xl" />
    ))}
  </div>
);
