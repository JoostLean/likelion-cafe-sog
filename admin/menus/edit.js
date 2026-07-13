/* admin/menus/edit.js — 메뉴 수정 */
(function () {
  "use strict";

  const { Store, getParam, toast } = window.CafeUtils;

  const id = getParam("id");
  const wrap = document.getElementById("formWrap");
  const form = document.getElementById("menuForm");

  (async function init() {
    const ok = await window.AdminLayout.render({ active: "menus", title: "메뉴 수정" });
    if (!ok) return;

    const menu = id ? await Store.getMenu(id) : null;

    if (!menu) {
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>메뉴를 찾을 수 없습니다.</p>
          <a href="list.html" class="btn btn-outline" style="margin-top:1rem">목록으로</a>
        </div>`;
      return;
    }

    await window.MenuForm.populateSelects(form);
    window.MenuForm.fill(form, menu);
    window.MenuForm.bindPreview(form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { valid, data } = window.MenuForm.validate(form);
      if (!valid) return;

      try {
        await Store.updateMenu(menu.id, data);
      } catch (err) {
        toast("저장에 실패했습니다. 권한을 확인하세요.");
        return;
      }
      toast("변경사항이 저장되었습니다.");
      setTimeout(() => (location.href = `detail.html?id=${menu.id}`), 600);
    });
  })();
})();
