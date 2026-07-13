/* admin/menus/create.js — 메뉴 추가 */
(function () {
  "use strict";

  const { Store, toast } = window.CafeUtils;
  window.AdminLayout.render({ active: "menus", title: "메뉴 추가" });

  const form = document.getElementById("menuForm");
  window.MenuForm.populateSelects(form);
  window.MenuForm.bindPreview(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { valid, data } = window.MenuForm.validate(form);
    if (!valid) return;

    Store.createMenu(data);
    toast("메뉴가 등록되었습니다.");
    setTimeout(() => (location.href = "list.html"), 600);
  });
})();
