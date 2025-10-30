// functions/api/contact.ts
// Cloudflare Pages Functions (TypeScript)

export const onRequestPost: PagesFunction<{
  INTAKE_KV: KVNamespace;       // Pages → Settings → Functions → KV bindings で "INTAKE_KV" をバインド
  TURNSTILE_SECRET: string;     // Pages → Settings → Environment variables に Turnstile Secret を設定
}> = async (ctx) => {
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
  const token   = String(form.get("cf-turnstile-response") || ""); // Turnstile のレスポンス

  if (!name || !email || !message) return new Response("Bad Request", { status: 400 });
  if (!token) return new Response("Turnstile token missing", { status: 400 });

  // ---- Turnstile 検証 ----
  // まずは remoteip なしでシンプル検証（ホスト名やシークレット不一致の切り分けを優先）
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      // remoteip: request.headers.get("cf-connecting-ip") || "" // 必要なら有効化
    }),
  });
  const verifyJson: any = await verifyRes.json();

  if (!verifyJson?.success) {
    // デバッグしやすい 400 応答（本番で不要ならメッセージだけにしてOK）
    // 代表的なエラー:
    //  - "invalid-input-secret": TURNSTILE_SECRET が間違い/未設定/未反映
    //  - "invalid-input-response": フォームの token が空/不正
    //  - "hostname-mismatch": Turnstile のサイト設定で incierge.jp が未登録
    //  - "timeout-or-duplicate": トークン期限切れ/使い回し
    return new Response(
      JSON.stringify({ ok: false, error: "turnstile", verifyJson }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // ---- 保存 ----
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
      ua: request.headers.get("user-agent") || "",
      ip: (request.headers.get("cf-connecting-ip") || "").replace(/\.\d+$/, ".***"),
      created_at: new Date().toISOString(),
      referer: request.headers.get("referer") || "",
    }),
    { expirationTtl: 60 * 60 * 24 * 14 } // 14日保持
  );

  // ---- サンクスへ（フォームPOST→303で遷移）----
  return new Response(null, {
    status: 303,
    headers: { Location: `/contact/thanks/?ticket=${encodeURIComponent(ticket)}` },
  });
};

// 保存確認用（任意）：/api/contact?ticket=... で JSON を返す
export const onRequestGet: PagesFunction<{ INTAKE_KV: KVNamespace }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("ticket required", { status: 400 });

  const data = await ctx.env.INTAKE_KV.get(`contact:${ticket}`);
  if (!data) return new Response("not found", { status: 404 });

  return new Response(data, { status: 200, headers: { "content-type": "application/json" } });
};
