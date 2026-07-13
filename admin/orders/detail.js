/* admin/orders/detail.js — 관리자 주문 상세 (상태 변경) */
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

  const root = document.getElementById("detailRoot");
  const id = getParam("id");

  const STATUS_EMOJI = {
    pending: "📝",
    progress: "☕",
    done: "✅",
    canceled: "🚫",
  };

  async function render() {
    const order = id ? await Store.getOrder(id) : null;

    if (!order) {
      root.innerHTML = `
        <div class="section-card">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>주문을 찾을 수 없습니다.</p>
            <a href="list.html" class="btn btn-outline" style="margin-top:1rem">주문 목록으로</a>
          </div>
        </div>`;
      return;
    }

    const itemsHtml = order.items
      .map(
        (it) => `
        <div class="o-item-row">
          <div class="o-thumb">${it.emoji}</div>
          <div class="o-info">
            <div class="o-name">${escapeHtml(it.name)}</div>
            <div class="o-qty">${formatPrice(it.price)} × ${it.qty}</div>
          </div>
          <div class="o-price">${formatPrice(it.price * it.qty)}</div>
        </div>`
      )
      .join("");

    const statusButtons = Object.keys(ORDER_STATUS)
      .map(
        (k) =>
          `<button type="button" class="status-btn js-status${k === order.status ? " is-current" : ""}" data-status="${k}">
            <span>${STATUS_EMOJI[k]}</span> ${ORDER_STATUS[k].label}
          </button>`
      )
      .join("");

    root.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <div class="section-card">
            <h3>주문 메뉴</h3>
            ${itemsHtml}
            <div class="o-total-row">
              <span>총 결제금액</span>
              <span class="val">${formatPrice(order.total)}</span>
            </div>
          </div>

          <div class="section-card">
            <h3>주문 정보</h3>
            <div class="o-meta-row"><span class="label">주문번호</span><span>${escapeHtml(order.id)}</span></div>
            <div class="o-meta-row"><span class="label">주문자</span><span>${escapeHtml(order.customer)}</span></div>
            <div class="o-meta-row"><span class="label">주문일시</span><span>${formatDate(order.createdAt)}</span></div>
            ${
              order.memo
                ? `<div class="o-meta-row"><span class="label">요청사항</span><span>${escapeHtml(order.memo)}</span></div>`
                : ""
            }
          </div>
        </div>

        <aside class="status-panel">
          <div class="section-card">
            <h3>주문 상태 관리</h3>
            <div class="current-status">
              <span class="cs-emoji">${STATUS_EMOJI[order.status]}</span>
              <div>
                <div class="cs-label">현재 상태</div>
                ${statusBadge(order.status)}
              </div>
            </div>
            <div class="status-actions">${statusButtons}</div>
          </div>
        </aside>
      </div>`;
  }

  /* 상태 변경 (이벤트 위임) */
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-status");
    if (!btn) return;
    const newStatus = btn.dataset.status;
    const order = await Store.getOrder(id);
    if (!order || order.status === newStatus) return;
    try {
      await Store.updateOrderStatus(id, newStatus);
    } catch (err) {
      toast("상태 변경에 실패했습니다.");
      return;
    }
    toast(`상태를 '${ORDER_STATUS[newStatus].label}'(으)로 변경했습니다.`);
    await render();
  });

  (async function init() {
    const ok = await window.AdminLayout.render({ active: "orders", title: "주문 상세" });
    if (!ok) return;
    await render();
  })();
})();
