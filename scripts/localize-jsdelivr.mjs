import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(
  path.join(process.cwd(), "src", ".vuepress", "dist"),
);

const normalizeBase = (base) => {
  if (!base) return "/";
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
};

const detectBase = () => {
  const indexHtml = path.join(distDir, "index.html");
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, "utf8");
    const m = html.match(/<base\s+href=["']([^"']+)["']/i);
    if (m?.[1]) return normalizeBase(m[1]);
  }

  const assetsDir = path.join(distDir, "assets");
  if (fs.existsSync(assetsDir)) {
    const appFile = fs
      .readdirSync(assetsDir)
      .find((name) => /^app-.*\.js$/i.test(name));
    if (appFile) {
      const js = fs.readFileSync(path.join(assetsDir, appFile), "utf8");
      const marker = `JSON.parse('{"base":"`;
      const idx = js.indexOf(marker);
      if (idx !== -1) {
        const rest = js.slice(idx + marker.length);
        const end = rest.indexOf('"');
        if (end !== -1) return normalizeBase(rest.slice(0, end));
      }
    }
  }

  return "/";
};

const isProbablyBinary = (filePath) =>
  /\.(png|webp|ico|jpg|jpeg|gif|svg|bmp|avif|woff2?|ttf|eot|otf|pdf|zip|gz|br)$/i.test(
    filePath,
  );

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}

const escapeForUrl = (url) => {
  const u = new URL(url);
  const https = `https://${u.host}${u.pathname}${u.search}${u.hash}`;
  const http = `http://${u.host}${u.pathname}${u.search}${u.hash}`;
  const protoRelative = `//${u.host}${u.pathname}${u.search}${u.hash}`;
  const slashEscaped = (v) => v.replaceAll("/", "\\/");
  return {
    https,
    http,
    protoRelative,
    httpsEscaped: slashEscaped(https),
    httpEscaped: slashEscaped(http),
    protoRelativeEscaped: slashEscaped(protoRelative),
  };
};

const shortHash = (input) =>
  crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);

const extFromContentType = (contentType) => {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("javascript") || ct.includes("ecmascript")) return ".js";
  if (ct.includes("css")) return ".css";
  if (ct.includes("json")) return ".json";
  if (ct.includes("text/html")) return ".html";
  if (ct.includes("image/svg+xml")) return ".svg";
  if (ct.includes("image/")) return `.${ct.split("image/")[1]?.split(";")[0]}`;
  if (ct.includes("font/woff2")) return ".woff2";
  if (ct.includes("font/woff")) return ".woff";
  return "";
};

const slugify = (name) =>
  (name || "index")
    .replace(/[^A-Za-z0-9@._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "index";

const urlRe =
  /(https?:)?\/\/cdn\.jsdelivr\.net\/[A-Za-z0-9@._~%!$&'()*+,;=:/?#-]+|(https?:)?\\\/\\\/cdn\.jsdelivr\.net\\\/[A-Za-z0-9@._~%!$&'()*+,;=:\\/?#-]+/g;

if (!fs.existsSync(distDir)) {
  console.error(`[localize-jsdelivr] dist not found: ${distDir}`);
  process.exit(1);
}

const base = detectBase();

const textFiles = [];
for (const filePath of walk(distDir)) {
  if (isProbablyBinary(filePath)) continue;
  textFiles.push(filePath);
}

const urls = new Set();
const fileHits = new Map();

for (const filePath of textFiles) {
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    continue;
  }
  let match;
  while ((match = urlRe.exec(text))) {
    const raw = match[0];
    const unescaped = raw.replaceAll("\\/", "/");
    const canonical = unescaped.startsWith("//") ? `https:${unescaped}` : unescaped;
    urls.add(canonical);
    if (!fileHits.has(canonical)) fileHits.set(canonical, new Set());
    fileHits.get(canonical).add(filePath);
  }
}

if (urls.size === 0) {
  console.log("[localize-jsdelivr] no cdn.jsdelivr.net references found");
  process.exit(0);
}

const cdnDirRel = path.posix.join("_cdn", "jsdelivr");
const cdnDirAbs = path.join(distDir, ...cdnDirRel.split("/"));
fs.mkdirSync(cdnDirAbs, { recursive: true });

const replacements = new Map();

for (const url of [...urls].sort()) {
  const u = new URL(url);
  const urlExt = path.posix.extname(u.pathname);
  const baseName = slugify(path.posix.basename(u.pathname));
  const nameWithoutExt = urlExt ? baseName.slice(0, -urlExt.length) : baseName;
  const hash = shortHash(url);

  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (err) {
    console.error(`[localize-jsdelivr] download failed: ${url}`);
    console.error(err);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      `[localize-jsdelivr] download failed (${response.status}): ${url}`,
    );
    process.exit(1);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const inferredExt = urlExt || extFromContentType(contentType) || ".bin";
  const outName = `${nameWithoutExt || "asset"}__${hash}${inferredExt}`;
  const outRel = path.posix.join(cdnDirRel, outName);
  const outAbs = path.join(distDir, ...outRel.split("/"));

  if (!fs.existsSync(outAbs)) {
    const bytes = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outAbs, bytes);
  }

  const localHref = `${base}${outRel}`;
  replacements.set(url, localHref);
}

let changedFiles = 0;
for (const filePath of textFiles) {
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    continue;
  }

  let changed = false;
  for (const [url, localHref] of replacements.entries()) {
    const variants = escapeForUrl(url);
    const before = text;
    text = text.split(variants.https).join(localHref);
    text = text.split(variants.http).join(localHref);
    text = text.split(variants.protoRelative).join(localHref);
    text = text.split(variants.httpsEscaped).join(localHref);
    text = text.split(variants.httpEscaped).join(localHref);
    text = text.split(variants.protoRelativeEscaped).join(localHref);
    if (text !== before) changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, text, "utf8");
    changedFiles += 1;
  }
}

console.log(
  `[localize-jsdelivr] localized ${replacements.size} url(s); updated ${changedFiles} file(s) in ${distDir}`,
);
