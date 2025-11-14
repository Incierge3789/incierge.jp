// public/scripts/automation-gemini.js

// public/scripts/automation-gemini.js

document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("gemini-fab");
  const bubble = document.getElementById("gemini-fab-bubble");
  const modal = document.getElementById("gemini-modal");
  const modalCloseButtons = document.querySelectorAll("[data-gemini-modal-close]");
  const chatForm = document.getElementById("gemini-chat-form");
  const chatInput = document.getElementById("gemini-chat-input");
  const chatLog = document.getElementById("gemini-chat-log");

  // ===== 吹き出し制御 =====
  if (fab && bubble) {
    let hideTimeout;

    const hideBubble = () => {
      bubble.classList.add("opacity-0", "pointer-events-none");
    };

    const showBubble = () => {
      bubble.classList.remove("opacity-0", "pointer-events-none");
    };

    // 初期表示（数秒だけ見せて自動で消す）
    showBubble();
    hideTimeout = window.setTimeout(hideBubble, 8000);

    const closeBtn = bubble.querySelector("[data-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        hideBubble();
        if (hideTimeout) window.clearTimeout(hideTimeout);
      });
    }

    // FAB → 吹き出し再表示
    fab.addEventListener("click", () => {
      showBubble();
      if (hideTimeout) window.clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(hideBubble, 8000);
    });
  }

  // ===== モーダル開閉 =====
  const openModal = () => {
    if (!modal) return;
    modal.classList.remove("opacity-0", "pointer-events-none");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("opacity-0", "pointer-events-none");
  };

  if (fab) {
    fab.addEventListener("click", () => {
      openModal();
    });
  }

  modalCloseButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal();
    });
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Escキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // ===== チャット送信処理 =====

  const appendMessage = (role, text) => {
    if (!chatLog) return;
    const wrapper = document.createElement("div");
    wrapper.className = "flex items-start gap-2";

    if (role === "user") {
      wrapper.classList.add("justify-end");
      wrapper.innerHTML = `
        <div class="rounded-2xl bg-blue-600 px-3 py-2 text-[13px] leading-relaxed text-white shadow-sm shadow-blue-500/40 max-w-[80%]">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
          AI
        </div>
        <div class="rounded-2xl bg-white px-3 py-2 shadow-sm shadow-slate-200/70 border border-slate-200 max-w-[80%] text-[13px] leading-relaxed text-slate-900">
          ${escapeHtml(text).replace(/\n/g, "<br />")}
        </div>
      `;
    }

    chatLog.appendChild(wrapper);

    // スクロール最下部へ
    const container = chatLog.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const setSendingState = (sending) => {
    if (!chatForm) return;
    const submitBtn = chatForm.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = sending;
      submitBtn.textContent = sending ? "送信中…" : "送信";
    }
  };

  const escapeHtml = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      appendMessage("user", message);
      chatInput.value = "";
      setSendingState(true);

      try {
        const res = await fetch("/api/gemini-lp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) {
          appendMessage(
            "assistant",
            "すみません、サーバー側でエラーが発生しました。少し時間をおいてもう一度お試しください。"
          );
        } else {
          const data = await res.json();
          const reply =
            (data && data.reply) ||
            "すみません、うまく応答を生成できませんでした。もう一度だけ試してもらえますか？";
          appendMessage("assistant", reply);
        }
      } catch (err) {
        console.error(err);
        appendMessage(
          "assistant",
          "通信に失敗しました。ネットワーク環境をご確認のうえ、再度お試しください。"
        );
      } finally {
        setSendingState(false);
      }
    });
  }
});
