// functions/api/gemini-lp.ts

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Missing GEMINI_API_KEY", { status: 500 });
  }

  let body: { message?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userMessage = (body.message || "").trim();
  if (!userMessage) {
    return new Response("Empty message", { status: 400 });
  }

  // プロンプトファイルを静的アセットとして読み込む
  const baseUrl = new URL(request.url);

  const commonReq = new Request(
    new URL("/prompts/common/system_incierge_concierge_en.txt", baseUrl),
  );
  const lpReq = new Request(
    new URL("/prompts/automation/lp_mode_automation_en.txt", baseUrl),
  );

  const [commonRes, lpRes] = await Promise.all([
    // Pages Functions では ASSETS から静的ファイルを読める
    // @ts-ignore
    env.ASSETS.fetch(commonReq),
    // @ts-ignore
    env.ASSETS.fetch(lpReq),
  ]);

  if (!commonRes.ok || !lpRes.ok) {
    return new Response("Failed to load prompt files", { status: 500 });
  }

  const [commonPrompt, lpPrompt] = await Promise.all([
    commonRes.text(),
    lpRes.text(),
  ]);

  // Gemini への最終プロンプト（英語指示＋日本語回答）
  const systemPrompt = `${commonPrompt.trim()}

---

${lpPrompt.trim()}

---

User input (in Japanese):
"${userMessage}"
`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    ],
  };

  const geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "");
    return new Response(
      `Gemini API error: ${geminiRes.status} ${text}`,
      { status: 502 },
    );
  }

  const data = await geminiRes.json<any>();

  const replyText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "すみません、少し混み合っているようです。もう一度だけ試してもらえますか？";

  return new Response(JSON.stringify({ reply: replyText }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
