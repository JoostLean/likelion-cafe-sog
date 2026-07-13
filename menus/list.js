/* menus/list.js — 고객 메뉴 목록 (검색 / 카테고리 필터 / 장바구니 담기) */
(function () {
  "use strict";

  const { Store, Auth, escapeHtml, getParam, toast, rootPath } = window.CafeUtils;

  const grid = document.getElementById("menuGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const chipGroup = document.getElementById("categoryChips");
  const root = rootPath();

  let categories = [];
  let allMenus = []; // 한 번만 로드 후 인메모리 필터
  let activeCategory = "all";
  let keyword = "";

  function renderChips() {
    const chips = [{ id: "all", name: "전체" }, ...categories];
    chipGroup.innerHTML = chips
      .map(
        (c) =>
          `<button class="chip${c.id === activeCategory ? " active" : ""}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`
      )
      .join("");
  }

  function renderMenus() {
    let menus = allMenus;

    if (activeCategory !== "all")
      menus = menus.filter((m) => m.categoryId === activeCategory);
    if (keyword) {
      const kw = keyword.toLowerCase();
      menus = menus.filter(
        (m) =>
          m.name.toLowerCase().includes(kw) ||
          (m.description || "").toLowerCase().includes(kw)
      );
    }

    if (menus.length === 0) {
      grid.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");
    window.MenuCard.renderInto(grid, menus);
  }

  (async function init() {
    await window.CustomerLayout.render({ active: "menus" });

    [categories, allMenus] = await Promise.all([
      Store.getCategories(),
      Store.getMenus(),
    ]);

    // 메인 페이지 등에서 ?cat=... 로 진입 시 초기 카테고리 반영
    const initialCat = getParam("cat");
    if (initialCat && categories.some((c) => c.id === initialCat)) {
      activeCategory = initialCat;
    }

    renderChips();
    renderMenus();
  })();

  /* ---------- 이벤트 ---------- */
  chipGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderChips();
    renderMenus();
  });

  searchInput.addEventListener("input", (e) => {
    keyword = e.target.value.trim();
    renderMenus();
  });

  /* 장바구니 담기 (이벤트 위임) */
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-add");
    if (!btn) return;
    e.preventDefault();
    const menu = allMenus.find((m) => m.id === btn.dataset.id);
    if (!menu || menu.soldOut) return;
    if (!(await Auth.isLoggedIn())) {
      toast("로그인 후 이용해주세요.");
      setTimeout(() => (location.href = `${root}my/index.html`), 800);
      return;
    }
    await Store.addToCart(menu.id, 1);
    await window.CustomerLayout.refreshCartBadge();
    toast(`'${menu.name}' 장바구니에 담았습니다.`);
  });
})();
