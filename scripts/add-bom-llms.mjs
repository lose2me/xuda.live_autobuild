import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(
  path.join(process.cwd(), "src", ".vuepress", "dist"),
);

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}

let count = 0;
for (const filePath of walk(distDir)) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".txt" && ext !== ".md") continue;

  const buf = fs.readFileSync(filePath);
  // Skip if already has BOM
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) continue;

  fs.writeFileSync(filePath, Buffer.concat([BOM, buf]));
  count += 1;
}

console.log(`[add-bom-llms] added UTF-8 BOM to ${count} file(s) in ${distDir}`);
