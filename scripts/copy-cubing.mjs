import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve(process.cwd(), "node_modules/cubing/dist/lib/cubing");
const destDir = path.resolve(process.cwd(), "public/cubing");

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log("Successfully copied cubing.js assets to public/cubing");
} else {
  console.warn("cubing.js not found in node_modules, skipping copy.");
}
