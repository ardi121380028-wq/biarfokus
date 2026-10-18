"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny reactive wrapper around localStorage.
 *
 * - Works with `useSyncExternalStore`, so it is SSR/hydration safe
 *   (server snapshot is a stable fallback value).
 * - Parsed values are cached per raw string so snapshots stay referentially
 *   stable between renders (required by useSyncExternalStore).
 * - Every write broadcasts a same-tab event; other tabs are synced via the
 *   native `storage` event. This keeps e.g. the Notes modal, Notes page and
 *   Calendar in sync without prop drilling.
 */

const LOCAL_STORE_EVENT = "biarfokus:local-store";
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readLocalValue<T>(key: string, parse: (raw: string | null) => T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse(raw);
  cache.set(key, { raw, value });
  return value;
}

export function writeLocalValue<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode: keep the app usable, just don't persist.
  }
  window.dispatchEvent(new CustomEvent(LOCAL_STORE_EVENT, { detail: key }));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCAL_STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCAL_STORE_EVENT, callback);
  };
}

/**
 * Subscribe to a JSON value stored in localStorage.
 * `serverValue` MUST be a stable reference (module-level constant).
 */
export function useLocalStoreValue<T>(
  key: string,
  parse: (raw: string | null) => T,
  serverValue: T,
): [T, (updater: (current: T) => T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readLocalValue(key, parse),
    () => serverValue,
  );

  const update = useCallback(
    (updater: (current: T) => T) => {
      // Always derive from the latest persisted value to avoid stale closures.
      writeLocalValue(key, updater(readLocalValue(key, parse)));
    },
    [key, parse],
  );

  return [value, update];
}
