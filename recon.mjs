const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const SITE = "https://eevx.app";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";
const EMAIL = "put-your-real-email-here@example.com";

const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 450);

async function probe(url, opts = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", ...opts });
    return { s: r.status, loc: r.headers.get("location"), b: await r.text() };
  } catch (e) { return { s: "ERR", b: String(e) }; }
}

console.log("\n[A] PUBLIC API ROUTES (unauthenticated)");
for (const p of ["/api/config", "/api/broadcast", "/api/membership/v1/state",
  "/api/membership/v1/access", "/api/remote/devices", "/api/storage/v1/me",
  "/api/storage/v1/billing/summary", "/api/membership/v1/login/web"]) {
  const r = await probe(SITE + p, { headers: { accept: "application/json" } });
  console.log(`\n  ${p}\n    status: ${r.s}${r.loc ? "\n    redirect: " + r.loc : ""}\n    body: ${clean(r.b)}`);
}

console.log("\n[B] STORAGE BUCKETS (now with Authorization)");
const SH = { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" };
for (const b of ["accounts", "orders", "downloads", "exports", "backups",
                 "store", "public", "avatars", "files", "csv"]) {
  const r = await probe(`${SUPA}/storage/v1/object/list/${b}`, {
    method: "POST", headers: SH, body: JSON.stringify({ prefix: "", limit: 3 }) });
  console.log(`  ${r.s}  ${b.padEnd(12)} ${clean(r.b)}`);
}

console.log("\n[C] TABLE ORACLE (extended; 404 = missing, else exists)");
const names = ["app_slots", "app_devices", "app_customers", "app_plans", "app_tiers",
  "app_modules", "app_entitlements", "app_access", "app_roles", "app_sessions",
  "store_orders", "store_outbox", "store_extractions", "store_claims", "store_plans",
  "store_products", "store_customers", "store_billing", "store_prices",
  "storage_accounts", "storage_devices", "storage_retired_subscriptions",
  "storage_plans", "storage_tiers", "storage_orders", "storage_billing", "storage_sessions"];
for (const t of names) {
  const r = await probe(`${SUPA}/rest/v1/${t}?select=*&limit=1`, { headers: { apikey: ANON } });
  const hint = r.b.match(/'public\.([a-z_]+)'/)?.[1] || "";
  console.log(`  ${r.s}  ${t.padEnd(30)}${hint ? "-> " + hint : ""}`);
}

console.log("\n[D] CHUNK GREP (deeper patterns)");
const html = await (await fetch(SITE)).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/immutable\/chunks\/[\w.-]+\.js/g)].map(m => m[0]))];
let all = "";
for (const c of chunks) all += await (await fetch(SITE + c)).text() + "\n";
console.log(`  ${chunks.length} chunks, ${all.length} chars`);
const dump = (label, re) => {
  const s = new Set([...all.matchAll(re)].map(m => m[1] ?? m[0]));
  console.log(`\n  ${label}:\n    ${[...s].sort().join(", ") || "(none)"}`);
};
dump("api routes", /["'`](\/api\/[\w\/-]+)/g);
dump("tables", /\b((?:app|store|storage)_[a-z_]{2,})\b/g);
dump("tier/plan/module words", /\b(tier|plan|module|entitle|patreon|subscription|access)[A-Za-z_]*\b/g);
dump("slot/device words", /\b(slot|device|hwid|seat|machine|remote)[A-Za-z_]*\b/g);
dump("patreon urls", /patreon\.com\/[\w-]+/g);

console.log("\n[E] CAN WE STILL GET AN ACCOUNT?");
const r1 = await probe(`${SUPA}/auth/v1/otp`, { method: "POST",
  headers: { apikey: ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, create_user: true }) });
console.log(`  otp/create_user: ${r1.s} ${clean(r1.b)}`);
const r2 = await probe(`${SUPA}/auth/v1/recover`, { method: "POST",
  headers: { apikey: ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL }) });
console.log(`  recover:         ${r2.s} ${clean(r2.b)}`);
