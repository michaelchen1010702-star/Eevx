const SITE = "https://eevx.app";
const EMAIL = process.env.EMAIL, PASSWORD = process.env.PASSWORD;
const jar = {};
const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 400);

async function req(url, opts = {}) {
  const r = await fetch(url, { redirect: "manual", ...opts });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  sc.forEach(c => { const kv = c.split(";")[0]; const i = kv.indexOf("=");
    if (i > 0) jar[kv.slice(0, i).trim()] = kv.slice(i + 1); });
  return { s: r.status, sc, b: await r.text() };
}
const cookies = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");

console.log("=== [1] NEXTAUTH ENDPOINTS ===");
for (const p of ["/api/auth/providers", "/api/auth/session", "/api/auth/csrf",
                 "/api/auth/signin", "/api/auth/error"]) {
  const r = await req(SITE + p);
  console.log(`\n  ${p} -> ${r.s}\n    ${clean(r.b)}`);
  if (r.sc.length) console.log(`    set-cookie: ${r.sc.map(c => c.split("=")[0]).join(", ")}`);
}

console.log("\n=== [2] CREDENTIALS LOGIN ===");
const csrf = await req(SITE + "/api/auth/csrf");
let csrfToken = ""; try { csrfToken = JSON.parse(csrf.b).csrfToken; } catch {}
console.log("  csrfToken:", csrfToken ? csrfToken.slice(0, 24) + "..." : "(none)");

const form = new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: "true" });
const login = await req(SITE + "/api/auth/callback/credentials", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies() },
  body: form.toString(),
});
console.log(`  -> ${login.s}\n    ${clean(login.b)}`);
if (login.sc.length) console.log(`    set-cookie: ${login.sc.map(c => c.split("=")[0]).join(", ")}`);

console.log("\n=== [3] SESSION AFTER LOGIN ===");
const sess = await req(SITE + "/api/auth/session", { headers: { cookie: cookies() } });
console.log(`  ${sess.s}  ${clean(sess.b)}`);

console.log("\n=== [4] COOKIE JAR ===");
console.log("  " + (Object.keys(jar).join(", ") || "(empty)"));

if (sess.b && sess.b.trim() !== "{}" && sess.b.trim() !== "null") {
  console.log("\n=== [5] ENTITLEMENTS WITH SESSION ===");
  for (const u of ["/api/membership/v1/me", "/api/membership/v1/state",
    "/api/membership/v1/access", "/api/membership/v1/tiers", "/api/membership/v1/pricing",
    "/api/storage/v1/entitlements", "/api/storage/v1/me"]) {
    const r = await req(SITE + u, { headers: { cookie: cookies() } });
    console.log(`\n  ${u}\n    ${r.s} ${clean(r.b)}`);
  }
}
