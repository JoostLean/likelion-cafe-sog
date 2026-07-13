/* basket/list.js — 장바구니 (수량 조절 / 삭제 / 비우기 / 주문하기) */
(function () {
  "use strict";

  const { Store, Auth, formatPrice, escapeHtml, toast, rootPath } =
    window.CafeUtils;

  const root = document.getElementById("basketRoot");
  const rp = rootPath();

  function renderLoginNeeded() {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <p>로그인 후 장바구니를 이용할 수 있습니다.</p>
        <a href="${rp}my/index.html" class="btn btn-primary" style="margin-top:1rem">로그인하러 가기</a>
      </div>`;
  }

  async function render() {
    const items = await Store.getCartDetailed();

    if (items.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p>장바구니가 비어 있습니다.</p>
          <a href="../menus/list.html" class="btn btn-primary" style="margin-top:1rem">메뉴 보러가기</a>
        </div>`;
      return;
    }

    const total = items.reduce((s, it) => s + it.lineTotal, 0);
    const count = items.reduce((s, it) => s + it.qty, 0);

    const itemsHtml = items
      .map((it) => {
        const imageSrc = it.menu.imageUrl ? `${rp}${it.menu.imageUrl}` : "";
        const thumbInner = imageSrc
          ? `<img src="${imageSrc}" alt="${escapeHtml(it.menu.name)}" class="thumb-photo" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('img-fallback');" />`
          : "";
        return `
        <div class="basket-item" data-id="${it.menuId}">
          <div class="item-thumb${imageSrc ? "" : " no-photo"}" style="background:${it.menu.gradient}">
            ${thumbInner}
            <span class="thumb-emoji-fallback">${it.menu.emoji}</span>
          </div>
          <div class="item-info">
            <span class="item-name">${escapeHtml(it.menu.name)}</span>
            <span class="item-price">${formatPrice(it.menu.price)}</span>
            <span class="item-linetotal">${formatPrice(it.lineTotal)}</span>
          </div>
          <div class="item-controls">
            <div class="qty-control">
              <button type="button" class="js-minus" aria-label="수량 감소">−</button>
              <span class="qty-value">${it.qty}</span>
              <button type="button" class="js-plus" aria-label="수량 증가">+</button>
            </div>
            <button type="button" class="item-remove js-remove">삭제</button>
          </div>
        </div>`;
      })
      .join("");

    root.innerHTML = `
      <div class="basket-layout">
        <div class="basket-items">${itemsHtml}</div>

        <aside class="basket-summary">
          <h2>주문 요약</h2>
          <div class="summary-row">
            <span>상품 수</span>
            <span>${count}개</span>
          </div>
          <div class="summary-total">
            <span>총 결제금액</span>
            <span class="total-value">${formatPrice(total)}</span>
          </div>
          <div class="field">
            <label for="memo">요청사항</label>
            <textarea id="memo" class="textarea" placeholder="예: 얼음 적게, 덜 달게"></textarea>
          </div>
          <button type="button" class="btn btn-primary btn-block js-order">주문하기</button>
          <button type="button" class="clear-cart-btn js-clear">장바구니 비우기</button>
        </aside>
      </div>`;
  }

  async function afterCartChange() {
    await render();
    await window.CustomerLayout.refreshCartBadge();
  }

  /* ---------- 이벤트 위임 ---------- */
  root.addEventListener("click", async (e) => {
    const itemEl = e.target.closest(".basket-item");

    // 수량 증가
    if (e.target.closest(".js-plus") && itemEl) {
      const id = itemEl.dataset.id;
      const cart = await Store.getCart();
      const item = cart.find((i) => i.menuId === id);
      if (item) await Store.updateCartQty(id, item.qty + 1);
      await afterCartChange();
      return;
    }
    // 수량 감소
    if (e.target.closest(".js-minus") && itemEl) {
      const id = itemEl.dataset.id;
      const cart = await Store.getCart();
      const item = cart.find((i) => i.menuId === id);
      if (!item) return;
      if (item.qty <= 1) {
        await Store.removeFromCart(id);
      } else {
        await Store.updateCartQty(id, item.qty - 1);
      }
      await afterCartChange();
      return;
    }
    // 삭제
    if (e.target.closest(".js-remove") && itemEl) {
      await Store.removeFromCart(itemEl.dataset.id);
      await afterCartChange();
      return;
    }
    // 비우기
    if (e.target.closest(".js-clear")) {
      if ((await Store.cartCount()) > 0 && confirm("장바구니를 비우시겠습니까?")) {
        await Store.clearCart();
        await afterCartChange();
        toast("장바구니를 비웠습니다.");
      }
      return;
    }
    // 주문하기
    if (e.target.closest(".js-order")) {
      const memo = (document.getElementById("memo")?.value || "").trim();
      let order;
      try {
        order = await Store.createOrder({ memo });
      } catch (err) {
        toast("주문에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      if (!order) {
        toast("장바구니가 비어 있습니다.");
        return;
      }
      await window.CustomerLayout.refreshCartBadge();
      toast("주문이 완료되었습니다!");
      setTimeout(() => {
        location.href = `../orders/detail.html?id=${order.id}`;
      }, 700);
      return;
    }
  });

  (async function init() {
    await window.CustomerLayout.render({ active: "basket" });
    if (!(await Auth.isLoggedIn())) {
      renderLoginNeeded();
      return;
    }
    await render();
  })();
})();
