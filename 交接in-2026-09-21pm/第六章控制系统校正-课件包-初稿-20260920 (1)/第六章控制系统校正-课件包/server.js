/* 零依赖静态服务器：npm run dev [-- --port 7100 --host 127.0.0.1]
   Kimi Work 预览生命周期由此进程承载；转发 CLI 的 host/port 参数。 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
function arg(name, dflt) {
  const i = args.findIndex(a => a === "--" + name || a.startsWith("--" + name + "="));
  if (i === -1) return dflt;
  const a = args[i];
  return a.includes("=") ? a.split("=")[1] : (args[i + 1] || dflt);
}
const PORT = +arg("port", process.env.PORT || 7100);
const HOST = arg("host", process.env.HOST || "127.0.0.1");
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".gif": "image/gif", ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8", ".yaml": "text/yaml; charset=utf-8",
  ".woff2": "font/woff2", ".pdf": "application/pdf"
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/player/index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found: " + p); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, HOST, () => {
  console.log(`ACT courseware dev server → http://${HOST}:${PORT}/  (root: ${ROOT})`);
});
