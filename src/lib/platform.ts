"use client";

export type Platform = "ios" | "android" | "desktop" | "unknown";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql =
    window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari: navigator.standalone (no es estándar)
  const ios =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mql || ios);
}

export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
}

export function isChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Chrome|CriOS/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
}
