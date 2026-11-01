// 供独立 Python 验证程序调用：直接执行网页实际使用的 core.js。
const fs = require("fs");
const path = require("path");
const SFR = require("./core.js");
const input = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, "test-cases.json"), "utf8"));
const output = input.cases.map(test => {
  const p = test.parameters || SFR.baseAtScan(test.config, test.scanValue).p;
  const characteristic = SFR.characteristic(p);
  const duration = test.duration || 100;
  const response = SFR.response(p, { ratedFrequency: 50, loadStep: 0.1, duration, points: 6001 });
  const { values, ...performance } = response;
  const samples = [0, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100].filter(t => t <= duration).map(t => ({ t, deviation: SFR.deviationAt(p, t, 0.1) }));
  return { name: test.name, parameters: p, characteristic, response: performance, samples };
});
process.stdout.write(JSON.stringify(output));
