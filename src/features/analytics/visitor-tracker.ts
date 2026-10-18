"use client";

function generateClientUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  return "vis_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "bf_visitor_id";
    let id = localStorage.getItem(key);
    if (!id || id.trim().length === 0) {
      id = generateClientUuid();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "guest_anonymous";
  }
}

export async function trackSiteVisit(path = "/"): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const sessionKey = `bf_v_${path}`;
    const lastTracked = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    // Debounce within the same tab session (10 minutes)
    if (lastTracked) {
      const parsedTime = Number.parseInt(lastTracked, 10);
      if (!Number.isNaN(parsedTime) && now - parsedTime < 10 * 60 * 1000) {
        return;
      }
    }

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    sessionStorage.setItem(sessionKey, String(now));

    await fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        visitorId,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
      keepalive: true,
    });
  } catch {
    // Analytics tracking failures must never disrupt the user application
  }
}
