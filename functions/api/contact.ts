// functions/api/contact.ts
export const onRequestPost: PagesFunction<{ INTAKE_KV: KVNamespace }> = async (ctx) => {
  const { request, env } = ctx;

  // フォーム（application/x-www-form-urlencoded）/ JSON の両対応
  let name = "", email = "", message = "", company = "", website = "";
  const ctime = new Date().toISOString();
  const ipRaw = request.headers.get("cf-connecting-ip") || "";
  const ip = ipRaw.replace(/\.\d+$/, ".***"); // 簡易マスク
  const ua = request.headers.get("user-agent") || "";

  const ct = request.headers.get("content-type") || "";
  let turnstileToken = ""; // ← 追加

  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    name = String(form.get("name") || "");
    email = String(form.get("email") || "");
    message = String(form.get("message") || "");
    company = String(form.get("company") || "");
    website = String(form.get("website") || "");
    // Turnstile は自動で cf-turnstile-response に入ります
    turnstileToken = String(form.get("cf-turnstile-response") || "");
  } else if (ct.includes("application/json")) {
    const body = await request.json<any>();
    name = body?.name || "";
    email = body?.email || "";
    message = body?.message || "";
    company = body?.company || "";
    website = body?.website || "";
    // JSON 経由のときの保険（必要ならクライアントで付与）
    turnstileToken = body?.turnstile || body?.["cf-turnstile-response"] || "";
  }

  // ★ Turnstile verify ここから（このブロックを追加）
  if (!turnstileToken) {
    return new Response("Turnstile token missing", { status: 400 });
  }
  const vres = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET as string,    // Pages の環境変数に設定
      response: turnstileToken,
      remoteip: request.headers.get("CF-Connecting-IP") || "",
    }),
  });
  const vjson = await vres.json<any>();
  if (!vjson?.success) {
    return new Response("Verification failed", { status: 403 });
  }
  // ★ Turnstile verify ここまで

  // 最低限のバリデーション
  if (!name || !email || !message) {
    return new Response("Bad Request", { status: 400 });
  }

  const ticket = crypto.randomUUID();
  const key = `contact:${ticket}`;

  await env.INTAKE_KV.put(
    key,
    JSON.stringify({
      ticket,
      name,
      email,
      company,
      website,
      message,
      ua,
      ip,
      created_at: ctime,
      referer: request.headers.get("referer") || "",
    }),
    { expirationTtl: 60 * 60 * 24 * 14 }
  );

  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// 確認用（任意）：?ticket=... で保存内容をJSONで取得
export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("ticket required", { status: 400 });

  const data = await ctx.env.INTAKE_KV.get(`contact:${ticket}`);
  if (!data) return new Response("not found", { status: 404 });

  return new Response(data, { status: 200, headers: { "content-type": "application/json" } });
};
