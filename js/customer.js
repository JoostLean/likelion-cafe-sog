/* ============================================================
   customer.js — 고객 공통 레이아웃 (헤더 + 하단 탭바)
   각 고객 페이지에서 CustomerLayout.render({ active }) 호출
   ============================================================ */
(function () {
  "use strict";

  const { Store, rootPath } = window.CafeUtils;

  /* 하단 탭 정의 */
  const TABS = [
    { key: "home", label: "홈", ico: "🏠", href: "index.html" },
    { key: "menus", label: "메뉴", ico: "🍽️", href: "menus/list.html" },
    { key: "basket", label: "장바구니", ico: "🛒", href: "basket/list.html", badge: true },
    { key: "orders", label: "주문내역", ico: "🧾", href: "orders/list.html" },
    { key: "my", label: "마이", ico: "👤", href: "my/index.html" },
  ];

  const CustomerLayout = {
    render({ active = "" } = {}) {
      const root = rootPath();
      document.body.classList.add("customer");

      const cartCount = Store.cartCount();

      /* ---------- 헤더 ---------- */
      const header = document.querySelector(".cust-header");
      if (header) {
        header.innerHTML = `
          <a href="${root}index.html" class="brand">
            <span class="logo">☕</span><span>SOG Cafe</span>
          </a>
          <div class="header-actions">
            <a href="${root}basket/list.html" class="cart-btn" aria-label="장바구니">
              🛒<span class="cart-count" data-count="${cartCount}">${cartCount || ""}</span>
            </a>
          </div>`;
      }

      /* ---------- 하단 탭바 ---------- */
      const tabbar = document.querySelector(".tabbar");
      if (tabbar) {
        tabbar.innerHTML = TABS.map((t) => {
          const isActive = t.key === active ? " active" : "";
          const badge =
            t.badge && cartCount > 0
              ? `<span class="tab-badge">${cartCount}</span>`
              : "";
          return `<div class="tab-item">
              <a href="${root}${t.href}" class="${isActive.trim()}">
                <span class="tab-ico">${t.ico}</span><span>${t.label}</span>
              </a>${badge}
            </div>`;
        }).join("");
      }
    },

    /* 장바구니 담기 후 헤더/탭바 배지 갱신 */
    refreshCartBadge() {
      const count = Store.cartCount();
      const headerBadge = document.querySelector(".cart-count");
      if (headerBadge) {
        headerBadge.dataset.count = count;
        headerBadge.textContent = count || "";
      }
      const tabBadgeWrap = document.querySelectorAll(".tabbar .tab-item")[2];
      if (tabBadgeWrap) {
        let badge = tabBadgeWrap.querySelector(".tab-badge");
        if (count > 0) {
          if (!badge) {
            badge = document.createElement("span");
            badge.className = "tab-badge";
            tabBadgeWrap.appendChild(badge);
          }
          badge.textContent = count;
        } else if (badge) {
          badge.remove();
        }
      }
    },
  };

  window.CustomerLayout = CustomerLayout;
})();
