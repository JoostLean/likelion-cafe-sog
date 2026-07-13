/* ============================================================
   menu-card.js — 고객용 메뉴 카드 렌더 헬퍼
   메뉴 목록 / 메인 페이지 등에서 공유. window.MenuCard 노출
   장바구니 담기 버튼 클릭은 상위에서 이벤트 위임(.js-add[data-id])
   ============================================================ */
(function () {
  "use strict";

  const { formatPrice, escapeHtml, rootPath } = window.CafeUtils;

  const MenuCard = {
    /* 단일 카드 HTML (detail 링크는 rootPath 기준 절대 경로) */
    html(menu) {
      const root = rootPath();
      const detailHref = `${root}menus/detail.html?id=${menu.id}`;

      const badges = (menu.badges || [])
        .map((b) => `<span class="card-badge">${escapeHtml(b)}</span>`)
        .join("");

      const soldOutOverlay = menu.soldOut
        ? `<div class="soldout-overlay">품절</div>`
        : "";

      const addBtn = menu.soldOut
        ? `<button class="card-add" disabled aria-label="품절">+</button>`
        : `<button class="card-add js-add" data-id="${menu.id}" aria-label="장바구니 담기">+</button>`;

      const imageSrc = menu.imageUrl ? `${root}${menu.imageUrl}` : "";
      const thumbInner = imageSrc
        ? `<img src="${imageSrc}" alt="${escapeHtml(menu.name)}" class="card-photo" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
        : "";

      return `
        <article class="menu-card${menu.soldOut ? " is-soldout" : ""}">
          <a href="${detailHref}" class="card-link">
            <div class="card-thumb" style="background:${menu.gradient}">
              ${thumbInner}
              <span class="card-emoji-fallback">${menu.emoji}</span>
              ${soldOutOverlay}
              ${badges ? `<div class="card-badges">${badges}</div>` : ""}
            </div>
            <div class="card-body">
              <div class="card-name">${escapeHtml(menu.name)}</div>
              <p class="card-desc">${escapeHtml(menu.description)}</p>
              <div class="card-foot">
                <span class="card-price">${formatPrice(menu.price)}</span>
              </div>
            </div>
          </a>
          <div class="card-add-wrap">${addBtn}</div>
        </article>`;
    },

    /* 여러 카드를 컨테이너에 렌더 */
    renderInto(container, menus) {
      container.innerHTML = menus.map((m) => this.html(m)).join("");
    },
  };

  window.MenuCard = MenuCard;
})();
