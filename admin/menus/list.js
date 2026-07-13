/* admin/menus/list.js — 메뉴 목록 (검색 / 카테고리 필터 / 삭제) */
(function () {
  "use strict";

  const { Store, formatPrice, escapeHtml, toast, rootPath } = window.CafeUtils;

  const tbody = document.getElementById("menuTableBody");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const chipGroup = document.getElementById("categoryChips");
  const rp = rootPath();

  let activeCategory = "all";
  let keyword = "";
  let categories = [];
  let categoryMap = {};
  let allMenus = []; // 인메모리 필터

  /* ---------- 카테고리 필터 칩 ---------- */
  function renderChips() {
    const chips = [{ id: "all", name: "전체" }, ...categories];
    chipGroup.innerHTML = chips
      .map(
        (c) =>
          `<button class="chip${c.id === activeCategory ? " active" : ""}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`
      )
      .join("");
  }

  /* ---------- 테이블 렌더 ---------- */
  function renderTable() {
    let menus = allMenus;

    if (activeCategory !== "all") {
      menus = menus.filter((m) => m.categoryId === activeCategory);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      menus = menus.filter((m) => m.name.toLowerCase().includes(kw));
    }

    if (menus.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    tbody.innerHTML = menus
      .map((m) => {
        const cat = categoryMap[m.categoryId];
        const statusBadge = m.soldOut
          ? `<span class="badge badge-soldout">품절</span>`
          : `<span class="badge badge-active">판매중</span>`;
        const badges = (m.badges || [])
          .map((b) => `<span class="badge-mini">${escapeHtml(b)}</span>`)
          .join("");
        const imageSrc = m.imageUrl ? `${rp}${m.imageUrl}` : "";
        const photo = imageSrc
          ? `<img src="${imageSrc}" alt="" class="table-thumb-photo" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
          : "";
        return `
          <tr>
            <td>
              <div class="table-thumb${imageSrc ? "" : " no-photo"}" style="background:${m.gradient}">
                ${photo}
                <span class="table-thumb-emoji-fallback">${m.emoji}</span>
              </div>
            </td>
            <td>
              <div class="menu-name-cell">
                <strong>${escapeHtml(m.name)}</strong>
                <small class="badge-list">${badges}</small>
              </div>
            </td>
            <td>${cat ? escapeHtml(cat.name) : "-"}</td>
            <td class="price-cell">${formatPrice(m.price)}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="row-actions">
                <a href="detail.html?id=${m.id}" class="btn btn-outline btn-sm">상세</a>
                <a href="edit.html?id=${m.id}" class="btn btn-outline btn-sm">수정</a>
                <button class="btn btn-ghost btn-sm js-delete" data-id="${m.id}" data-name="${escapeHtml(m.name)}">삭제</button>
              </div>
            </td>
          </tr>`;
      })
      .join("");
  }

  /* ---------- 이벤트 ---------- */
  chipGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderChips();
    renderTable();
  });

  searchInput.addEventListener("input", (e) => {
    keyword = e.target.value.trim();
    renderTable();
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-delete");
    if (!btn) return;
    const { id, name } = btn.dataset;
    if (confirm(`'${name}' 메뉴를 삭제하시겠습니까?`)) {
      try {
        await Store.deleteMenu(id);
      } catch (err) {
        toast("삭제에 실패했습니다.");
        return;
      }
      allMenus = allMenus.filter((m) => m.id !== id);
      toast("메뉴가 삭제되었습니다.");
      renderTable();
    }
  });

  /* ---------- 초기 렌더 ---------- */
  (async function init() {
    const ok = await window.AdminLayout.render({ active: "menus", title: "메뉴 관리" });
    if (!ok) return;

    [categories, allMenus] = await Promise.all([
      Store.getCategories(),
      Store.getMenus(),
    ]);
    categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    renderChips();
    renderTable();
  })();
})();
