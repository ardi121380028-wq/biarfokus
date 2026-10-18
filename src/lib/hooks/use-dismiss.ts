"use client";

import { useEffect, useRef, type RefObject } from "react";

/*
 * Escape handling uses a stack so that nested layers (popover inside an
 * edit dialog inside the notes modal) close one at a time, top-most first.
 */
const escapeStack: Array<{ current: () => void }> = [];

function onEscapeKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const top = escapeStack[escapeStack.length - 1];
  if (!top) return;
  event.preventDefault();
  top.current();
}

/** Calls `handler` when Escape is pressed and this layer is the top-most one. */
export function useEscapeKey(handler: () => void, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const entry = handlerRef;
    escapeStack.push(entry);
    if (escapeStack.length === 1) window.addEventListener("keydown", onEscapeKeyDown);
    return () => {
      const index = escapeStack.lastIndexOf(entry);
      if (index >= 0) escapeStack.splice(index, 1);
      if (escapeStack.length === 0) window.removeEventListener("keydown", onEscapeKeyDown);
    };
  }, [enabled]);
}

/** Calls `handler` on pointer down outside of `ref`. */
export function useOutsideClick<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) handlerRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, enabled]);
}
