// functions/api/contact.ts
export const onRequestPost: PagesFunction<{ INTAKE_KV: KVNamespace; TURNSTILE_SECRET: string }> = async (ctx) => {
  const { request, env } = ctx;

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
  const token   = String(form.get("cf-turnstile-response") || "");

  if (!name || !email || !message) return new Response("Bad Request", { status: 400 });
  if (!token) return new Response("Turnstile token missing", { status: 400 });

  // --- Turnstile verify ---
  const secret = (env as any).TURNSTILE_SECRET as string | undefined;

  // ここで「実行時に env が入っているか」を可視化
  if (!secret || secret.length < 10) {
    return new Response(
      JSON.stringify({
        ok: false,
        why: "secret_env_invalid",
        note: "Pages/Production/変数とシークレット(ランタイム)に TURNSTILE_SECRET を入れてデプロイすること",
        envKeys: Object.keys((ctx as any).env || {}).sort(),
        secretLen: secret ? secret.length : 0,
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: request.headers.get("cf-connecting-ip") || "",
    }),
  });
  const verifyJson: any = await verifyRes.json();
  if (!verifyJson?.success) {
    return new Response(JSON.stringify({ ok: false, error: "turnstile", verifyJson }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }
  // --- /verify ---

  const ticket = crypto.randomUUID();
  await env.INTAKE_KV.put(
    `contact:${ticket}`,
    JSON.stringify({
      ticket, name, email, company, website, message,
      ua: request.headers.get("user-agent") || "",
      ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
      created_at: new Date().toISOString(),
      referer: request.headers.get("referer") || "",
    }),
    { expirationTtl: 60 * 60 * 24 * 14 }
  );

  return new Response(null, { status: 303, headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` } });
};

// GET: ?diag=1 は残す（任意）
export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace; TURNSTILE_SECRET: string }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.searchParams.get("diag") === "1") {
    const secret = (ctx.env as any).TURNSTILE_SECRET;
    return new Response(JSON.stringify({
      ok: true,
      env: { hasSecret: !!secret, secretLen: secret ? String(secret).length : 0 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("ticket required", { status: 400 });
  const data = await ctx.env.INTAKE_KV.get(`contact:${ticket}`);
  if (!data) return new Response("not found", { status: 404 });
  return new Response(data, { status: 200, headers: { "content-type": "application/json" } });
};
