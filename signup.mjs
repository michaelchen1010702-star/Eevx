const SUPA = "https://ygyaoulwimaknuebagjf.supabase.co";
const SITE = "https://eevx.app";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWFvdWx3aW1ha251ZWJhZ2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTEzMjYsImV4cCI6MjEwNDE4NzMyNn0.Gyy5P1D5woPdpOCOrlFB7bHveVT3AHOjCINLGWe2EgA";
const EMAIL = process.env.EMAIL, PASSWORD = process.env.PASSWORD;

const clean = s => (s || "").replace(/\s+/g, " ").slice(0, 200);
async function req(url, opts = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", ...opts });
    const hs = {}; r.headers.forEach((v, k) => { if (k.startsWith("x-") || k === "content-type") hs[k] = v; });
    return { s: r.status, hs, b: await r.text() };
  } catch (e) { return { s: "ERR", hs: {}, b: String(e) }; }
}
const J = o => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) });
const show = r => `${r.s}  ${clean(r.b)}  ${JSON.stringify(r.hs)}`;

console.log("=== [1] IS /api/auth/* A CATCH-ALL? ===");
for (const p of ["/api/auth", "/api/auth/", "/api/auth/zzz", "/api/auth/foo/bar", "/api/auth/register"]) {
  const r = await req(SITE + p);
  console.log(`  ${p.padEnd(26)} ${show(r)}`);
}

console.log("\n=== [2] ACTION NAMES ===");
for (const a of ["register", "signup", "sign-up", "create", "create-account", "join",
                 "invite", "verify", "confirm", "resend", "otp", "magic", "new"]) {
  const r = await req(`${SITE}/api/auth/${a}`, J({ email: EMAIL, password: PASSWORD }));
  console.log(`  ${a.padEnd(16)} ${show(r)}`);
}

console.log("\n=== [3] NON-EMPTY PARAM VARIANTS ===");
const V = [
  ["base",         { email: EMAIL, password: PASSWORD }],
  ["code",         { email: EMAIL, password: PASSWORD, code: "TEST" }],
  ["inviteCode",   { email: EMAIL, password: PASSWORD, inviteCode: "TEST" }],
  ["invite",       { email: EMAIL, password: PASSWORD, invite: "TEST" }],
  ["token",        { email: EMAIL, password: PASSWORD, token: "TEST" }],
  ["captchaToken", { email: EMAIL, password: PASSWORD, captchaToken: "TEST" }],
  ["turnstile",    { email: EMAIL, password: PASSWORD, turnstileToken: "TEST" }],
  ["cfT",          { email: EMAIL, password: PASSWORD, cfTurnstileResponse: "TEST" }],
  ["confirm",      { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD }],
  ["everything",   { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD, confirm: PASSWORD,
                     name: "Tester", username: "tester", code: "TEST", inviteCode: "TEST",
                     invite: "TEST", token: "TEST", captchaToken: "TEST",
                     turnstileToken: "TEST", cfTurnstileResponse: "TEST" }],
];
for (const route of ["/api/auth/register", "/api/auth/signup"]) {
  console.log(`\n  -- ${route}`);
  for (const [label, o] of V) console.log(`    ${label.padEnd(14)} ${show(await req(SITE + route, J(o)))}`);
}

console.log("\n=== [4] EXTRA HEADERS ===");
for (const h of [{ origin: SITE }, { "x-requested-with": "XMLHttpRequest" }, { accept: "application/json" }]) {
  const r = await req(SITE + "/api/auth/register",
    { ...J({ email: EMAIL, password: PASSWORD }), headers: { "content-type": "application/json", ...h } });
  console.log(`  ${JSON.stringify(h).padEnd(42)} ${show(r)}`);
}
