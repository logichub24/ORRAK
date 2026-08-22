import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const rootDir = process.argv[2];
const port = Number(process.argv[3] || 4180);

if (!rootDir) {
  console.error("Root directory is required.");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function safeResolve(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const resolved = normalize(join(rootDir, cleanPath));
  return resolved.startsWith(normalize(rootDir)) ? resolved : null;
}

const server = createServer((req, res) => {
  const resolvedPath = safeResolve(req.url || "/");
  if (!resolvedPath || !existsSync(resolvedPath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const stats = statSync(resolvedPath);
  if (stats.isDirectory()) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  const contentType = mimeTypes[extname(resolvedPath)] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  createReadStream(resolvedPath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static server running at http://127.0.0.1:${port}`);
});
