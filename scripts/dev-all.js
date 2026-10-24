import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("====================================================");
console.log("🚀 STARTING GIFTINGWELLNESS UNIFIED DEV ENVIRONMENT");
console.log("   ➜ Backend API:  http://localhost:5000 & 5001");
console.log("   ➜ Storefront:   http://localhost:5173");
console.log("   ➜ Admin Portal: http://localhost:5174");
console.log("====================================================\n");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

// 1. Spawn Backend
const backend = spawn(npmCmd, ["--prefix", "backend", "run", "dev"], {
  cwd: rootDir,
  shell: true,
  stdio: "inherit",
});

// 2. Spawn Frontend
const frontend = spawn(npmCmd, ["--prefix", "frontend", "run", "dev"], {
  cwd: rootDir,
  shell: true,
  stdio: "inherit",
});

// Graceful cleanup on Ctrl+C or termination
const cleanExit = () => {
  console.log("\n🛑 Shutting down Giftingwellness services...");
  try {
    if (backend && !backend.killed) backend.kill("SIGINT");
    if (frontend && !frontend.killed) frontend.kill("SIGINT");
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);
backend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.warn(`[Backend] Process exited with code ${code}`);
  }
});
frontend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.warn(`[Frontend] Process exited with code ${code}`);
  }
});
