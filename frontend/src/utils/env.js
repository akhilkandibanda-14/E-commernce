// One-click demo logins and visible default credentials exist for local development only.
// `vite build` sets DEV to false, so production bundles never sign anyone in automatically.
export const DEMO_LOGIN_ENABLED = import.meta.env.DEV;

// True on the separate admin portal build/port. The storefront also serves /admin for admins.
export const IS_ADMIN_PORTAL =
  (typeof window !== "undefined" && window.location.port === "5174") ||
  import.meta.env.VITE_PORTAL_TYPE === "admin";

// Admin sign-in is offered only on the admin portal or on an /admin page, never elsewhere on the shop.
export const isAdminSignInContext = (pathname = window.location.pathname) =>
  IS_ADMIN_PORTAL || pathname.startsWith("/admin");
