"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onReset: () => void;
}

export function SearchBar({ onSearch, onReset }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [value, fetchSuggestions]);

  const submit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setValue(trimmed);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onSearch(trimmed);
    },
    [onSearch]
  );

  const clear = useCallback(() => {
    setValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    onReset();
    inputRef.current?.focus();
  }, [onReset]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        submit(suggestions[selectedIndex]);
      } else {
        submit(value);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <motion.div
        className="relative flex items-center"
        whileFocus={{ scale: 1.01 }}
      >
        <MagnifyingGlass
          weight="bold"
          className="absolute left-4 h-5 w-5 text-muted"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search for GIFs..."
          className="h-14 w-full rounded-2xl border border-border bg-surface pl-12 pr-12 text-base text-foreground outline-none transition-shadow placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(5,150,105,0.08)]"
        />
        {value && (
          <button
            onClick={clear}
            className="absolute right-4 rounded-full p-0.5 text-muted transition-colors hover:text-foreground"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {showSuggestions && suggestions.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
        >
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => submit(s)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  i === selectedIndex
                    ? "bg-accent/5 text-foreground"
                    : "text-muted hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <MagnifyingGlass weight="bold" className="h-3.5 w-3.5 shrink-0" />
                {s}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
