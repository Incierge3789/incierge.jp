// public/scripts/automation-gemini.js
// /automation 専用 INCIERGE CONCIERGE フロントロジック
// - モーダルの開閉
// - ユーザーメッセージ表示
// - テンプレボタンからの入力
// - 固定CTAメッセージ＋/contact 誘導
// - 送信中フィードバック＆二重送信ガード

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gemini-modal");
  const openBtn = document.getElementById("gemini-fab");
  const closeBtn = document.querySelector("[data-gemini-modal-close]");

  const form = document.getElementById("gemini-chat-form");
  const textarea = document.getElementById("gemini-chat-input");
  const messages = document.getElementById("gemini-chat-log");

  const fabBubble = document.getElementById("gemini-fab-bubble");
  const fabBubbleClose = fabBubble
    ? fabBubble.querySelector("[data-close]")
    : null;

  // 送信ボタン
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  let isSending = false;
  const SUBMIT_LABEL_DEFAULT = submitBtn ? submitBtn.textContent : "送信";
  const SUBMIT_LABEL_SENDING = "送信中…";

  // 3つのテンプレボタン（data-gemini-template）
  const templateButtons = document.querySelectorAll("[data-gemini-template]");

  if (!form || !textarea || !messages) {
    console.warn("INCIERGE GEMINI: 必要な要素が見つかりませんでした。");
    return;
  }

  const FIXED_REPLY =
    "いま書いていただいた内容だけでも、十分にご相談としてお伺いできます。\n\n" +
    "このまま「無料相談フォーム」から送っていただければ、\n" +
    "こちらで状況を整理したうえで、どのプランが合いそうかご提案します。";

  const CONTACT_PATH = "/contact/";

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className =
      role === "user" ? "flex justify-end mb-3" : "flex justify-start mb-3";

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
      "max-w-[90%] rounded-xl px-2 py-1 text:[11px] leading-relaxed bg-slate-100 text-slate-600";
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  // /contact へのリンク（q に相談内容を渡す）
  function addContactLink(prefillText) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex justify-center mb-2";

    const bubble = document.createElement("div");
    bubble.className =
      "max-w-[90%] rounded-xl px-3 py-2 text-[11px] leading-relaxed bg-slate-100 text-slate-700";

    const span = document.createElement("span");
    span.textContent = "→ 無料相談フォームはこちらから開けます：";

    const url = new URL(CONTACT_PATH, window.location.origin);
    url.searchParams.set("from_automation", "1");
    if (prefillText) {
      url.searchParams.set("q", prefillText);
    }

    const link = document.createElement("a");
    link.href = url.toString();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "text-blue-600 underline underline-offset-2";
    link.textContent = "フォームを開く";

    bubble.appendChild(span);
    bubble.appendChild(link);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  function setSendingState(on) {
    if (!submitBtn) return;
    isSending = on;

    if (on) {
      submitBtn.disabled = true;
      submitBtn.textContent = SUBMIT_LABEL_SENDING;
      submitBtn.classList.add("opacity-60", "cursor-not-allowed");
      textarea.setAttribute("readonly", "true");
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = SUBMIT_LABEL_DEFAULT;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      textarea.removeAttribute("readonly");
    }
  }

  // モーダル開く
  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.classList.remove("opacity-0", "pointer-events-none");
      modal.setAttribute("aria-hidden", "false");
      textarea.focus();

      if (fabBubble) {
        fabBubble.classList.add("opacity-0", "pointer-events-none");
      }
    });
  }

  // モーダル閉じる（×）
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("opacity-0", "pointer-events-none");
      modal.setAttribute("aria-hidden", "true");
    });
  }

  // 初期吹き出し ×
  if (fabBubble && fabBubbleClose) {
    fabBubbleClose.addEventListener("click", () => {
      fabBubble.classList.add("opacity-0", "pointer-events-none");
    });
  }

  // モーダル外クリックで閉じる
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("opacity-0", "pointer-events-none");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  // テンプレボタン → テキストエリアに反映
  if (templateButtons.length) {
    templateButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const text =
          btn.getAttribute("data-gemini-template") ||
          btn.textContent.trim();
        if (!text) return;
        textarea.value = text;
        textarea.focus();
      });
    });
  }

  // フォーム送信 → 固定メッセージ＋contactリンク
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSending) return; // 連打ガード

    const userText = textarea.value.trim();
    if (!userText) return;

    setSendingState(true);

    addMessage("user", userText);
    textarea.value = "";

    // 今回は同期処理なので、軽くディレイを入れて「送信した感」を出す
    setTimeout(() => {
      addMessage("bot", FIXED_REPLY);
      addContactLink(userText);

      addSystemMessage(
        "※ フォーム側では「ご相談内容」に、いま入力した内容がそのまま入ります。"
      );

      setSendingState(false);
      textarea.focus();
    }, 400);
  });
});
