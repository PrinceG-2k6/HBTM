import React, { useEffect, useState } from "react";
import { Sparkles, Video, Book, Headphones, ExternalLink, CheckCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import { curationApi } from "../api";

export const CurationPage: React.FC = () => {
  const [feed, setFeed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedUrls, setCompletedUrls] = useState<Set<string>>(new Set());

  const handleComplete = async (e: React.MouseEvent, item: any) => {
    e.preventDefault(); // prevent opening link
    e.stopPropagation();
    try {
      await curationApi.markContentComplete({
        url: item.url,
        title: item.title,
        content_type: item.content_type,
        platform: item.platform || "unknown",
        skill_name: item.matched_skill || item.skill_name
      });
      setCompletedUrls(prev => new Set(prev).add(item.url));
    } catch (err) {
      console.error("Failed to mark as complete", err);
    }
  };

  useEffect(() => {
    curationApi.getFeed().then((res) => {
      setFeed(res);
      if (res.completed_urls) {
        setCompletedUrls(new Set(res.completed_urls));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      <SkeletonCard rows={8} />
    </div>
  );

  const items = feed?.feed || feed?.curated_items || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white">Curated <span className="text-purple-400">Media</span></h1>
        <p className="text-sm text-zinc-300 mt-1 flex items-center gap-1.5">
          <Sparkles size={16} className="text-purple-400" />
          <span>AI-curated content tailored exactly to your skill growth goals.</span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-12 bg-zinc-900/40 rounded-2xl border border-white/5">
          <p className="text-zinc-400">No content available. Complete onboarding or add more skills to see content.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {["video", "article", "book"].map((type) => {
            const groupItems = items.filter((i: any) => i.content_type === type);
            if (groupItems.length === 0) return null;
            
            const groupTitle = type === "video" ? "Videos" : type === "article" ? "Articles" : "Books";
            
            return (
              <div key={type}>
                <h2 className="text-xl text-white font-semibold mb-4">{groupTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupItems.map((item: any, idx: number) => {
                    const isVideo = item.content_type === "video";
                    const Icon = isVideo ? Video : item.content_type === "audio" ? Headphones : Book;
                    
                    return (
                      <a 
                        key={idx} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <Card className={`flex flex-col h-full bg-zinc-900/40 backdrop-blur-xl border border-white/5 overflow-hidden transition-all ${completedUrls.has(item.url) ? "opacity-60 border-emerald-500/30" : "group-hover:border-purple-500/30"}`}>
                  {/* Image / Thumbnail placeholder */}
                  <div className="h-40 bg-zinc-800/80 relative overflow-hidden">
                    {(() => {
                      const url = item.url || "";
                      let videoId = "";
                      if (url.includes("v=")) {
                        videoId = url.split("v=")[1]?.split("&")[0]?.split("?")[0] || "";
                      } else if (url.includes("youtu.be/")) {
                        videoId = url.split("youtu.be/")[1]?.split("&")[0]?.split("?")[0] || "";
                      }
                      
                      const thumbSrc = item.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
                      
                      if (thumbSrc) {
                        return (
                          <img
                            src={thumbSrc}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                            alt={item.title || "Thumbnail"}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 group-hover:text-purple-400 transition-colors">
                          <Icon size={48} />
                        </div>
                      );
                    })()}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1.5">
                              <Icon size={14} className="text-purple-400" />
                              <span className="capitalize">{item.content_type}</span>
                            </div>
                            {item.is_diversification_pick && (
                              <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-300 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-500/20">
                                <Sparkles size={14} />
                                Diversify
                              </div>
                            )}
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-semibold px-2 py-1 bg-purple-950/40 text-purple-300 rounded-md">
                                {item.matched_skill || item.skill_name}
                              </span>
                            </div>
                            
                            <h3 className="text-white font-medium text-lg leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                              {item.title}
                            </h3>
                            
                            <p className="text-zinc-400 text-sm mt-3 line-clamp-3 flex-1">
                              {item.reasoning}
                            </p>
                            
                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/5">
                              {completedUrls.has(item.url) ? (
                                <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                                  <CheckCircle size={16} /> Completed
                                </span>
                              ) : (
                                <button 
                                  onClick={(e) => handleComplete(e, item)}
                                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium z-10 relative cursor-pointer"
                                >
                                  <CheckCircle size={16} /> Mark as Complete
                                </button>
                              )}
                              <span className="flex items-center gap-1.5 text-sm text-purple-400 group-hover:text-purple-300 font-medium">
                                View Source <ExternalLink size={14} />
                              </span>
                            </div>
                          </div>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
