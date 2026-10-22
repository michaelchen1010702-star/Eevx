const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";
const H = { apikey: ANON };
const EMAIL = `recon+${Date.now()}@example.com`;
const PASS = "ReconPass123!";

const call = async (path, opts = {}) => {
  const r = await fetch(SUPA + path, { headers: H, ...opts });
  const t = await r.text();
  try { return { s: r.status, b: JSON.parse(t) }; } catch { return { s: r.status, b: t }; }
};
const post = (p, d) => call(p, { method: "POST",
  headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(d) });

console.log("\n[1] AUTH SETTINGS");
console.log(JSON.stringify((await call("/auth/v1/settings")).b, null, 1));

console.log(`\n[2] SIGNUP ${EMAIL}`);
const su = await post("/auth/v1/signup", { email: EMAIL, password: PASS });
console.log(su.s, JSON.stringify(su.b).slice(0, 250));
let token = su.b?.access_token;

if (!token) {
  console.log("\n[3] PASSWORD GRANT");
  const tk = await post("/auth/v1/token?grant_type=password", { email: EMAIL, password: PASS });
  console.log(tk.s, JSON.stringify(tk.b).slice(0, 250));
  token = tk.b?.access_token;
}
const AH = token ? { ...H, Authorization: `Bearer ${token}` } : H;
console.log(token ? ">>> GOT JWT" : ">>> no JWT (email confirmation is on)");

console.log("\n[4] TABLE PROBE (200/401 = exists, 403 = exists, 404 = missing)");
for (const t of ["app_slots","app_devices","app_customers","app_plans","app_licenses",
  "store_orders","store_outbox","store_extractions","store_plans","store_products",
  "storage_accounts","storage_retired_subscriptions","storage_files"]) {
  const r = await fetch(`${SUPA}/rest/v1/${t}?select=*&limit=1`, { headers: AH });
  const hint = (await r.text()).match(/'public\.([a-z_]+)'/)?.[1] || "";
  console.log(`  ${r.status}  ${t}${hint ? "   -> try: " + hint : ""}`);
}

console.log("\n[5] STORAGE BUCKETS");
for (const b of ["accounts","orders","downloads","exports","backups","store"]) {
  const r = await fetch(`${SUPA}/storage/v1/object/list/${b}`, { method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 3 }) });
  console.log(`  ${r.status}  ${b}  ${(await r.text()).slice(0, 140)}`);
}

console.log("\n[6] JS CHUNKS (this is the jackpot)");
const html = await (await fetch("https://eevx.app/")).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/immutable\/chunks\/[\w.-]+\.js/g)].map(m => m[0]))];
console.log(`  fetching ${chunks.length} chunks`);
const ids = new Set(), rpcs = new Set(), apis = new Set();
for (const c of chunks) {
  const js = await (await fetch("https://eevx.app" + c)).text();
  for (const m of js.matchAll(/\b(?:app|store|storage)_[a-z_]{2,}/g)) ids.add(m[0]);
  for (const m of js.matchAll(/rpc\/([a-z_]+)/g)) rpcs.add(m[1]);
  for (const m of js.matchAll(/["'](\/api\/[\w\/-]+)/g)) apis.add(m[1]);
}
console.log("\n  identifiers:\n   ", [...ids].sort().join("\n    "));
console.log("\n  rpc:\n   ", [...rpcs].sort().join("\n    "));
console.log("\n  api routes:\n   ", [...apis].sort().join("\n    "));
