import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
if (!scripts.length) throw new Error("No game scripts linked");
for (const file of scripts)
  new vm.Script(fs.readFileSync(path.join(root, "src", file), "utf8"), {
    filename: file,
  });
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
if (ids.length !== new Set(ids).size) throw new Error("Duplicate DOM IDs");
for (const id of [
  "gl",
  "menu",
  "flatBtn",
  "pauseMenu",
  "objective",
  "vrBtn",
  "arBtn",
])
  if (!ids.includes(id)) throw new Error("Missing " + id);
for (const m of html.matchAll(/<link[^>]+href="([^:"]+)"/g))
  if (!fs.existsSync(path.join(root, "src", m[1])))
    throw new Error("Missing stylesheet " + m[1]);
console.log(
  `Validated ${scripts.length} game scripts, local stylesheets, and ${ids.length} unique element IDs.`,
);
