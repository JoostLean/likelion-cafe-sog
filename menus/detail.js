/* menus/detail.js — 고객 메뉴 상세 (수량 선택 + 장바구니 담기) */
(function () {
  "use strict";

  const { Store, formatPrice, escapeHtml, getParam, toast, rootPath } = window.CafeUtils;
  window.CustomerLayout.render({ active: "menus" });

  const root = document.getElementById("detailRoot");
  const id = getParam("id");
  const menu = id ? Store.getMenu(id) : null;

  if (!menu) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>메뉴를 찾을 수 없습니다.</p>
        <a href="list.html" class="btn btn-outline" style="margin-top:1rem">메뉴 목록으로</a>
      </div>`;
    return;
  }

  const categories = Store.getCategories();
  const cat = categories.find((c) => c.id === menu.categoryId);

  const badges = (menu.badges || [])
    .map((b) => `<span class="detail-badge">${escapeHtml(b)}</span>`)
    .join("");

  const imageSrc = menu.imageUrl ? `${rootPath()}${menu.imageUrl}` : "";
  const heroPhoto = imageSrc
    ? `<img src="${imageSrc}" alt="${escapeHtml(menu.name)}" class="detail-photo" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
    : "";

  root.innerHTML = `
    <div class="detail-hero${imageSrc ? "" : " no-photo"}" style="background:${menu.gradient}">
      ${heroPhoto}
      <span class="detail-emoji-fallback">${menu.emoji}</span>
      ${menu.soldOut ? `<div class="soldout-overlay">품절</div>` : ""}
    </div>
    <div class="detail-body">
      ${badges ? `<div class="detail-badges">${badges}</div>` : ""}
      <div class="detail-title">
        <h1>${escapeHtml(menu.name)}</h1>
        <span class="price">${formatPrice(menu.price)}</span>
      </div>
      <p class="detail-category">${cat ? escapeHtml(cat.emoji + " " + cat.name) : ""}</p>
      <p class="detail-desc">${escapeHtml(menu.description) || "설명이 없습니다."}</p>
    </div>`;

  /* ---------- 하단 주문 바 ---------- */
  if (!menu.soldOut) {
    document.body.classList.add("has-order-bar");
    const bar = document.createElement("div");
    bar.className = "order-bar";
    bar.innerHTML = `
      <div class="container-inner">
        <div class="qty-control">
          <button type="button" class="js-minus" aria-label="수량 감소">−</button>
          <span class="qty-value" id="qtyValue">1</span>
          <button type="button" class="js-plus" aria-label="수량 증가">+</button>
        </div>
        <button type="button" class="btn btn-primary js-add-cart">
          장바구니 담기 · <span id="barTotal">${formatPrice(menu.price)}</span>
        </button>
      </div>`;
    document.body.appendChild(bar);

    let qty = 1;
    const qtyValue = bar.querySelector("#qtyValue");
    const barTotal = bar.querySelector("#barTotal");
    const sync = () => {
      qtyValue.textContent = qty;
      barTotal.textContent = formatPrice(menu.price * qty);
    };

    bar.querySelector(".js-minus").addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      sync();
    });
    bar.querySelector(".js-plus").addEventListener("click", () => {
      qty = Math.min(99, qty + 1);
      sync();
    });
    bar.querySelector(".js-add-cart").addEventListener("click", () => {
      Store.addToCart(menu.id, qty);
      window.CustomerLayout.refreshCartBadge();
      toast(`'${menu.name}' ${qty}개를 장바구니에 담았습니다.`);
    });
  }
})();
