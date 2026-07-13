/* admin/menus/_form.js — 메뉴 생성/수정 폼 공통 로직
   create.js / edit.js 가 공유. window.MenuForm 노출 */
(function () {
  "use strict";

  const { Store, escapeHtml } = window.CafeUtils;

  /* 그라디언트 프리셋 (라벨, 값) */
  const GRADIENTS = [
    { label: "커피 브라운", value: "linear-gradient(135deg, #d7bfa6, #6f4e37)" },
    { label: "라떼 크림", value: "linear-gradient(135deg, #f3e9dd, #c8a27c)" },
    { label: "카라멜", value: "linear-gradient(135deg, #faf4ec, #b07d52)" },
    { label: "말차 그린", value: "linear-gradient(135deg, #dfe9cf, #7f9b5a)" },
    { label: "시트러스", value: "linear-gradient(135deg, #ffe3d0, #e8895f)" },
    { label: "베리 퍼플", value: "linear-gradient(135deg, #e3efc9, #9bbf5a)" },
    { label: "다크초코", value: "linear-gradient(135deg, #d8bfa8, #5a3d2b)" },
  ];

  const MenuForm = {
    GRADIENTS,

    /* select 옵션 채우기 */
    populateSelects(form) {
      const catSel = form.querySelector("#categoryId");
      catSel.innerHTML = Store.getCategories()
        .map((c) => `<option value="${c.id}">${escapeHtml(c.emoji + " " + c.name)}</option>`)
        .join("");

      const gradSel = form.querySelector("#gradient");
      gradSel.innerHTML = GRADIENTS.map(
        (g) => `<option value="${g.value}">${escapeHtml(g.label)}</option>`
      ).join("");
    },

    /* 폼에 기존 값 채우기 (수정 시) */
    fill(form, menu) {
      form.name.value = menu.name || "";
      form.categoryId.value = menu.categoryId || "";
      form.price.value = menu.price ?? "";
      form.description.value = menu.description || "";
      form.emoji.value = menu.emoji || "";
      form.imageUrl.value = menu.imageUrl || "";
      form.gradient.value = menu.gradient || GRADIENTS[1].value;
      form.badges.value = (menu.badges || []).join(", ");
      form.soldOut.checked = !!menu.soldOut;
    },

    /* 실시간 미리보기 바인딩 (이미지 URL 있으면 이미지, 없으면 이모지+그라디언트) */
    bindPreview(form) {
      const { rootPath } = window.CafeUtils;
      const thumb = document.getElementById("previewThumb");
      const update = () => {
        const url = form.imageUrl.value.trim();
        thumb.style.background = form.gradient.value || GRADIENTS[1].value;
        if (url) {
          const src = /^https?:\/\//.test(url) ? url : `${rootPath()}${url}`;
          thumb.innerHTML = `<img src="${src}" alt="" class="preview-photo" />`;
          const img = thumb.querySelector("img");
          img.onerror = () => {
            img.remove();
            thumb.textContent = form.emoji.value.trim() || "☕";
          };
        } else {
          thumb.textContent = form.emoji.value.trim() || "☕";
        }
      };
      form.emoji.addEventListener("input", update);
      form.gradient.addEventListener("change", update);
      form.imageUrl.addEventListener("input", update);
      update();
    },

    /* 검증 → { valid, data } */
    validate(form) {
      let valid = true;
      form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
      form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));

      const setError = (fieldName, msg) => {
        valid = false;
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input) input.classList.add("invalid");
        const err = form.querySelector(`.field-error[data-for="${fieldName}"]`);
        if (err) err.textContent = msg;
      };

      const name = form.name.value.trim();
      if (!name) setError("name", "메뉴명을 입력하세요.");

      const price = Number(form.price.value);
      if (form.price.value === "" || isNaN(price) || price < 0)
        setError("price", "0 이상의 가격을 입력하세요.");

      const data = {
        name,
        categoryId: form.categoryId.value,
        price,
        description: form.description.value.trim(),
        emoji: form.emoji.value.trim() || "☕",
        imageUrl: form.imageUrl.value.trim(),
        gradient: form.gradient.value || GRADIENTS[1].value,
        badges: form.badges.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        soldOut: form.soldOut.checked,
      };

      return { valid, data };
    },
  };

  window.MenuForm = MenuForm;
})();
