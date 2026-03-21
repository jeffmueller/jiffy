"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { GifItem } from "@/lib/types";

type Status = "idle" | "loading" | "loaded" | "error" | "empty";

interface State {
  results: GifItem[];
  next: string;
  status: Status;
  query: string;
}

type Action =
  | { type: "SEARCH_START"; query: string }
  | { type: "SEARCH_SUCCESS"; results: GifItem[]; next: string }
  | { type: "SEARCH_ERROR" }
  | { type: "LOAD_MORE_START" }
  | { type: "LOAD_MORE_SUCCESS"; results: GifItem[]; next: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SEARCH_START":
      return { ...state, query: action.query, status: "loading", results: [], next: "" };
    case "SEARCH_SUCCESS":
      return {
        ...state,
        results: action.results,
        next: action.next,
        status: action.results.length === 0 ? "empty" : "loaded",
      };
    case "SEARCH_ERROR":
      return { ...state, status: "error" };
    case "LOAD_MORE_START":
      return state;
    case "LOAD_MORE_SUCCESS":
      return {
        ...state,
        results: [...state.results, ...action.results],
        next: action.next,
      };
    case "RESET":
      return { results: [], next: "", status: "idle", query: "" };
    default:
      return state;
  }
}

export function useSearch() {
  const [state, dispatch] = useReducer(reducer, {
    results: [],
    next: "",
    status: "idle",
    query: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: "RESET" });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "SEARCH_START", query });

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (!controller.signal.aborted) {
        dispatch({ type: "SEARCH_SUCCESS", results: data.results, next: data.next });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        dispatch({ type: "SEARCH_ERROR" });
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.next || !state.query) return;

    dispatch({ type: "LOAD_MORE_START" });

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(state.query)}&pos=${state.next}`
      );
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      dispatch({ type: "LOAD_MORE_SUCCESS", results: data.results, next: data.next });
    } catch {
      // silently fail on load more
    }
  }, [state.next, state.query]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { ...state, search, loadMore, reset };
}
