import React, { useState } from "react";
import { Star, X, Sparkles, Check } from "lucide-react";
import { apiService } from "../api";

interface Props {
  open: boolean;
  lessonTitle: string;
  onClose: () => void;
}

export const ReflectionModal: React.FC<Props> = ({ open, lessonTitle, onClose }) => {
  const [learned, setLearned] = useState("");
  const [confusion, setConfusion] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiService.addReflection({
        lessonTitle,
        learnedToday: learned,
        confusion,
        confidenceRating: confidence,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setLearned("");
        setConfusion("");
        setConfidence(3);
        onClose();
      }, 1500);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-800 p-6 text-white">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              Session Reflection
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Help UVOM learn how your mind synthesizes ideas</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <Check size={28} className="text-emerald-400" />
            </div>
            <p className="text-sm text-emerald-300">Reflection saved! UVOM vector index updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-amber-200 bg-amber-950/50 px-3 py-2 rounded-xl border border-amber-800/60">
              Lesson: <strong className="text-white">{lessonTitle}</strong>
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">What did you learn today?</label>
              <textarea
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="Describe the key concept you understood..."
                rows={3}
                className="w-full text-xs p-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-white outline-none resize-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">What confused you?</label>
              <textarea
                value={confusion}
                onChange={(e) => setConfusion(e.target.value)}
                placeholder="What was still unclear after the session?"
                rows={2}
                className="w-full text-xs p-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-white outline-none resize-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-2">Confidence Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfidence(n)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={22}
                      className={n <= confidence ? "text-amber-400 fill-amber-400" : "text-zinc-700"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-zinc-400 self-center">
                  {["", "Low", "Below Average", "Average", "Good", "Confident"][confidence]}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={submitting || !learned.trim()}
                className="px-5 py-2 rounded-full bg-amber-400 text-amber-950 font-semibold text-xs hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {submitting ? "Saving..." : "Save Reflection"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
