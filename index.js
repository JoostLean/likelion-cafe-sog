/* index.js — 고객 메인 페이지 */
(function () {
  "use strict";

  const { Store, escapeHtml, rootPath, toast } = window.CafeUtils;
  window.CustomerLayout.render({ active: "home" });

  const root = rootPath();
  const menus = Store.getMenus();
  const categories = Store.getCategories();

  /* ---------- 카테고리 바로가기 ---------- */
  const categoryNav = document.getElementById("categoryNav");
  categoryNav.innerHTML = categories
    .map(
      (c) => `
      <a href="${root}menus/list.html?cat=${c.id}" class="category-item">
        <span class="cat-emoji">${c.emoji}</span>
        <span class="cat-name">${escapeHtml(c.name)}</span>
      </a>`
    )
    .join("");

  /* ---------- 인기 메뉴 (badges에 '인기') ---------- */
  const popular = menus.filter((m) => (m.badges || []).includes("인기")).slice(0, 4);
  window.MenuCard.renderInto(
    document.getElementById("popularGrid"),
    popular.length ? popular : menus.slice(0, 4)
  );

  /* ---------- 신메뉴 (badges에 '신메뉴', 최신순) ---------- */
  const fresh = menus
    .filter((m) => (m.badges || []).includes("신메뉴"))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  window.MenuCard.renderInto(
    document.getElementById("newGrid"),
    fresh.length ? fresh : menus.slice(-4)
  );

  /* ---------- 장바구니 담기 (이벤트 위임, 두 그리드 공통) ---------- */
  document.querySelector("main").addEventListener("click", (e) => {
    const btn = e.target.closest(".js-add");
    if (!btn) return;
    e.preventDefault();
    const menu = Store.getMenu(btn.dataset.id);
    if (!menu || menu.soldOut) return;
    Store.addToCart(menu.id, 1);
    window.CustomerLayout.refreshCartBadge();
    toast(`'${menu.name}' 장바구니에 담았습니다.`);
  });
})();
