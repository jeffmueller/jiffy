"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "light" | "dark";

const STORAGE_KEY = "jiffy-theme";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  // Follow the OS while the visitor has no stored preference, and pick up
  // changes made in another tab.
  media.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * The server cannot know the visitor's theme. Returning null renders a
 * placeholder for the hydrating pass, which is what keeps markup matching;
 * the inline script in layout.tsx has already applied the right class, so
 * nothing flashes. React swaps to getSnapshot once hydrated.
 */
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Effects belong to syncing external systems — here, the document.
  useEffect(() => {
    if (!theme) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#09090b" : "#ffffff");
    }
  }, [theme]);

  const toggle = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, getSnapshot() === "light" ? "dark" : "light");
    emit();
  }, []);

  // Nothing to show until hydration resolves the real theme.
  if (!theme) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-border/50 hover:text-foreground"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon weight="bold" className="h-[18px] w-[18px]" />
      ) : (
        <Sun weight="bold" className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
