import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Send, Image as ImageIcon, X, Bot, User,
  Copy, Check, ArrowRight, Zap, RefreshCw, Trash2
} from "lucide-react";
import { useAuth } from "../contexts/auth.context";
import { apiService } from "../api";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string; // base64 or URL
  timestamp: string;
  suggestedActions?: string[];
}

const QUICK_PROMPTS = [
  "How can I optimize my focus blocks for deep work?",
  "Suggest books aligned with my target identity",
  "How do I eliminate high-dopamine distraction traps?",
  "Create a daily 30-minute growth routine for me",
];

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      sender: "ai",
      text: `Hello ${user?.name ? user.name.split(" ")[0] : "Growth Aspirant"}! 👋 I am your **PACER AI Curator**.\n\nI continuously monitor your growth areas, media preferences, and daily commitment to help you transform into the self you imagine.\n\nHow can I help you accelerate your journey today? Feel free to ask a question or **upload an image** of your notes, schedule, or code to analyze!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: ["View Growth Roadmap", "Explore Learning Lab"],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle image file selection & convert to base64
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send Message logic
  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputPrompt;
    if (!textToSend.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const sendingImage = selectedImage;
    setInputPrompt("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await apiService.sendAIChat({
        prompt: textToSend,
        hasImage: !!sendingImage,
        imageBase64: sendingImage || undefined,
      });

      const aiMsg: ChatMessage = {
        id: res.id || `ai-${Date.now()}`,
        sender: "ai",
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: res.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback AI reply if server is offline or fails
      const fallbackReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `I've received your query! Based on your identity gap goals:\n\n1. **Focus Alignment**: Prioritize active application over passive scrolling.\n2. **Habit Stack**: Block 25 minutes for high-priority learning.\n3. **Curated Next Step**: Visit your Growth Roadmap to log today's progress.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: ["View Growth Roadmap"],
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: `Chat thread cleared. What growth area would you like to explore next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              AI Growth Curator Chat
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time conversational mentor powered by your habits, aspirations, and visual materials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
          >
            <Trash2 size={14} /> Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Window Card */}
      <div className="rounded-3xl bg-zinc-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col h-[640px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} group`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-900/30 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-3xl p-5 shadow-xl transition-all ${
                      isUser
                        ? "bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-tr-xs"
                        : "bg-zinc-900/90 text-zinc-200 rounded-tl-xs"
                    }`}
                  >
                    {/* Uploaded Image Thumbnail */}
                    {msg.image && (
                      <div className="mb-3 overflow-hidden rounded-2xl max-w-sm">
                        <img
                          src={msg.image}
                          alt="Uploaded material"
                          className="w-full h-auto object-cover rounded-2xl border border-white/10"
                        />
                      </div>
                    )}

                    {/* Text Body */}
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Message Meta Footer */}
                    <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-white/10 text-[10px] text-zinc-400">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} className="text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Suggested Action Pills */}
                  {msg.suggestedActions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedActions.map((act, idx) => (
                        <Link
                          key={idx}
                          to={
                            act.includes("Roadmap")
                              ? "/roadmap"
                              : act.includes("Lab")
                              ? "/learning-lab"
                              : "/insights"
                          }
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-purple-950/40 text-purple-300 hover:bg-purple-600 hover:text-white transition-all duration-200 flex items-center gap-1 cursor-pointer"
                        >
                          {act} <ArrowRight size={11} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
                <Sparkles size={16} />
              </div>
              <div className="rounded-3xl rounded-tl-xs p-4 bg-zinc-900/80 text-zinc-400 text-xs flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-purple-400" />
                PACER AI Curator is analyzing and formulating response...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2 bg-zinc-950/40 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Zap size={13} className="text-purple-400 shrink-0" />
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-purple-950/60 text-zinc-400 hover:text-purple-200 transition-all shrink-0 cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Selected Image Preview Chip */}
        {selectedImage && (
          <div className="px-6 py-2 bg-purple-950/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage}
                alt="Selected preview"
                className="w-10 h-10 object-cover rounded-xl border border-purple-400/40"
              />
              <span className="text-xs text-purple-200 font-medium">Image attached ready for AI analysis</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-zinc-950/80 flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-purple-300 transition-all cursor-pointer shrink-0"
            title="Upload image note or schedule to analyze"
          >
            <ImageIcon size={20} />
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask AI curator anything or upload image to analyze..."
            className="flex-1 bg-zinc-900/80 text-white placeholder-zinc-500 text-sm px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() && !selectedImage}
            className="p-3.5 rounded-2xl font-semibold text-white shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
