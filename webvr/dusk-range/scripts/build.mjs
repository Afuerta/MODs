import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./check.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, "src"), out, { recursive: true });
console.log("Built dist/ — static files, no runtime dependencies.");
