/* admin/menus/create.js — 메뉴 추가 */
(function () {
  "use strict";

  const { Store, toast } = window.CafeUtils;

  const form = document.getElementById("menuForm");

  (async function init() {
    const ok = await window.AdminLayout.render({ active: "menus", title: "메뉴 추가" });
    if (!ok) return;

    await window.MenuForm.populateSelects(form);
    window.MenuForm.bindPreview(form);
  })();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { valid, data } = window.MenuForm.validate(form);
    if (!valid) return;

    try {
      await Store.createMenu(data);
    } catch (err) {
      toast("등록에 실패했습니다. 권한을 확인하세요.");
      return;
    }
    toast("메뉴가 등록되었습니다.");
    setTimeout(() => (location.href = "list.html"), 600);
  });
})();
