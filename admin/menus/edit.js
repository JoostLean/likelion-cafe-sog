/* admin/menus/edit.js — 메뉴 수정 */
(function () {
  "use strict";

  const { Store, getParam, toast } = window.CafeUtils;
  window.AdminLayout.render({ active: "menus", title: "메뉴 수정" });

  const id = getParam("id");
  const menu = id ? Store.getMenu(id) : null;
  const wrap = document.getElementById("formWrap");

  if (!menu) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>메뉴를 찾을 수 없습니다.</p>
        <a href="list.html" class="btn btn-outline" style="margin-top:1rem">목록으로</a>
      </div>`;
    return;
  }

  const form = document.getElementById("menuForm");
  window.MenuForm.populateSelects(form);
  window.MenuForm.fill(form, menu);
  window.MenuForm.bindPreview(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { valid, data } = window.MenuForm.validate(form);
    if (!valid) return;

    Store.updateMenu(menu.id, data);
    toast("변경사항이 저장되었습니다.");
    setTimeout(() => (location.href = `detail.html?id=${menu.id}`), 600);
  });
})();
