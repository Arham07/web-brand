import fs from "node:fs";
import net from "node:net";
import nodemailer from "nodemailer";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")]; })
);

const host = env.SMTP_HOST, port = Number(env.SMTP_PORT);
console.log(`host=${host} port=${port} user=${env.SMTP_USER} passLen=${env.SMTP_PASS?.length}`);

// 1. Can we even open a TCP socket? (ISPs and some networks block 465/587)
await new Promise((res) => {
  const s = net.createConnection({ host, port, timeout: 10000 });
  s.on("connect", () => { console.log("TCP    : ✓ connected"); s.destroy(); res(); });
  s.on("timeout", () => { console.log("TCP    : ✗ TIMEOUT — port blocked by your network/ISP"); s.destroy(); res(); });
  s.on("error", (e) => { console.log(`TCP    : ✗ ${e.code} ${e.message}`); res(); });
});

// 2. Does SMTP auth succeed?
for (const p of [465, 587]) {
  const t = nodemailer.createTransport({
    host, port: p, secure: p === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 15000,
  });
  try {
    await t.verify();
    console.log(`AUTH:${p} : ✓ SUCCESS — credentials work on port ${p}`);
  } catch (e) {
    console.log(`AUTH:${p} : ✗ ${e.code ?? ""} ${String(e.message).split("\n")[0]}`);
  }
}
