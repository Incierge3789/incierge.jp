// functions/api/contact.ts

type Env = {
  INTAKE_KV: KVNamespace;
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  SITE_NAME: string;
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
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
  const created_at = new Date().toISOString();
  const body = {
    ticket, name, email, company, website, message,
    ua: request.headers.get("user-agent") || "",
    ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
    created_at,
    referer: request.headers.get("referer") || "",
  };

  await ctx.env.INTAKE_KV.put(`contact:${ticket}`, JSON.stringify(body), {
    expirationTtl: 60 * 60 * 24 * 14,
  });

await ctx.env.INTAKE_KV.put("contact_time:" + new Date().toISOString() + ":" + ticket, "1", {expirationTtl: 60*60*24*14});
  const ts = created_at.replace(/[-:]/g,"").replace(/\.\d+Z/,"Z"); // 20251102T123456Z
  await ctx.env.INTAKE_KV.put(`contact_by_time:${ts}:${ticket}`, "1", {
    expirationTtl: 60 * 60 * 24 * 14,
  });

  const RESEND = (env.RESEND_API_KEY || "").trim();
  const FROM   = (env.MAIL_FROM || "").trim();
  const TO     = (env.MAIL_TO || "").trim();
  const SITE   = (env.SITE_NAME || "INCIERGE").trim();

  const adminResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [TO],
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
  console.log("Resend admin result:", await adminResp.json());

  const ackResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [email],
      subject: `【${SITE}】お問い合わせを受け付けました`,
      text: [
        `${name} 様`, "", `${SITE} へのお問い合わせありがとうございます。以下の内容で受け付けました。担当より折り返しご連絡いたします。`,
        "", `--- ご入力内容 ---`,
        `お名前: ${name}`, `メール: ${email}`, `会社名: ${company}`, `HP: ${website}`,
        `----`, message, "", `このメールにご返信いただければ、そのままやり取り可能です。`,
      ].join("\n"),
    }),
  });
  console.log("Resend ack result:", await ackResp.json());

  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// GET: thanksページ用の確認API / 環境診断
export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace; }>=async(c)=>{const u=new URL(c.request.url);const t=u.searchParams.get("ticket");if(!t)return new Response("ticket required",{status:400});const k=`contact:`;const v=await c.env.INTAKE_KV.get(k);if(!v)return new Response(JSON.stringify({ok:false,found:false}),{status:404,headers:{"content-type":"application/json"}});return new Response(v,{status:200,headers:{"content-type":"application/json"}});};
