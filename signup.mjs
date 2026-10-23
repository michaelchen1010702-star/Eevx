const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const SITE = "https://eevx.app";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 240);
async function req(url, opts = {}) {
  try { const r = await fetch(url, { redirect: "manual", ...opts });
        return { s: r.status, loc: r.headers.get("location"), b: await r.text() }; }
  catch (e) { return { s: "ERR", b: String(e) }; }
}
const title = h => (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "(none)";

console.log("=== [1] WHICH PAGES ARE REAL? ===");
for (const p of ["/sign-up", "/signup", "/register", "/join", "/create-account", "/auth/sign-up"]) {
  const r = await req(SITE + p);
  console.log(`  ${String(r.s).padEnd(4)} ${p.padEnd(16)} title="${title(r.b)}"${r.loc ? "  -> " + r.loc : ""}`);
}

console.log("\n=== [2] FOLLOW /register ===");
let u = "/register", hops = 0;
while (hops++ < 5) {
  const r = await req(SITE + u);
  console.log(`  ${String(r.s).padEnd(4)} ${u}${r.loc ? "  -> " + r.loc : ""}`);
  if (!r.loc) break;
  u = r.loc.startsWith("http") ? new URL(r.loc).pathname + new URL(r.loc).search : r.loc;
}

console.log("\n=== [3] PARAM HINTS ON /sign-up ===");
const sp = await req(SITE + "/sign-up");
for (const k of ["code", "token", "invite", "turnstile", "captcha", "email", "password", "referral"]) {
  const hits = [...sp.b.matchAll(new RegExp(k, "gi"))].length;
  if (hits) console.log(`  ${k.padEnd(12)} ${hits} hit(s)`);
}
const q = sp.b.match(/[?&](code|token|invite|ref)=/g);
console.log("  url param patterns:", q ? [...new Set(q)].join(" ") : "(none)");

console.log("\n=== [4] BODY SHAPE BRUTE FORCE ===");
const ROUTES = ["/api/auth/register", "/api/auth/signup", "/api/auth/sign-up"];
const VARIANTS = [
  ["plain",    { email: EMAIL, password: PASSWORD }],
  ["confirm",  { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD }],
  ["invite",   { email: EMAIL, password: PASSWORD, inviteCode: "" }],
  ["code",     { email: EMAIL, password: PASSWORD, code: "" }],
  ["token",    { email: EMAIL, password: PASSWORD, token: "" }],
  ["name",     { email: EMAIL, password: PASSWORD, name: "Tester" }],
  ["superset", { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD,
                 confirm: PASSWORD, passwordConfirm: PASSWORD, name: "Tester",
                 username: "tester", inviteCode: "", code: "", token: "",
                 captchaToken: "x", turnstileToken: "x" }],
];
for (const route of ROUTES) {
  console.log(`\n  -- ${route}`);
  for (const [label, obj] of VARIANTS) {
    const r = await req(SITE + route, { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify(obj) });
    console.log(`    ${String(r.s).padEnd(4)} json/${label.padEnd(9)} ${clean(r.b)}`);
  }
  const f = await req(SITE + route, { method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `email=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}` });
  console.log(`    ${String(f.s).padEnd(4)} form             ${clean(f.b)}`);

  const qs = `?email=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}`;
  const g = await req(SITE + route + qs);
  console.log(`    ${String(g.s).padEnd(4)} GET+query        ${clean(g.b)}`);
  const p2 = await req(SITE + route + qs, { method: "POST" });
  console.log(`    ${String(p2.s).padEnd(4)} POST+query       ${clean(p2.b)}`);
}

console.log("\n=== [5] LOGIN AFTER EACH ATTEMPT ===");
const li = await req(`${SUPA}/auth/v1/token?grant_type=password`, {
  method: "POST", headers: { apikey: ANON, "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
console.log(`  ${li.s}  ${clean(li.b)}`);
