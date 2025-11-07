// functions/api/contact.ts
export const onRequestPost: PagesFunction<{
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  SITE_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE: string;
}> = async (ctx) => {
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

  // Turnstile verify
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

  const ticket = crypto.randomUUID();

  // referer / utm
  const referer = request.headers.get("referer") || "";
  const refURL  = (() => { try { return new URL(referer); } catch { return null; } })();
  const utm = {
    utm_source:  refURL?.searchParams.get("utm_source")  || "",
    utm_medium:  refURL?.searchParams.get("utm_medium")  || "",
    utm_campaign:refURL?.searchParams.get("utm_campaign")|| "",
    utm_term:    refURL?.searchParams.get("utm_term")    || "",
    utm_content: refURL?.searchParams.get("utm_content") || "",
  };

  const payload = {
    ticket, name, email, company, website, message,
    ua: request.headers.get("user-agent") || "",
    ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
    created_at: new Date().toISOString(),
    referer,
    ...utm,
  };

  // KV save
  try {
    await ctx.env.INTAKE_KV.put(`contact:${ticket}`, JSON.stringify(payload), { expirationTtl: 60*60*24*14 });
    await ctx.env.INTAKE_KV.put(`contact_time:${Date.now()}:${ticket}`, "1", { expirationTtl: 60*60*24*14 });
  } catch (e) {
    console.log("KV put error:", e);
  }

  // Supabase insert（本文ログ付き）
  try {
    const SUPA_URL = (env.SUPABASE_URL || "").trim();
    const SUPA_KEY = (env.SUPABASE_SERVICE_ROLE || "").trim();
    if (SUPA_URL && SUPA_KEY) {
      const ins = await fetch(`${SUPA_URL}/rest/v1/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPA_KEY,
          "Authorization": `Bearer ${SUPA_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          ticket, name, email, company, website, message,
          user_agent: payload.ua,
          ip_masked: payload.ip,
          referer,
          ...utm
        }),
      });
      if (!ins.ok) {
        const body = await ins.text();
        console.log("SUPABASE insert NG:", ins.status, body);
      } else {
        console.log("SUPABASE insert OK");
      }
    } else {
      console.log("SUPABASE env missing");
    }
  } catch (e) {
    console.log("SUPABASE error:", e);
  }

  // Resend (admin & ack)
  const RESEND = (env.RESEND_API_KEY || "").trim();
  const FROM   = (env.MAIL_FROM || "").trim();
  const TO     = (env.MAIL_TO || "").trim();
  const SITE   = (env.SITE_NAME || "INCIERGE").trim();

  const adminResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [TO], subject: `【${SITE}】新しいお問い合わせ: ${name}`, reply_to: email,
      text: [
        `チケット: ${ticket}`, `Name: ${name}`, `Email: ${email}`, `Company: ${company}`, `Website: ${website}`, `----`, message,
        "", `Referer: ${referer}`,
        `utm_source=${utm.utm_source} utm_medium=${utm.utm_medium} utm_campaign=${utm.utm_campaign} utm_term=${utm.utm_term} utm_content=${utm.utm_content}`,
      ].join("\n"),
    }),
  });
  console.log("Resend admin result:", await adminResp.json());

  const ackResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [email], subject: `【${SITE}】お問い合わせを受け付けました`,
      text: [
        `${name} 様`, "", `${SITE} へのお問い合わせありがとうございます。以下の内容で受け付けました。担当より折り返しご連絡いたします。`,
        "", `--- ご入力内容 ---`,
        `お名前: ${name}`, `メール: ${email}`, `会社名: ${company}`, `HP: ${website}`, `----`, message,
        "", `このメールにご返信いただければ、そのままやり取り可能です。`,
      ].join("\n"),
    }),
  });
  console.log("Resend ack result:", await ackResp.json());

  // Plausible event
  try {
    await fetch("https://incierge.jp/api/plausible", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Referer": referer || "https://incierge.jp/contact/" },
      body: JSON.stringify({
        name: "form_submitted",
        url: referer || `https://incierge.jp/contact/thanks/?ticket=${encodeURIComponent(ticket)}`,
        domain: "incierge.jp",
        props: { ticket, ...utm },
      }),
    });
  } catch (e) {
    console.log("plausible post skipped:", String(e));
  }

  return new Response(null, { status: 303, headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` } });
};

export const onRequestGet: PagesFunction<{
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  SITE_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE: string;
}> = async (ctx) => {
  const url = new URL(ctx.request.url);

  // 既存 diag=1 に加え、diag=2 で Supabase の可用性も返す
  if (url.searchParams.get("diag") === "2") {
    const hasKV = !!ctx.env.INTAKE_KV;
    const hasTurnstile = !!ctx.env.TURNSTILE_SECRET;
    const hasResend = !!ctx.env.RESEND_API_KEY;
    const hasSupabaseUrl = !!ctx.env.SUPABASE_URL;
    const hasSupabaseKey = !!ctx.env.SUPABASE_SERVICE_ROLE;

    let restReady = false;
    if (hasSupabaseUrl) {
      try {
        const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/ready`);
        restReady = r.ok;
      } catch {}
    }
    return new Response(JSON.stringify({ ok:true, hasKV, hasTurnstile, hasResend, hasSupabaseUrl, hasSupabaseKey, restReady }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }

  if (url.searchParams.get("diag") === "1") {
    const hasKV = !!ctx.env.INTAKE_KV;
    const hasTurnstile = !!ctx.env.TURNSTILE_SECRET;
    const hasResend = !!ctx.env.RESEND_API_KEY;
    return new Response(JSON.stringify({ ok:true, hasKV, hasTurnstile, hasResend }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }

  const t = url.searchParams.get("ticket");
  if (!t) return new Response("ticket required", { status: 400 });

  const v = await ctx.env.INTAKE_KV.get(`contact:${t}`);
  if (!v) return new Response(JSON.stringify({ ok:false, found:false }), {
    status: 404, headers: { "content-type": "application/json" }
  });

  return new Response(v, { status: 200, headers: { "content-type": "application/json" } });
};
