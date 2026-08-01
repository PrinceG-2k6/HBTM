import React, { useEffect, useState } from "react";
import { Trophy, Lock, Sparkles, Flame } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
export const ReviewsPage: React.FC = () => {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <h1 className="text-3xl text-white">Peer <span className="text-purple-400">Reviews</span></h1>
      <p className="text-zinc-400">Coming soon.</p>
    </div>
  );
};
