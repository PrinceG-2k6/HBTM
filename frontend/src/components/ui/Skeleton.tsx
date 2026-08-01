import React from "react";
import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = "lg" }) => {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
        roundedClass,
        className
      )}
      style={{
        animation: "shimmer 1.5s infinite linear",
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 lg:p-6 border border-white/60 space-y-3">
    <Skeleton className="h-4 w-1/3" rounded="full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i === rows - 1 ? "w-2/3" : "w-full"}`} rounded="full" />
    ))}
  </div>
);
