"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface CopyButtonProps {
  onCopy: () => Promise<boolean>;
  label?: string;
  className?: string;
}

export function CopyButton({ onCopy, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [onCopy]);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${
        copied
          ? "bg-accent text-white"
          : "bg-zinc-900/70 text-white backdrop-blur-sm hover:bg-zinc-900/90"
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Check weight="bold" className="h-3.5 w-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Copy weight="bold" className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
