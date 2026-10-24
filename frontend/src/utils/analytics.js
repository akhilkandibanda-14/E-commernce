import { getApiUrl } from "./apiConfig";
import { IS_ADMIN_PORTAL } from "./env";

// Anonymous page-view beacon for the admin "Users & visitors" page.
// Sends a random per-browser id and the page path only; never names, emails or query strings.
const KEY = "gw_visitor_id";

const visitorId = () => {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked: skip tracking rather than invent a new id every page
  }
};

export const trackPageView = (pathname) => {
  // Admin screens and the admin portal aren't customer visits.
  if (IS_ADMIN_PORTAL || pathname.startsWith("/admin")) return;
  if (navigator.doNotTrack === "1") return;
  const id = visitorId();
  if (!id) return;
  fetch(getApiUrl("/api/analytics/visit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId: id, path: pathname }),
    keepalive: true,
  }).catch(() => {});
};
