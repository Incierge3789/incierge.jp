// public/scripts/automation-gemini.js
// /automation 専用 INCIERGE CONCIERGE フロントロジック
// - モーダルの開閉
// - ユーザーメッセージ表示
// - Gemini呼び出し（自動リトライ＋エラーハンドリング）

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gemini-modal");

  // 💬 浮遊ボタンでモーダルを開く（HTML側の id に合わせる）
  const openBtn = document.getElementById("gemini-fab");

  // モーダルの × ボタン（data 属性で取得）
  const closeBtn = document.querySelector("[data-gemini-modal-close]");

  const form = document.getElementById("gemini-chat-form");
  const textarea = document.getElementById("gemini-chat-input");

  // メッセージログ領域（HTML側の id に合わせる）
  const messages = document.getElementById("gemini-chat-log");

  // 初期吹き出し（任意）
  const fabBubble = document.getElementById("gemini-fab-bubble");
  const fabBubbleClose = fabBubble
    ? fabBubble.querySelector("[data-close]")
    : null;

  if (!form || !textarea || !messages) {
    console.warn("INCIERGE GEMINI: 必要な要素が見つかりませんでした。");
    return;
  }

  // --------------------------------------------------
  // UI ヘルパー
  // --------------------------------------------------
  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className =
      role === "user"
        ? "flex justify-end mb-3"
        : "flex justify-start mb-3";

    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed bg-blue-600 text-white shadow-md"
        : "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed bg-white text-slate-900 shadow border border-slate-200";

    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function addSystemMessage(text) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-center mb-2";
    const bubble = document.createElement("div");
    bubble.className =
      "max-w-[90%] rounded-xl px-2 py-1 text-[11px] leading-relaxed bg-slate-100 text-slate-600";
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function setThinking(isThinking) {
    if (isThinking) {
      textarea.setAttribute("disabled", "true");
    } else {
      textarea.removeAttribute("disabled");
    }
  }

  // --------------------------------------------------
  // Gemini 呼び出し（自動リトライ付き）
  // --------------------------------------------------
  async function callGeminiWithRetry(message, options = {}) {
    const {
      maxRetries = 2, // 合計 1 + 2 回 = 最大 3 回トライ
      timeoutMs = 15000,
      onRetry = null,
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch("/api/gemini-lp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();
        return data; // 正常終了
      } catch (err) {
        lastError = err;

        const isAbort = err.name === "AbortError";
        const isNetwork =
          err instanceof TypeError &&
          String(err.message || "").includes("Failed to fetch");

        const retriable = isAbort || isNetwork;

        if (attempt < maxRetries && retriable) {
          if (typeof onRetry === "function") {
            onRetry({ attempt, maxRetries, error: err });
          }
          // 200ms → 400ms → … で少しだけ待つ
          await new Promise((r) => setTimeout(r, 200 + attempt * 200));
          continue;
        }

        // リトライ不可 or 回数上限
        throw err;
      }
    }

    throw lastError || new Error("Unknown error in callGeminiWithRetry");
  }

  // --------------------------------------------------
  // モーダル開閉
  // --------------------------------------------------
  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.classList.remove("opacity-0", "pointer-events-none");
      modal.setAttribute("aria-hidden", "false");
      textarea.focus();

      // 最初に開いたタイミングで初期吹き出しを消す（任意）
      if (fabBubble) {
        fabBubble.classList.add("opacity-0");
        fabBubble.classList.add("pointer-events-none");
      }
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("opacity-0", "pointer-events-none");
      modal.setAttribute("aria-hidden", "true");
    });
  }

  // 初期吹き出しの × ボタン
  if (fabBubble && fabBubbleClose) {
    fabBubbleClose.addEventListener("click", () => {
      fabBubble.classList.add("opacity-0");
      fabBubble.classList.add("pointer-events-none");
    });
  }

  // モーダル外クリックで閉じる（任意）
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("opacity-0", "pointer-events-none");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  // --------------------------------------------------
  // フォーム送信ハンドラ（ここが今回の本丸）
  // --------------------------------------------------
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userText = textarea.value.trim();
    if (!userText) return;

    // ユーザーのメッセージを表示
    addMessage("user", userText);

    // 入力欄リセット
    textarea.value = "";
    setThinking(true);

    try {
      const data = await callGeminiWithRetry(userText, {
        maxRetries: 2,
        timeoutMs: 15000,
        onRetry({ attempt }) {
          if (attempt === 0) {
            addSystemMessage("通信が少し不安定なようです。再接続を試しています…");
          }
        },
      });

      const reply =
        (data && typeof data.reply === "string" && data.reply.trim()) ||
        "すみません、うまく回答を生成できませんでした。\n\n「いま一番つらい作業」を、日本語で一文だけ教えてもらえますか？\n（例：『毎朝のメール確認』『Slackの未読チェック』『日程調整』など）";

      addMessage("bot", reply);
    } catch (err) {
      console.error("GEMINI_LP_FRONT_ERROR", err);
      addMessage(
        "bot",
        "通信が少し不安定なようです。\nしばらく時間をおいてから、もう一度お試しください。"
      );
    } finally {
      setThinking(false);
      textarea.focus();
    }
  });
});
