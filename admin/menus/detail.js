/* admin/menus/detail.js — 메뉴 상세 */
(function () {
  "use strict";

  const { Store, formatPrice, formatDate, escapeHtml, getParam, toast, rootPath } =
    window.CafeUtils;

  const root = document.getElementById("detailRoot");
  const actions = document.getElementById("detailActions");
  const id = getParam("id");

  (async function init() {
    const ok = await window.AdminLayout.render({ active: "menus", title: "메뉴 상세" });
    if (!ok) return;

    const menu = id ? await Store.getMenu(id) : null;

    if (!menu) {
      root.innerHTML = `
        <div class="section-card">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>메뉴를 찾을 수 없습니다.</p>
            <a href="list.html" class="btn btn-outline" style="margin-top:1rem">목록으로</a>
          </div>
        </div>`;
      return;
    }

    const categories = await Store.getCategories();
    const cat = categories.find((c) => c.id === menu.categoryId);

    const statusBadge = menu.soldOut
      ? `<span class="badge badge-soldout">품절</span>`
      : `<span class="badge badge-active">판매중</span>`;
    const badges =
      (menu.badges || []).length > 0
        ? `<span class="badge-list">${menu.badges
            .map((b) => `<span class="badge-mini">${escapeHtml(b)}</span>`)
            .join("")}</span>`
        : `<span class="text-muted">없음</span>`;

    const imageSrc = menu.imageUrl ? `${rootPath()}${menu.imageUrl}` : "";
    const visualPhoto = imageSrc
      ? `<img src="${imageSrc}" alt="${escapeHtml(menu.name)}" class="detail-visual-photo" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
      : "";

    root.innerHTML = `
      <div class="section-card">
        <div class="detail-grid">
          <div class="detail-visual${imageSrc ? "" : " no-photo"}" style="background:${menu.gradient}">
            ${visualPhoto}
            <span class="detail-visual-emoji-fallback">${menu.emoji}</span>
          </div>
          <div class="detail-info">
            <div class="name-row">
              <h2>${escapeHtml(menu.name)}</h2>
              ${statusBadge}
            </div>
            <div class="price">${formatPrice(menu.price)}</div>
            <p class="description">${escapeHtml(menu.description) || "설명이 없습니다."}</p>
            <div class="detail-meta">
              <div class="meta-item">
                <span class="label">카테고리</span>
                <span class="value">${cat ? escapeHtml(cat.emoji + " " + cat.name) : "-"}</span>
              </div>
              <div class="meta-item">
                <span class="label">배지</span>
                <span class="value">${badges}</span>
              </div>
              <div class="meta-item">
                <span class="label">메뉴 ID</span>
                <span class="value">${escapeHtml(menu.id)}</span>
              </div>
              <div class="meta-item">
                <span class="label">등록일</span>
                <span class="value">${formatDate(menu.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    actions.innerHTML = `
      <a href="edit.html?id=${menu.id}" class="btn btn-primary">수정</a>
      <button class="btn btn-danger js-delete">삭제</button>`;

    actions.querySelector(".js-delete").addEventListener("click", async () => {
      if (confirm(`'${menu.name}' 메뉴를 삭제하시겠습니까?`)) {
        try {
          await Store.deleteMenu(menu.id);
        } catch (err) {
          toast("삭제에 실패했습니다.");
          return;
        }
        toast("메뉴가 삭제되었습니다.");
        location.href = "list.html";
      }
    });
  })();
})();
