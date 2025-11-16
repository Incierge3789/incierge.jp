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

    // 4) /public 配下のプロンプトを ASSETS 経由で読む
    const baseUrl = new URL(request.url);
    const lpReq = new Request(
      new URL("/prompts/automation/lp_mode_automation_jp.txt", baseUrl),
    );

    let lpPrompt: string;
    try {
      // @ts-ignore ASSETS は Pages Functions 固有
      const lpRes = await env.ASSETS.fetch(lpReq);

      if (!lpRes.ok) {
        return json(500, {
          error: "PROMPT_LOAD_FAILED",
          detail: { lpStatus: lpRes.status },
        });
      }

      lpPrompt = await lpRes.text();
    } catch (e) {
      return json(500, { error: "PROMPT_FETCH_EXCEPTION", detail: String(e) });
    }

    // 5) systemInstruction として日本語プロンプトを丸ごと渡す
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
        maxOutputTokens: 400,
        temperature: 0.4,
        topP: 0.9,
      },
      // ★ thinking を切るためのトップレベル設定（公式ドキュメント系の構造に合わせる）
      thinkingConfig: {
        thinkingBudget: 0,
      },
    };

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    // ログ（system と user を分ける）
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

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const parts = candidate?.content?.parts ?? [];

    let text = "";
    if (Array.isArray(parts) && parts.length > 0) {
      text = parts
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("\n\n")
        .trim();
    }

    // ★ 空レス時は data 全体をある程度出す
    if (!text) {
      console.error("GEMINI_LP_EMPTY_TEXT", {
        finishReason,
        full: JSON.stringify(data).slice(0, 1200),
      });
    }

    const replyText =
      text ||
      "すみません、うまく回答を生成できませんでした。\n\n「いま一番つらい作業」を、日本語で一文だけ教えてもらえますか？\n（例：『毎朝のメール確認』『Slackの未読チェック』『日程調整』など）";

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
