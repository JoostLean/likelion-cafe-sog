/* orders/list.js — 고객 주문 내역 목록 */
(function () {
  "use strict";

  const { Store, Auth, formatPrice, formatDate, statusBadge, escapeHtml, rootPath } =
    window.CafeUtils;

  const root = document.getElementById("ordersRoot");
  const rp = rootPath();

  function renderCard(o) {
    // 대표 썸네일 최대 3개
    const thumbs = o.items
      .slice(0, 3)
      .map((it) => {
        const imageSrc = it.imageUrl ? `${rp}${it.imageUrl}` : "";
        const photo = imageSrc
          ? `<img src="${imageSrc}" alt="" class="mini-thumb-photo" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
          : "";
        return `<div class="mini-thumb${imageSrc ? "" : " no-photo"}" style="background:var(--color-cream)">
            ${photo}
            <span class="mini-thumb-emoji-fallback">${it.emoji}</span>
          </div>`;
      })
      .join("");

    const firstName = escapeHtml(o.items[0] ? o.items[0].name : "");
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

  (async function init() {
    await window.CustomerLayout.render({ active: "orders" });

    if (!(await Auth.isLoggedIn())) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>로그인 후 주문 내역을 확인할 수 있습니다.</p>
          <a href="${rp}my/index.html" class="btn btn-primary" style="margin-top:1rem">로그인하러 가기</a>
        </div>`;
      return;
    }

    const orders = await Store.getOrders();

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
  })();
})();
