import React, { useEffect, useState } from "react";
import { Trophy, Lock, Sparkles, Flame } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { AchievementsResponse } from "../api";

export const ReviewsPage: React.FC = () => {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    apiService.getAchievements().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <h1 className="text-3xl text-white">Peer <span className="text-purple-400">Reviews</span></h1>
      <p className="text-zinc-400">Coming soon.</p>
    </div>
  );
};
