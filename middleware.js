// Password gate for the Vercel deployment (Vercel Routing Middleware, runs on the Edge).
// Set the password in Vercel: Project -> Settings -> Environment Variables -> SITE_PASSWORD.
// Opening index.html straight from disk skips this file, so local use needs no password.

export const config = { matcher: "/:path*" };

const COOKIE = "sdd_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // stay signed in for 7 days

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.SITE_PASSWORD;

  if (!password) {
    return html(page("The site password has not been set up yet. Add SITE_PASSWORD in the Vercel project settings, then redeploy."), 503);
  }

  const token = await sign(password);

  if (url.pathname === "/logout") {
    return redirect("/", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    const given = String(form?.get("password") ?? "");
    const next = safeNext(String(form?.get("next") ?? "/"));
    if ((await sign(given)) === token) {
      return redirect(next, `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
    }
    return html(page("", "Incorrect password. Try again.", next), 401);
  }

  if (readCookie(request, COOKIE) === token) {
    return new Response(null, { headers: { "x-middleware-next": "1" } }); // let the request through
  }

  const next = url.pathname === "/login" ? "/" : url.pathname + url.search;
  return html(page("", "", next), 401);
}

// HMAC of a fixed label keyed by the password: the cookie never holds the password,
// and changing SITE_PASSWORD signs everyone out.
async function sign(secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("sourcing-decision-desk"));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

// Only allow redirects back to a path on this site.
function safeNext(next) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function redirect(location, cookie) {
  return new Response(null, { status: 303, headers: { Location: location, "Set-Cookie": cookie, "Cache-Control": "no-store" } });
}

function html(body, status) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function page(notice, error = "", next = "/") {
  const form = notice
    ? `<p class="note">${esc(notice)}</p>`
    : `<form method="post" action="/login">
        <input type="hidden" name="next" value="${esc(next)}">
        <label for="pw">Password</label>
        <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
        ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}
        <button type="submit">Open the demo</button>
      </form>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sign in · Sourcing Decision Desk</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Georama:wght@400;500;600;700&display=swap">
<style>
:root{--red:#E31837;--red-deep:#5F0229;--red-tint:#FDEEEF;--ink:#29251D;--ink-2:#4A453D;--cream:#F6F2EA;--line:#E9E4DA;--muted:#7A746A;--white:#fff}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:"Georama","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;font-size:15px;line-height:1.5;color:var(--ink);background:var(--cream);display:grid;place-items:center;padding:16px}
.card{width:100%;max-width:380px;background:var(--white);border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(41,37,29,.06),0 8px 28px rgba(41,37,29,.08);padding:32px 28px;border-top:4px solid var(--red)}
.brand{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--red)}
h1{font-size:22px;line-height:1.25;margin:6px 0 4px}
.sub{color:var(--muted);margin:0 0 24px;font-size:14px}
label{display:block;font-weight:600;font-size:13px;margin-bottom:6px;color:var(--ink-2)}
input[type=password]{width:100%;font:inherit;padding:11px 12px;border:1px solid #D8D1C4;border-radius:8px;background:var(--white);color:var(--ink)}
input[type=password]:focus{outline:2px solid var(--red);outline-offset:1px;border-color:transparent}
button{margin-top:16px;width:100%;font:inherit;font-weight:600;padding:11px 14px;border:0;border-radius:8px;background:var(--red);color:var(--white);cursor:pointer}
button:hover{background:#c8132f}
button:focus-visible{outline:2px solid var(--red-deep);outline-offset:2px}
.err{margin:10px 0 0;padding:8px 10px;border-radius:6px;background:var(--red-tint);color:var(--red-deep);font-size:13px}
.note{margin:0;color:var(--ink-2)}
</style>
</head>
<body>
<main class="card">
  <div class="brand">Tech Mahindra</div>
  <h1>Sourcing Decision Desk</h1>
  <p class="sub">This demo is private. Enter the password to continue.</p>
  ${form}
</main>
</body>
</html>`;
}
