// functions/api/_verify.ts
export const onRequestGet: PagesFunction<{ TURNSTILE_SECRET: string }> = async (ctx) => {
  const secret = (ctx.env.TURNSTILE_SECRET || "").trim();
  const testRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,               // ← Pages の実値
      response: "abc",      // わざと無効トークン
    }),
  });
  const j = await testRes.json<any>();
  // 期待値: {"success":false,"error-codes":["invalid-input-response"]} になれば「secret は正しい」
  return new Response(JSON.stringify({
    secret_len: secret.length,
    verify_json: j,
  }), { status: 200, headers: { "content-type": "application/json" }});
};
