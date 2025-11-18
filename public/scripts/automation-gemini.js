// public/scripts/automation-gemini.js
// /automation 専用 INCIERGE CONCIERGE フロントロジック
// - モーダルの開閉
// - ユーザーメッセージ表示
// - 固定CTAメッセージ＋/contact 誘導（Geminiは使わない）

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
  // 固定の返信メッセージ（CTA）
  // --------------------------------------------------
  const FIXED_REPLY =
    "いま書いていただいた内容だけでも、十分にご相談としてお伺いできます。\n\n" +
    "このまま「無料相談フォーム」から送っていただければ、\n" +
    "こちらで状況を整理したうえで、どのプランが合いそうかご提案します。";

  const CONTACT_BASE_PATH = "/contact/";

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

  // ユーザーの入力内容をクエリに載せた contact URL を作る
  function buildContactUrlFromMessage(message) {
    const params = new URLSearchParams();
    params.set("from_automation", "1");
    if (message && message.length > 0) {
      params.set("q", message);
    }
    return `${CONTACT_BASE_PATH}?${params.toString()}`;
  }

  // 「無料相談フォームを開く」ボタン風リンクを追加
  function addContactLinkMessage(url) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-center mt-2 mb-2";

    const bubble = document.createElement("div");
    bubble.className =
      "inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-[11px] font-semibold text-white shadow cursor-pointer hover:bg-blue-700";

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className =
      "flex items-center gap-1 no-underline";
    link.textContent = "→ 無料相談フォームを開く";

    bubble.appendChild(link);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
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
  // フォーム送信ハンドラ
  //   → ユーザー入力を受け取り、
  //      固定のCTAメッセージ＋contactへの誘導だけを返す
  // --------------------------------------------------
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const userText = textarea.value.trim();
    if (!userText) return;

    // ユーザーのメッセージを表示
    addMessage("user", userText);

    // 入力欄リセット
    textarea.value = "";

    // 固定の返信メッセージを表示
    addMessage("bot", FIXED_REPLY);

    // contact URL（ユーザーの入力付き）を生成してボタン風リンクを描画
    const contactUrl = buildContactUrlFromMessage(userText);
    addContactLinkMessage(contactUrl);

    textarea.focus();
  });
});
