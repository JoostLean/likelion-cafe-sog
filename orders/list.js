/* orders/list.js — 고객 주문 내역 목록 */
(function () {
  "use strict";

  const { Store, formatPrice, formatDate, statusBadge, escapeHtml } =
    window.CafeUtils;
  window.CustomerLayout.render({ active: "orders" });

  const root = document.getElementById("ordersRoot");
  const orders = Store.getOrders();

  if (orders.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧾</div>
        <p>아직 주문 내역이 없습니다.</p>
        <a href="../menus/list.html" class="btn btn-primary" style="margin-top:1rem">메뉴 보러가기</a>
      </div>`;
    return;
  }

  root.innerHTML = `<div class="order-list">${orders
    .map((o) => renderCard(o))
    .join("")}</div>`;

  function renderCard(o) {
    // 대표 썸네일 최대 3개
    const thumbs = o.items
      .slice(0, 3)
      .map(
        (it) =>
          `<div class="mini-thumb" style="background:var(--color-cream)">${it.emoji}</div>`
      )
      .join("");

    const firstName = escapeHtml(o.items[0].name);
    const restCount = o.items.length - 1;
    const summaryText =
      restCount > 0
        ? `${firstName} <span class="more">외 ${restCount}건</span>`
        : firstName;

    return `
      <a href="detail.html?id=${o.id}" class="order-card">
        <div class="order-card-head">
          <span class="order-date">${formatDate(o.createdAt)}</span>
          ${statusBadge(o.status)}
        </div>
        <div class="order-card-summary">
          <div class="order-thumbs">${thumbs}</div>
          <span class="order-summary-text">${summaryText}</span>
        </div>
        <div class="order-card-foot">
          <span class="order-total">총 <b>${formatPrice(o.total)}</b></span>
          <span class="view-link">상세 보기 ›</span>
        </div>
      </a>`;
  }
})();
