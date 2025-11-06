// POST /api/plausible → plausible.io/api/event を中継
export async function onRequestPost({ request }) {
  const body = await request.text();
  const resp = await fetch("https://plausible.io/api/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("User-Agent") || "",
      "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || "",
      "Referer": request.headers.get("Referer") || "",
    },
    body,
  });
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", "*");
  return new Response(resp.body, { status: resp.status, headers: h });
}
