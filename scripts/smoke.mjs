// Minimal stdio MCP smoke test — sends initialize, tools/list, tools/call(scan_stack), then exits.
import { spawn } from "node:child_process";
import path from "node:path";

const server = spawn(process.execPath, [path.resolve("dist/index.js")], {
  stdio: ["pipe", "pipe", "inherit"],
});

const responses = [];
let buf = "";
server.stdout.on("data", (chunk) => {
  buf += chunk.toString("utf8");
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (line) {
      try { responses.push(JSON.parse(line)); }
      catch { console.error("non-JSON line:", line); }
    }
  }
});

const send = (msg) => server.stdin.write(JSON.stringify(msg) + "\n");
const wait = (n, t = 5000) => new Promise((res, rej) => {
  const start = Date.now();
  const iv = setInterval(() => {
    if (responses.length >= n) { clearInterval(iv); res(); }
    else if (Date.now() - start > t) { clearInterval(iv); rej(new Error(`timeout waiting for ${n} responses`)); }
  }, 25);
});

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke", version: "0.0.1" },
}});
await wait(1);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
await wait(2);

const calls = [
  { id: 3,  name: "scan_stack",      arguments: { projectPath: process.cwd() } },
  { id: 4,  name: "list_libraries",  arguments: {} },
  { id: 5,  name: "forge_component", arguments: { description: "glassmorphism pricing card with hover glow" } },
  { id: 6,  name: "forge_skeleton",  arguments: { componentDescription: "card with avatar, two text lines, and a button" } },
  { id: 7,  name: "forge_dark",      arguments: { componentCode: "<div className=\"bg-white text-gray-900 p-6 rounded-lg\">Hi</div>" } },
  { id: 8,  name: "forge_page",      arguments: { pageType: "saas" } },
  { id: 9,  name: "get_reference",   arguments: { name: "01-framer-motion" } },
  { id: 10, name: "list_references", arguments: {} },
  { id: 11, name: "forge_component", arguments: { description: "aceternity tracing beam hero" }, _depthCheck: /aceternity|tracingbeam|tracing beam/i, _label: "depth-gain (aceternity)" },
];
for (const c of calls) {
  send({ jsonrpc: "2.0", id: c.id, method: "tools/call", params: { name: c.name, arguments: c.arguments } });
}
await wait(2 + calls.length, 30000);

const init = responses.find(r => r.id === 1);
const list = responses.find(r => r.id === 2);

console.log("--- initialize ---");
console.log("server:", init?.result?.serverInfo, "protocol:", init?.result?.protocolVersion);
console.log("--- tools/list ---");
console.log("count:", list?.result?.tools?.length, "tools:", list?.result?.tools?.map(t => t.name));
console.log("--- tools/call results ---");
let allGreen = true;
for (const c of calls) {
  const r = responses.find(x => x.id === c.id);
  const ok = r && !r.error && !r.result?.isError;
  if (!ok) allGreen = false;
  const text = r?.result?.content?.[0]?.text ?? "";
  const len = text.length;
  const label = c._label ? ` [${c._label}]` : "";
  let extra = "";
  if (c._depthCheck) {
    const matched = c._depthCheck.test(text);
    if (!matched) allGreen = false;
    extra = ` depthMatch=${matched}`;
  }
  console.log(`  ${(c.name + label).padEnd(34)} isError=${r?.result?.isError ?? false} contentLen=${len}${extra}`);
  if (r?.error) console.log(`    rpc err:`, r.error);
}
console.log("---");
console.log(allGreen ? "ALL GREEN" : "SOMETHING FAILED");

server.kill();
process.exit(allGreen ? 0 : 1);
