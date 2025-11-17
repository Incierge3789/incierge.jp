// functions/api/gemini-lp.ts


const FALLBACK_MESSAGE = `すみません、うまく回答を生成できませんでした。

「いま一番つらい作業」を、日本語で一文だけ教えてもらえますか？
（例：『毎朝のメール確認』『Slackの未読チェック』『日程調整』など）`;



const BUSY_MESSAGE = `現在AI側が混み合っています。
もう一度お試しください。`;

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
        // プランCとして、少し余裕を持たせる
        maxOutputTokens: 1000,
        temperature: 0.4,
        topP: 0.9,
      },
      // ★ thinkingConfig はこの API では未対応なので送らない
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


    // 6) Gemini 呼び出し（本文が空ならサーバー側で1回だけリトライ）
    async function callGeminiOnce() {
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
        throw new Error(`GEMINI_FETCH_ERROR:${String(e)}`);
      }

      console.log("GEMINI_LP_RESPONSE_STATUS", geminiRes.status);

      if (!geminiRes.ok) {
        const textBody = (await geminiRes.text().catch(() => "")) || "";

        // ★ 503（モデルが混み合っている）だけは専用メッセージを返す
        if (geminiRes.status === 503) {
          console.warn("GEMINI_LP_BUSY", {
            status: geminiRes.status,
            bodyHead: textBody.slice(0, 200),
          });

          // ここでは throw せず、「普通の応答テキスト」として返す
          return {
            text: BUSY_MESSAGE,
            finishReason: "BUSY" as const,
          };
        }

        // 503 以外は従来通りエラーとして扱う
        console.error("GEMINI_LP_API_ERROR_BODY", textBody.slice(0, 500));
        throw new Error(
          `GEMINI_API_ERROR:${geminiRes.status}:${textBody.slice(0, 2000)}`
        );
      }

      let data: any;
      try {
        data = await geminiRes.json();
      } catch (e) {
        console.error("GEMINI_LP_JSON_PARSE_ERROR", String(e));
        throw new Error(`GEMINI_JSON_PARSE_ERROR:${String(e)}`);
      }

      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason ?? null;
      const parts = candidate?.content?.parts ?? [];

      let text = "";
      if (Array.isArray(parts) && parts.length > 0) {
        text = parts
          .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
          .join("\n\n")
          .trim();
      }

      return { text, finishReason };
    }

    // 6-b) まず1回だけ試す
    let { text, finishReason } = await callGeminiOnce();
    let triedRetry = false;

    // 6-c) もし本文が空なら、内部で1回だけリトライ（ユーザーには見せない）
    if (!text) {
      console.warn("GEMINI_LP_EMPTY_TEXT_FIRST_TRY", { finishReason });
      triedRetry = true;
      const second = await callGeminiOnce();
      text = second.text;
      finishReason = second.finishReason;
    }

    const isFallback = !text;
    const replyText = text || FALLBACK_MESSAGE;

    console.log("GEMINI_LP_REPLY_OK", {
      replyLen: replyText.length,
      replyHead: replyText.slice(0, 80),
      finishReason,
      isFallback,
      triedRetry,
    });

    return json(200, {
      reply: replyText,
      meta: {
        isFallback,
        finishReason,
        triedRetry,
      },
    });
  } catch (e) {
    console.error("GEMINI_LP_UNHANDLED", String(e));
    return json(500, { error: "UNHANDLED_EXCEPTION", detail: String(e) });
  }
};
