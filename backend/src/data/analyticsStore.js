import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Privacy-light visit counter for the admin "Users & visitors" page.
// Stores per day: page views, page paths, and anonymous random visitor ids generated
// in the browser. No IP addresses, names or emails are recorded.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ANALYTICS_FILE = path.join(__dirname, "analytics.json");

const KEEP_DAYS = 90;
const MAX_PAGES_PER_DAY = 300;

let cache = null;
let saveTimer = null;

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

const load = () => {
  if (cache) return cache;
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf-8"));
      cache = parsed && typeof parsed.days === "object" ? parsed : { days: {} };
      return cache;
    }
  } catch (err) {
    console.warn("[AnalyticsStore] Could not read analytics.json, starting fresh:", err.message);
  }
  cache = { days: {} };
  return cache;
};

const prune = () => {
  const cutoff = dayKey(new Date(Date.now() - KEEP_DAYS * 86400000));
  for (const key of Object.keys(cache.days)) {
    if (key < cutoff) delete cache.days[key];
  }
};

// Batch writes so a busy page doesn't write the file on every request.
const scheduleSave = () => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      prune();
      const tmp = `${ANALYTICS_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(cache), "utf-8");
      fs.renameSync(tmp, ANALYTICS_FILE);
    } catch (err) {
      console.error("[AnalyticsStore] Failed to save analytics.json:", err.message);
    }
  }, 3000);
  saveTimer.unref?.();
};

/** Record one page view. visitorId is an anonymous browser-generated id. */
export const recordVisit = ({ visitorId, path: pagePath }) => {
  const data = load();
  const key = dayKey();
  const day = (data.days[key] ||= { views: 0, visitors: {}, pages: {} });
  day.views += 1;
  day.visitors[visitorId] = 1;
  if (day.pages[pagePath] !== undefined || Object.keys(day.pages).length < MAX_PAGES_PER_DAY) {
    day.pages[pagePath] = (day.pages[pagePath] || 0) + 1;
  }
  scheduleSave();
};

/** Totals for today / 7 / 30 days, a 30-day daily series, and top pages. */
export const getVisitSummary = () => {
  const data = load();
  const today = new Date();
  const series = [];
  const uniq = { d1: new Set(), d7: new Set(), d30: new Set() };
  const views = { d1: 0, d7: 0, d30: 0 };
  const pages = {};

  for (let i = 29; i >= 0; i -= 1) {
    const key = dayKey(new Date(today.getTime() - i * 86400000));
    const day = data.days[key];
    const ids = day ? Object.keys(day.visitors) : [];
    series.push({ date: key, views: day?.views || 0, visitors: ids.length });
    if (!day) continue;
    const windows = i === 0 ? ["d1", "d7", "d30"] : i < 7 ? ["d7", "d30"] : ["d30"];
    for (const w of windows) {
      views[w] += day.views;
      ids.forEach((id) => uniq[w].add(id));
    }
    for (const [p, n] of Object.entries(day.pages)) pages[p] = (pages[p] || 0) + n;
  }

  return {
    today: { views: views.d1, visitors: uniq.d1.size },
    last7Days: { views: views.d7, visitors: uniq.d7.size },
    last30Days: { views: views.d30, visitors: uniq.d30.size },
    daily: series,
    topPages: Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pagePath, count]) => ({ path: pagePath, views: count })),
  };
};
