// One-click demo logins and visible default credentials exist for local development only.
// `vite build` sets DEV to false, so production bundles never sign anyone in automatically.
export const DEMO_LOGIN_ENABLED = import.meta.env.DEV;
