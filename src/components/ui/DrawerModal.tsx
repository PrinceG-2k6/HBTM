import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface DrawerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const DrawerModal: React.FC<DrawerModalProps> = ({
  open,
  onClose,
  title,
  children,
  className,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-lg bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-800 text-white",
          "max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between p-5 pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
