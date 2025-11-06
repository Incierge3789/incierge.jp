// GET /api/plausible-ignore?on=1 で自己除外Cookieを付与
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
  if (url.searchParams.get("off")) {
    headers.append("Set-Cookie","plausible_ignore=true; Path=/; Max-Age=0; SameSite=Lax");
    return new Response("off", { headers });
  }
  headers.append("Set-Cookie","plausible_ignore=true; Path=/; Max-Age=31536000; SameSite=Lax");
  return new Response("on", { headers });
}
