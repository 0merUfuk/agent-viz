"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type ToastTone = "error" | "success" | "info";

export interface ToastProps {
  open: boolean;
  tone?: ToastTone;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const toneConfig: Record<ToastTone, { border: string; bg: string; icon: React.ElementType; iconClass: string }> = {
  error: {
    border: "border-[var(--live)]/60",
    bg: "bg-[rgba(244,114,182,0.08)]",
    icon: AlertTriangle,
    iconClass: "text-[var(--live)]",
  },
  success: {
    border: "border-[var(--success)]/60",
    bg: "bg-[rgba(74,222,128,0.06)]",
    icon: CheckCircle2,
    iconClass: "text-[var(--success)]",
  },
  info: {
    border: "border-[var(--blue)]/50",
    bg: "bg-[rgba(96,165,250,0.06)]",
    icon: Info,
    iconClass: "text-[var(--blue-bright)]",
  },
};

export function Toast({ open, tone = "info", title, message, onDismiss }: ToastProps) {
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "pointer-events-auto fixed left-1/2 top-20 z-50 -translate-x-1/2",
            "flex max-w-md items-start gap-3 border px-4 py-3 backdrop-blur-sm",
            "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
            cfg.border,
            cfg.bg,
          )}
          style={{ background: "rgba(5,9,20,0.92)" }}
        >
          <Icon size={16} className={cn("mt-0.5 shrink-0", cfg.iconClass)} aria-hidden />
          <div className="min-w-0">
            <p className="text-display-sm text-[var(--text)]">{title}</p>
            {message && <p className="mt-1 text-body text-[var(--text-muted)]">{message}</p>}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="ml-2 text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
