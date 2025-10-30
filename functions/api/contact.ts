// functions/api/contact.ts
export const onRequestPost: PagesFunction<{
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;   // 例: "INCIERGE <info@incierge.jp>"
  MAIL_TO: string;     // 例: "info@incierge.jp"
  SITE_NAME: string;   // 例: "INCIERGE"
}> = async (ctx) => {
  const { request, env } = ctx;

  // フォームのみ受け付け
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

  // Turnstile 検証
  const secret = (env.TURNSTILE_SECRET || "").trim();
  const vres = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: request.headers.get("cf-connecting-ip") || ""
    }),
  });
  const vjson: any = await vres.json();
  if (!vjson?.success) {
    console.log("Turnstile NG", vjson);
    return new Response(JSON.stringify({ ok:false, error:"turnstile", vjson }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  // 保存
  const ticket = crypto.randomUUID();
  await ctx.env.INTAKE_KV.put(
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

  // ===== Resend 送信（通知 & 自動返信）=====
  const RESEND = (env.RESEND_API_KEY || "").trim();
  const FROM   = (env.MAIL_FROM || "").trim();
  const TO     = (env.MAIL_TO || "").trim();
  const SITE   = (env.SITE_NAME || "INCIERGE").trim();

  // 1) 管理者通知
  const adminResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to:   [TO],
      subject: `【${SITE}】新しいお問い合わせ: ${name}`,
      reply_to: email,
      text: [
        `チケット: ${ticket}`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Website: ${website}`,
        `----`,
        message
      ].join("\n"),
    }),
  });
  const adminJson = await adminResp.json();
  console.log("Resend admin result:", adminJson);

  // 2) 送信者に自動返信（サンクス）
  const ackResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to:   [email],
      subject: `【${SITE}】お問い合わせを受け付けました`,
      text: [
        `${name} 様`,
        "",
        `${SITE} へのお問い合わせありがとうございます。以下の内容で受け付けました。担当より折り返しご連絡いたします。`,
        "",
        `--- ご入力内容 ---`,
        `お名前: ${name}`,
        `メール: ${email}`,
        `会社名: ${company}`,
        `HP: ${website}`,
        `----`,
        message,
        "",
        `このメールにご返信いただければ、そのままやり取り可能です。`,
      ].join("\n"),
    }),
  });
  const ackJson = await ackResp.json();
  console.log("Resend ack result:", ackJson);
  // ===== /Resend =====

  // サンクスへリダイレクト
  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// 簡易診断
export const onRequestGet: PagesFunction<{ TURNSTILE_SECRET: string; RESEND_API_KEY: string; MAIL_FROM: string; MAIL_TO: string; SITE_NAME: string; }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.searchParams.get("diag") === "1") {
    return new Response(JSON.stringify({
      ok: true,
      env: {
        hasTurnstile: !!ctx.env.TURNSTILE_SECRET,
        hasResend: !!ctx.env.RESEND_API_KEY,
        hasMailFrom: !!ctx.env.MAIL_FROM,
        hasMailTo: !!ctx.env.MAIL_TO,
        siteName: ctx.env.SITE_NAME || ""
      }
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response("ticket required", { status: 400 });
};
