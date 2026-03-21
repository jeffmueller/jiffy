"use client";

import { motion } from "framer-motion";
import { TrendUp } from "@phosphor-icons/react";

interface TrendingPillsProps {
  terms: string[];
  onSelect: (term: string) => void;
}

export function TrendingPills({ terms, onSelect }: TrendingPillsProps) {
  if (terms.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <TrendUp weight="bold" className="h-4 w-4 shrink-0 text-muted" />
      {terms.map((term, i) => (
        <motion.button
          key={term}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: i * 0.04,
          }}
          onClick={() => onSelect(term)}
          className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground active:scale-[0.98]"
        >
          {term}
        </motion.button>
      ))}
    </div>
  );
}
