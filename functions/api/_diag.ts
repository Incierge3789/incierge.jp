// functions/api/_diag.ts
export const onRequestGet: PagesFunction = async (ctx) => {
  const env = (ctx as any).env || {};
  const keys = Object.keys(env).sort();
  const turnstile = (env as any).TURNSTILE_SECRET ?? null;
  return new Response(
    JSON.stringify({
      project: "incierge-jp",
      envKeys: keys,                    // どのキーが来ているか
      has_TURNSTILE_SECRET: turnstile !== null && turnstile !== undefined,
      TURNSTILE_SECRET_len: turnstile ? String(turnstile).length : 0,
      // ついでに KV/他バインディングも見える
      typeof_INTAKE_KV: typeof (env as any).INTAKE_KV,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};
