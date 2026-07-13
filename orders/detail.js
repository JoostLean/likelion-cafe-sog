/* orders/detail.js — 고객 주문 상세 (진행 상태 + 취소) */
(function () {
  "use strict";

  const {
    Store,
    formatPrice,
    formatDate,
    statusBadge,
    escapeHtml,
    getParam,
    toast,
    ORDER_STATUS,
  } = window.CafeUtils;
  window.CustomerLayout.render({ active: "orders" });

  const root = document.getElementById("detailRoot");
  const id = getParam("id");

  /* 상태 배너 문구 & 이모지 */
  const STATUS_META = {
    pending: { emoji: "📝", msg: "주문이 접수되어 확인을 기다리고 있어요." },
    progress: { emoji: "☕", msg: "정성껏 준비하고 있어요. 조금만 기다려주세요!" },
    done: { emoji: "✅", msg: "준비가 완료되었어요. 맛있게 드세요!" },
    canceled: { emoji: "🚫", msg: "취소된 주문입니다." },
  };
  /* 진행 단계 순서 */
  const STEP_ORDER = ["pending", "progress", "done"];

  function render() {
    const order = id ? Store.getOrder(id) : null;

    if (!order) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>주문을 찾을 수 없습니다.</p>
          <a href="list.html" class="btn btn-outline" style="margin-top:1rem">주문 내역으로</a>
        </div>`;
      return;
    }

    const meta = STATUS_META[order.status] || STATUS_META.pending;
    const isCanceled = order.status === "canceled";

    // 진행 단계 렌더
    const currentIdx = STEP_ORDER.indexOf(order.status);
    const stepsHtml = STEP_ORDER.map((s, i) => {
      const reached = !isCanceled && i <= currentIdx;
      return `<div class="status-step${reached ? " reached" : ""}">
          <div class="dot"></div>${ORDER_STATUS[s].label}
        </div>`;
    }).join("");

    const itemsHtml = order.items
      .map(
        (it) => `
        <div class="order-item-row">
          <div class="row-thumb">${it.emoji}</div>
          <div class="row-info">
            <div class="row-name">${escapeHtml(it.name)}</div>
            <div class="row-qty">${formatPrice(it.price)} × ${it.qty}</div>
          </div>
          <div class="row-price">${formatPrice(it.price * it.qty)}</div>
        </div>`
      )
      .join("");

    const canCancel = order.status === "pending";

    root.innerHTML = `
      <div class="order-status-banner">
        <span class="status-emoji">${meta.emoji}</span>
        <div class="status-text">
          <h2>${ORDER_STATUS[order.status].label}</h2>
          <p>${meta.msg}</p>
        </div>
        ${statusBadge(order.status)}
      </div>

      <div class="status-steps${isCanceled ? " is-canceled" : ""}">${stepsHtml}</div>

      <div class="order-section">
        <h3>주문 메뉴</h3>
        ${itemsHtml}
        <div class="order-total-row">
          <span>총 결제금액</span>
          <span class="total-value">${formatPrice(order.total)}</span>
        </div>
      </div>

      <div class="order-section">
        <h3>주문 정보</h3>
        <div class="order-meta-row"><span class="label">주문번호</span><span>${escapeHtml(order.id)}</span></div>
        <div class="order-meta-row"><span class="label">주문일시</span><span>${formatDate(order.createdAt)}</span></div>
        <div class="order-meta-row"><span class="label">주문자</span><span>${escapeHtml(order.customer)}</span></div>
        ${
          order.memo
            ? `<div class="order-meta-row"><span class="label">요청사항</span><span>${escapeHtml(order.memo)}</span></div>`
            : ""
        }
      </div>

      ${
        canCancel
          ? `<div class="order-actions">
              <button type="button" class="btn btn-outline btn-block js-cancel">주문 취소</button>
            </div>`
          : ""
      }`;
  }

  /* 취소 (접수 대기 상태에서만) */
  root.addEventListener("click", (e) => {
    if (!e.target.closest(".js-cancel")) return;
    if (confirm("주문을 취소하시겠습니까?")) {
      Store.updateOrderStatus(id, "canceled");
      toast("주문이 취소되었습니다.");
      render();
    }
  });

  render();
})();
