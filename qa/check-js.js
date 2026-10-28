// 抽取指定 HTML 的内联 <script>（无 src）做语法编译校验；fig.js/ex61.js 直接读取校验。
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LESSON = path.join(ROOT, "lessons", "lesson06-correction");
const PAGES = path.join(LESSON, "pages");

const all = fs.readdirSync(PAGES).filter(f => f.endsWith(".html"));
const pageFiles = process.argv.slice(2).map(n => {
  const hit = all.find(f => f === n || f.startsWith(n + "-") || f === n + ".html");
  if (!hit) { console.log("MISS " + n); process.exit(2); }
  return path.join(PAGES, hit);
});
const jsFiles = [path.join(LESSON, "fig.js"), path.join(LESSON, "data", "ex61.js")];

let bad = 0;

function compileCheck(code, tag) {
  try {
    // new Function 只编译不执行；足以捕获语法错误
    new Function(code);
    return null;
  } catch (e) {
    return `${tag}: ${e.message}`;
  }
}

for (const f of jsFiles) {
  const code = fs.readFileSync(f, "utf8");
  const err = compileCheck(code, path.basename(f));
  if (err) { bad++; console.log("FAIL " + err); }
  else console.log("OK   " + path.basename(f));
}

const re = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
for (const f of pageFiles) {
  const html = fs.readFileSync(f, "utf8");
  let m, i = 0, fileBad = 0;
  while ((m = re.exec(html))) {
    i++;
    if (!m[1].trim()) continue;
    const err = compileCheck(m[1], `${path.basename(f)}#script${i}`);
    if (err) { bad++; fileBad++; console.log("FAIL " + err); }
  }
  if (!fileBad) console.log("OK   " + path.basename(f) + ` (${i} inline scripts)`);
}

console.log(bad ? `\n${bad} error(s)` : "\nAll passed");
process.exit(bad ? 1 : 0);
