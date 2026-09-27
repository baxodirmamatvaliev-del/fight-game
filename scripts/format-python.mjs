import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localPython = resolve(
  root,
  process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python",
);
const python = existsSync(localPython)
  ? localPython
  : process.platform === "win32"
    ? "python"
    : "python3";
const check = process.argv.includes("--check");
const result = spawnSync(
  python,
  ["-m", "black", ...(check ? ["--check"] : []), "public/python", "tests", "serve.py"],
  { cwd: root, stdio: "inherit" },
);

if (result.error || result.status !== 0) {
  console.error(
    "Python formatter failed. Install requirements-dev.txt in .venv; see docs/PROJECT_STRUCTURE.md.",
  );
}
process.exit(result.status ?? 1);
