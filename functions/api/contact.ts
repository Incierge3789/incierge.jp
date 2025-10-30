// functions/api/contact.ts
export const onRequestPost: PagesFunction<{
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  SITE_NAME: string;
}> = async (ctx) => {
  const { request, env } = ctx;

  // ---- 受け取り（フォームのみ）----
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
  const token   = String(form.get("cf-turnstile-response") || ""); // Turnstile

  if (!name || !email || !message) return new Response("Bad Request", { status: 400 });
  if (!token) return new Response("Turnstile token missing", { status: 400 });

  // ---- Turnstile verify ----
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get("cf-connecting-ip") || ""
    }),
  });
  const verifyJson: any = await verifyRes.json();
  if (!verifyJson?.success) {
    return new Response(JSON.stringify({ ok:false, error:"turnstile", verifyJson }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  // ---- 保存 ----
  const ticket = crypto.randomUUID();
  const key = `contact:${ticket}`;
  const payload = {
    ticket, name, email, company, website, message,
    ua: request.headers.get("user-agent") || "",
    ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
    created_at: new Date().toISOString(),
    referer: request.headers.get("referer") || "",
  };
  await env.INTAKE_KV.put(key, JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 * 14 });

  // ---- メール送信（Resend）: 失敗しても問い合わせ自体は完了扱い ----
  const sendEmail = async (to: string, subject: string, text: string) => {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,  // 例: "INCIERGE <info@incierge.jp>"
        to,                    // 単一 or 配列OK
        subject,
        text,
        reply_to: env.MAIL_TO, // 返信はあなた宛てに集約
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.log("Resend error", r.status, body);
    }
  };

  // 管理者通知
  const site = env.SITE_NAME || "INCIERGE";
  const viewUrl = `https://incierge.jp/api/contact?ticket=${encodeURIComponent(ticket)}`;
  await sendEmail(
    env.MAIL_TO,
    `[${site}] 新しいお問い合わせ #${ticket.slice(0,8)}`,
    [
      `お名前: ${name}`,
      `メール: ${email}`,
      company ? `会社名: ${company}` : "",
      website ? `HP: ${website}` : "",
      "",
      "―― ご相談内容 ――",
      message,
      "",
      `確認用: ${viewUrl}`,
    ].filter(Boolean).join("\n")
  );

  // 自動返信（ユーザー）
  await sendEmail(
    email,
    `【${site}】お問い合わせありがとうございました`,
    [
      `${name} 様`,
      "",
      `${site} へのお問い合わせを受け付けました。`,
      "通常24時間以内にご連絡いたします。",
      "",
      "―― お送りいただいた内容 ――",
      message,
      "",
      "本メールにご返信いただければ担当に届きます。",
    ].join("\n")
  );

  // ---- サンクスへ ----
  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// GET: 保存確認（?ticket=...）＋ 環境診断（?diag=1）
export const onRequestGet: PagesFunction<{
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  SITE_NAME: string;
}> = async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.searchParams.get("diag") === "1") {
    const env = ctx.env as any;
    return new Response(JSON.stringify({
      ok: true,
      env: {
        hasTurnstile: !!env.TURNSTILE_SECRET,
        hasResend: !!env.RESEND_API_KEY,
        hasMailFrom: !!env.MAIL_FROM,
        hasMailTo: !!env.MAIL_TO,
        siteName: env.SITE_NAME || "",
      }
    }), { status: 200, headers: { "content-type": "application/json" } });
  }

  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("ticket required", { status: 400 });
  const data = await ctx.env.INTAKE_KV.get(`contact:${ticket}`);
  if (!data) return new Response("not found", { status: 404 });
  return new Response(data, { status: 200, headers: { "content-type": "application/json" } });
};
