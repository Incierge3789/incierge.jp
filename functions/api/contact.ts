// functions/api/contact.ts
export const onRequestPost: PagesFunction<{ INTAKE_KV: KVNamespace; TURNSTILE_SECRET: string }> = async (ctx) => {
  const { request, env } = ctx;

  // ---- 受け取り（フォームのみ受け付け）----
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/x-www-form-urlencoded")) {
    return new Response("Unsupported Content-Type", { status: 415 });
  }

  const form = await request.formData();
  const name    = String(form.get("name") || "");
  const email   = String(form.get("email") || "");
  const message = String(form.get("message") || "");
  const company = String(form.get("company") || "");
  const website = String(form.get("website") || "");
  const token   = String(form.get("cf-turnstile-response") || ""); // ← Turnstile

  if (!name || !email || !message) return new Response("Bad Request", { status: 400 });
  if (!token) return new Response("Turnstile token missing", { status: 400 });

  // ---- Turnstile 検証 ----
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,                         // Pages 変数
      response: token,
      remoteip: request.headers.get("cf-connecting-ip") || ""
    }),
  });
  const verifyJson: any = await verifyRes.json();
  if (!verifyJson.success) return new Response("Verification failed", { status: 400 });

  // ---- 保存 ----
  const ticket = crypto.randomUUID();
  const key = `contact:${ticket}`;
  await env.INTAKE_KV.put(
    key,
    JSON.stringify({
      ticket, name, email, company, website, message,
      ua: request.headers.get("user-agent") || "",
      ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
      created_at: new Date().toISOString(),
      referer: request.headers.get("referer") || "",
    }),
    { expirationTtl: 60 * 60 * 24 * 14 }
  );

  // ---- サンクスへ ----
  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// 保存確認用（任意）
export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("ticket required", { status: 400 });
  const data = await ctx.env.INTAKE_KV.get(`contact:${ticket}`);
  if (!data) return new Response("not found", { status: 404 });
  return new Response(data, { status: 200, headers: { "content-type": "application/json" } });
};
