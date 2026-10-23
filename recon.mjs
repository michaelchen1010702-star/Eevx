const SITE = "https://eevx.app";
const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 280);
async function probe(u) {
  try {
    const r = await fetch(u, { redirect: "manual", headers: { accept: "application/json" } });
    return { s: r.status, b: await r.text() };
  } catch (e) { return { s: "ERR", b: String(e) }; }
}

const routes = [
  "/api/store/stock", "/api/store/products", "/api/store/accounts", "/api/store/catalog",
  "/api/store/inventory", "/api/accounts", "/api/accounts/stock", "/api/stock",
  "/api/catalog", "/api/plans", "/api/tiers", "/api/pricing",
  "/api/storage/v1/stock", "/api/storage/v1/catalog", "/api/storage/v1/products",
  "/api/storage/v1/orders", "/api/storage/v1/settings", "/api/storage/v1/scans",
  "/api/storage/v1/shares", "/api/storage/v1/research", "/api/storage/v1/rate-limits",
  "/api/membership/v1/me", "/api/membership/v1/session", "/api/membership/v1/config",
  "/api/membership/v1/pricing", "/api/membership/v1/checkout", "/api/membership/v1/oauth/start",
];

for (const p of routes) {
  const r = await probe(SITE + p);
  const isHtml = r.b.trimStart().startsWith("<");
  console.log(`${String(r.s).padEnd(4)} ${p.padEnd(42)} ${isHtml ? "[not a route]" : clean(r.b)}`);
}
