const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const SITE = "https://eevx.app";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";

const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 400);
async function probe(url, opts = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", ...opts });
    return { s: r.status, loc: r.headers.get("location"), b: await r.text() };
  } catch (e) { return { s: "ERR", b: String(e) }; }
}

console.log("\n[A] MORE API ROUTES");
for (const p of ["/api/membership/v1/oauth/callback", "/api/membership/v1/logout",
  "/api/membership/v1/plans", "/api/membership/v1/tiers", "/api/membership/v1/webhook",
  "/api/membership/v1/state?format=json", "/api/remote/devices/register",
  "/api/storage/v1/accounts", "/api/storage/v1/devices", "/api/storage/v1/entitlements",
  "/api/storage/v1/plans", "/api/config/membership", "/api/health", "/api/version"]) {
  const r = await probe(SITE + p, { headers: { accept: "application/json" } });
  const isHtml = r.b.trimStart().startsWith("<");
  console.log(`  ${String(r.s).padEnd(4)} ${p.padEnd(42)} ${isHtml ? "[html]" : clean(r.b)}`);
}

console.log("\n[B] REST HEADER STYLES (does Authorization change the 401?)");
for (const [label, h] of [
  ["apikey only", { apikey: ANON }],
  ["apikey + Bearer anon", { apikey: ANON, Authorization: `Bearer ${ANON}` }],
  ["Bearer anon only", { Authorization: `Bearer ${ANON}` }],
]) {
  const r = await probe(`${SUPA}/rest/v1/app_slots?select=*&limit=1`, { headers: h });
  console.log(`  ${String(r.s).padEnd(4)} ${label.padEnd(24)} ${clean(r.b)}`);
}

console.log("\n[C] TABLE ORACLE — ROUND 3");
for (const t of ["app_trials", "storage_entitlements", "store_settings", "storage_scans",
  "storage_shares", "storage_billing_events", "app_modules", "app_plans", "app_seats",
  "app_licenses", "app_keys", "app_hwid", "app_resets", "store_payments", "store_refunds",
  "store_coupons", "store_inventory", "store_batches", "storage_files", "storage_uploads",
  "storage_snapshots", "storage_backups", "storage_sessions", "storage_logs",
  "storage_events", "storage_usage", "storage_limits", "storage_resets"]) {
  const r = await probe(`${SUPA}/rest/v1/${t}?select=*&limit=1`, { headers: { apikey: ANON } });
  const hint = r.b.match(/'public\.([a-z_]+)'/)?.[1] || "";
  console.log(`  ${r.s}  ${t.padEnd(28)}${hint ? "-> " + hint : ""}`);
}

console.log("\n[D] CHUNKS WITH CONTEXT");
const pages = ["/", "/subscriptions", "/sign-in", "/policy", "/account"];
let all = "";
for (const p of pages) all += await (await fetch(SITE + p)).text() + "\n";
const html = await (await fetch(SITE)).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/immutable\/chunks\/[\w.-]+\.js/g)].map(m => m[0]))];
for (const c of chunks) all += await (await fetch(SITE + c)).text() + "\n";
console.log(`  corpus: ${all.length} chars`);
const ctx = (re, label) => {
  const out = new Set();
  for (const m of all.matchAll(re)) {
    const i = m.index;
    out.add(all.slice(Math.max(0, i - 75), i + 75).replace(/\s+/g, " "));
  }
  console.log(`\n  --- ${label} (${out.size}) ---`);
  [...out].slice(0, 22).forEach(s => console.log("    …" + s + "…"));
};
ctx(/\btier\b/gi, "TIER");
ctx(/\bmodule/gi, "MODULE");
ctx(/entitle/gi, "ENTITLE");
ctx(/\btrial\b/gi, "TRIAL");
ctx(/patreon/gi, "PATREON");
ctx(/\b(monthly|lifetime|annual|yearly)\b/gi, "PERIOD");
ctx(/\b(slot|seat)s?\b/gi, "SLOT");
