import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tracked = [
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  ".openai",
];
const dirty = execFileSync("git", ["status", "--porcelain", "--", ...tracked], {
  cwd: root,
  encoding: "utf8",
});
if (dirty.trim())
  throw new Error(
    "Commit game source before packaging a deployment.\n" + dirty,
  );
const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
execFileSync(process.execPath, ["scripts/build.mjs"], {
  cwd: root,
  stdio: "inherit",
});
execFileSync(
  "tar",
  ["-czf", "neon-clash.tar.gz", "dist", ".openai/hosting.json"],
  { cwd: root, stdio: "inherit" },
);
console.log(
  `Deployment archive: ${resolve(root, "neon-clash.tar.gz")}\nSource commit: ${sha}`,
);
