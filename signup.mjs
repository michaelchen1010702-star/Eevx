const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const SITE = "https://eevx.app";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

if (!EMAIL || !PASSWORD) { console.error("missing EMAIL/PASSWORD"); process.exit(1); }

const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 260);
async function req(url, opts = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", ...opts });
    return { s: r.status, b: await r.text() };
  } catch (e) { return { s: "ERR", b: String(e) }; }
}
const body = o => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) });

const PAGES = ["/sign-up", "/signup", "/register", "/join", "/create-account", "/auth/sign-up"];
const ROUTES = [
  "/api/auth/register", "/api/auth/signup", "/api/auth/sign-up", "/api/register",
  "/api/signup", "/api/join", "/api/account/register", "/api/account/create",
  "/api/user/register", "/api/users/register", "/api/membership/v1/register",
  "/api/membership/v1/signup", "/api/membership/v1/join", "/api/membership/v1/invite",
  "/api/storage/v1/register", "/api/storage/v1/signup",
];

console.log("=== [1] PAGES ===");
for (const p of PAGES) {
  const r = await req(SITE + p);
  console.log(`  ${String(r.s).padEnd(4)} ${p}`);
}

console.log("\n=== [2] ROUTE DISCOVERY (GET) ===");
const live = [];
for (const p of ROUTES) {
  const r = await req(SITE + p);
  const isHtml = r.b.trimStart().startsWith("<");
  if (!isHtml) live.push(p);
  console.log(`  ${String(r.s).padEnd(4)} ${p.padEnd(40)} ${isHtml ? "[not a route]" : clean(r.b)}`);
}

console.log("\n=== [3] SUPABASE SIGNUP (known disabled) ===");
const su = await req(`${SUPA}/auth/v1/signup`, { ...body({ email: EMAIL, password: PASSWORD }), headers: { apikey: ANON, "content-type": "application/json" } });
console.log(`  ${su.s}  ${clean(su.b)}`);

console.log("\n=== [4] TRY EVERY LIVE ROUTE ===");
let token = null;
for (const p of live) {
  const r = await req(SITE + p, body({ email: EMAIL, password: PASSWORD }));
  console.log(`  ${String(r.s).padEnd(4)} ${p.padEnd(40)} ${clean(r.b)}`);
  if (r.s >= 200 && r.s < 300) {
    try { token = JSON.parse(r.b).access_token || JSON.parse(r.b).token || token; } catch {}
  }
}

console.log("\n=== [5] LOGIN ATTEMPT ===");
const li = await req(`${SUPA}/auth/v1/token?grant_type=password`, {
  ...body({ email: EMAIL, password: PASSWORD }),
  headers: { apikey: ANON, "content-type": "application/json" },
});
console.log(`  supabase password grant: ${li.s}  ${clean(li.b)}`);
if (li.s === 200) { try { token = JSON.parse(li.b).access_token; } catch {} }

console.log("\n=== [6] VERDICT ===");
if (token) {
  console.log("  GOT A SESSION TOKEN. Dumping authenticated endpoints:\n");
  const U = ["/api/membership/v1/me", "/api/membership/v1/state", "/api/membership/v1/access",
    "/api/membership/v1/tiers", "/api/membership/v1/pricing",
    "/api/storage/v1/entitlements", "/api/storage/v1/me", "/api/storage/v1/billing/summary"];
  for (const u of U) {
    const r = await req(SITE + u, { headers: { authorization: `Bearer ${token}` } });
    console.log(`  ${u}\n    ${r.s} ${clean(r.b)}\n`);
  }
} else {
  console.log("  No token. If [3] said signup_disabled and [4] found nothing,");
  console.log("  registration really is invite-only and you need the dev's link.");
}
