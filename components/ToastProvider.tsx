"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToastState, ToastContext } from "@/hooks/useToast";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, show, dismiss } = useToastState();

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => dismiss(toast.id)}
              className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
            >
              {toast.variant === "success" ? (
                <CheckCircle weight="fill" className="h-4 w-4 text-accent" />
              ) : (
                <XCircle weight="fill" className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-foreground">
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
