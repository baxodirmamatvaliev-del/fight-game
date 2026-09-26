import { cp, mkdir, access, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
await access(resolve(root, "node_modules/pyodide/pyodide.asm.wasm"));
// Only the exact generated directory is replaced; original sources are preserved.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "public"), output, { recursive: true });
await mkdir(resolve(output, "vendor/pyodide"), { recursive: true });
for (const file of [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
])
  await cp(
    resolve(root, "node_modules/pyodide", file),
    resolve(output, "vendor/pyodide", file),
  );
console.log(
  "NEON CLASH built → dist/ (Python runtime bundled, no runtime CDN required)",
);
