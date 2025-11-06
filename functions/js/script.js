// GET /js/script.js → plausible公式を中継
export async function onRequestGet() {
  const r = await fetch("https://plausible.io/js/script.js", {
    headers: { "Cache-Control": "public, max-age=600" },
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
