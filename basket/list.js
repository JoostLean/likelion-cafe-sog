/* basket/list.js — 장바구니 (수량 조절 / 삭제 / 비우기 / 주문하기) */
(function () {
  "use strict";

  const { Store, formatPrice, escapeHtml, toast, rootPath } = window.CafeUtils;
  window.CustomerLayout.render({ active: "basket" });

  const root = document.getElementById("basketRoot");

  function render() {
    const items = Store.getCartDetailed();

    if (items.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p>장바구니가 비어 있습니다.</p>
          <a href="../menus/list.html" class="btn btn-primary" style="margin-top:1rem">메뉴 보러가기</a>
        </div>`;
      return;
    }

    const total = Store.cartTotal();

    const root2 = rootPath();
    const itemsHtml = items
      .map((it) => {
        const imageSrc = it.menu.imageUrl ? `${root2}${it.menu.imageUrl}` : "";
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
            <span>${Store.cartCount()}개</span>
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

  /* ---------- 이벤트 위임 ---------- */
  root.addEventListener("click", (e) => {
    const itemEl = e.target.closest(".basket-item");

    // 수량 증가/감소
    if (e.target.closest(".js-plus") && itemEl) {
      const id = itemEl.dataset.id;
      const item = Store.getCart().find((i) => i.menuId === id);
      Store.updateCartQty(id, item.qty + 1);
      afterCartChange();
      return;
    }
    if (e.target.closest(".js-minus") && itemEl) {
      const id = itemEl.dataset.id;
      const item = Store.getCart().find((i) => i.menuId === id);
      if (item.qty <= 1) {
        Store.removeFromCart(id);
      } else {
        Store.updateCartQty(id, item.qty - 1);
      }
      afterCartChange();
      return;
    }
    // 삭제
    if (e.target.closest(".js-remove") && itemEl) {
      Store.removeFromCart(itemEl.dataset.id);
      afterCartChange();
      return;
    }
    // 비우기
    if (e.target.closest(".js-clear")) {
      if (Store.cartCount() > 0 && confirm("장바구니를 비우시겠습니까?")) {
        Store.clearCart();
        afterCartChange();
        toast("장바구니를 비웠습니다.");
      }
      return;
    }
    // 주문하기
    if (e.target.closest(".js-order")) {
      const memo = (document.getElementById("memo")?.value || "").trim();
      const order = Store.createOrder({ memo });
      if (!order) {
        toast("장바구니가 비어 있습니다.");
        return;
      }
      window.CustomerLayout.refreshCartBadge();
      toast("주문이 완료되었습니다!");
      setTimeout(() => {
        location.href = `../orders/detail.html?id=${order.id}`;
      }, 700);
      return;
    }
  });

  function afterCartChange() {
    render();
    window.CustomerLayout.refreshCartBadge();
  }

  render();
})();
