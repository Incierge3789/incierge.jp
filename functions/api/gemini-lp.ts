// functions/api/gemini-lp.ts

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const json = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  try {
    // 1) メソッドチェック
    if (request.method !== "POST") {
      return json(405, { error: "METHOD_NOT_ALLOWED" });
    }

    // 2) APIキー確認
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return json(500, { error: "MISSING_GEMINI_API_KEY" });
    }

    // 3) リクエストボディ
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return json(400, { error: "INVALID_JSON", detail: String(e) });
    }

    const userMessage = (body?.message ?? "").toString().trim();
    if (!userMessage) {
      return json(400, { error: "EMPTY_MESSAGE" });
    }

    // 4) プロンプト読み込み（ASSETS経由）
    const baseUrl = new URL(request.url);

    const commonReq = new Request(
      new URL("/prompts/common/system_incierge_concierge_en.txt", baseUrl),
    );
    const lpReq = new Request(
      new URL("/prompts/automation/lp_mode_automation_en.txt", baseUrl),
    );

    let commonPrompt: string;
    let lpPrompt: string;
    try {
      // @ts-ignore ASSETS は Pages Functions 固有
      const [commonRes, lpRes] = await Promise.all([
        env.ASSETS.fetch(commonReq),
        env.ASSETS.fetch(lpReq),
      ]);

      if (!commonRes.ok || !lpRes.ok) {
        return json(500, {
          error: "PROMPT_LOAD_FAILED",
          detail: {
            commonStatus: commonRes.status,
            lpStatus: lpRes.status,
          },
        });
      }

      [commonPrompt, lpPrompt] = await Promise.all([
        commonRes.text(),
        lpRes.text(),
      ]);
    } catch (e) {
      return json(500, { error: "PROMPT_FETCH_EXCEPTION", detail: String(e) });
    }

    // 5) /automation 専用の systemInstruction に絞る
    //   → まずは lpPrompt のみを使う（共通は後で整理する）
    const systemInstruction = lpPrompt.trim();

    const payload = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.5,
        topP: 0.9,
      },
    };

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    // ログ（system と user を分けて確認）
    console.log("GEMINI_LP_REQUEST", {
      userLen: userMessage.length,
      userHead: userMessage.slice(0, 80),
      sysLen: systemInstruction.length,
      sysHead: systemInstruction.slice(0, 120),
    });

    // 6) Gemini 呼び出し
    let geminiRes: Response;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("GEMINI_LP_FETCH_EXCEPTION", String(e));
      return json(502, { error: "GEMINI_FETCH_ERROR", detail: String(e) });
    }

    console.log("GEMINI_LP_RESPONSE_STATUS", geminiRes.status);

    if (!geminiRes.ok) {
      const text = (await geminiRes.text().catch(() => "")) || "";
      console.error("GEMINI_LP_API_ERROR_BODY", text.slice(0, 500));
      return json(502, {
        error: "GEMINI_API_ERROR",
        status: geminiRes.status,
        body: text.slice(0, 2000),
      });
    }

    let data: any;
    try {
      data = await geminiRes.json();
    } catch (e) {
      console.error("GEMINI_LP_JSON_PARSE_ERROR", String(e));
      return json(500, { error: "GEMINI_JSON_PARSE_ERROR", detail: String(e) });
    }

    // 7) parts をすべて join してテキスト抽出（構造ゆらぎ対策）
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const parts = candidate?.content?.parts ?? [];

    let text = "";
    if (Array.isArray(parts)) {
      text = parts
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("\n\n")
        .trim();
    }

    if (!text) {
      console.error("GEMINI_LP_EMPTY_TEXT", {
        finishReason,
        rawCandidate: JSON.stringify(candidate).slice(0, 500),
      });
    }

    const replyText =
      text ||
      "すみません、少し混み合っているようです。もう一度だけ試してもらえますか？";

    console.log("GEMINI_LP_REPLY_OK", {
      replyLen: replyText.length,
      replyHead: replyText.slice(0, 80),
      finishReason,
    });

    return json(200, { reply: replyText });
  } catch (e) {
    console.error("GEMINI_LP_UNHANDLED", String(e));
    return json(500, { error: "UNHANDLED_EXCEPTION", detail: String(e) });
  }
};
