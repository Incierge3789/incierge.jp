export const onRequestPost: PagesFunction<{ INTAKE_KV: KVNamespace }> = async ({ request, env }) => {
  try {
    const body = await request.json();
    const payload = {
      message: body.message || "",
      name: body.name || "",
      email: body.email || "",
      at: new Date().toISOString(),
    };
    const ticket = crypto.randomUUID().slice(0, 12);
    await env.INTAKE_KV.put(`ticket:${ticket}`, JSON.stringify(payload), { expirationTtl: 7 * 24 * 60 * 60 });
    return new Response(JSON.stringify({ ticket }), { headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "invalid" }), { status: 400 });
  }
};

export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace }> = async ({ request, env }) => {
  const url = new URL(request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("missing ticket", { status: 400 });
  const data = await env.INTAKE_KV.get(`ticket:${ticket}`);
  return new Response(data || "not found", { headers: { "content-type": "application/json" } });
};
