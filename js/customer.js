/* ============================================================
   customer.js — 고객 공통 레이아웃 (상단 헤더 네비 + 하단 탭바)
   각 고객 페이지에서 CustomerLayout.render({ active }) 호출
   - PC: 상단 헤더에 가로 네비 (하단 탭바 숨김)
   - 모바일: 하단 탭바 (헤더 가로 네비 숨김)
   ============================================================ */
(function () {
  "use strict";

  const { Store, rootPath } = window.CafeUtils;

  /* 네비 정의 (헤더 네비 + 하단 탭바 공용) */
  const NAV = [
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

      /* ---------- 헤더 (브랜드 + PC 가로 네비 + 장바구니) ---------- */
      const header = document.querySelector(".cust-header");
      if (header) {
        const navLinks = NAV.map((t) => {
          const isActive = t.key === active ? " active" : "";
          const badge =
            t.badge && cartCount > 0
              ? `<span class="nav-badge">${cartCount}</span>`
              : "";
          return `<a href="${root}${t.href}" class="nav-link${isActive}">
              <span class="nav-ico">${t.ico}</span><span>${t.label}</span>${badge}
            </a>`;
        }).join("");

        header.innerHTML = `
          <a href="${root}index.html" class="brand">
            <span class="logo">☕</span><span>SOG Cafe</span>
          </a>
          <nav class="header-nav">${navLinks}</nav>
          <div class="header-actions">
            <a href="${root}basket/list.html" class="cart-btn" aria-label="장바구니">
              🛒<span class="cart-count" data-count="${cartCount}">${cartCount || ""}</span>
            </a>
          </div>`;
      }

      /* ---------- 하단 탭바 (모바일) ---------- */
      const tabbar = document.querySelector(".tabbar");
      if (tabbar) {
        tabbar.innerHTML = NAV.map((t) => {
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

      /* ---------- 푸터 ---------- */
      const footer = document.querySelector(".site-footer");
      if (footer) {
        footer.innerHTML = `
          <div class="footer-inner">
            <div class="footer-top">
              <div class="footer-about">
                <div class="footer-brand"><span>☕</span><span>SOG Cafe</span></div>
                <p class="footer-desc">
                  정성껏 내린 커피와 계절의 디저트로 하루의 쉼표를 만듭니다.
                  따뜻한 공간에서 좋은 시간 보내세요.
                </p>
                <div class="footer-social">
                  <a href="#" aria-label="Instagram">📷</a>
                  <a href="#" aria-label="Blog">✍️</a>
                  <a href="#" aria-label="Map">📍</a>
                </div>
              </div>
              <div class="footer-col">
                <h4>Menu</h4>
                <ul>
                  <li><a href="${root}menus/list.html">전체 메뉴</a></li>
                  <li><a href="${root}basket/list.html">장바구니</a></li>
                  <li><a href="${root}orders/list.html">주문 내역</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4>Visit</h4>
                <ul>
                  <li>서울 마포구 어딘가 12길 3</li>
                  <li>매일 10:00 – 22:00</li>
                  <li>연중무휴</li>
                </ul>
              </div>
            </div>
            <div class="footer-bottom">
              <span>© 2026 SOG Cafe. All rights reserved.</span>
              <span>Made with ☕ for BE26 likelion</span>
            </div>
          </div>`;
      }
    },

    /* 장바구니 담기 후 헤더/탭바 배지 갱신 */
    refreshCartBadge() {
      const count = Store.cartCount();

      // 헤더 우측 장바구니 아이콘 배지
      const headerBadge = document.querySelector(".cart-count");
      if (headerBadge) {
        headerBadge.dataset.count = count;
        headerBadge.textContent = count || "";
      }

      // 헤더 네비의 장바구니 링크 배지 (PC)
      updateNavBadge(
        document.querySelector('.header-nav .nav-link[href$="basket/list.html"]'),
        count,
        "nav-badge"
      );

      // 하단 탭바 장바구니 배지 (모바일)
      const tabItem = document.querySelectorAll(".tabbar .tab-item")[2];
      updateTabBadge(tabItem, count);
    },
  };

  /* 헤더 네비 배지: 링크 내부에 span 추가/갱신/제거 */
  function updateNavBadge(link, count, cls) {
    if (!link) return;
    let badge = link.querySelector("." + cls);
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = cls;
        link.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }

  /* 탭바 배지: tab-item 내부에 span 추가/갱신/제거 */
  function updateTabBadge(tabItem, count) {
    if (!tabItem) return;
    let badge = tabItem.querySelector(".tab-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tab-badge";
        tabItem.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }

  window.CustomerLayout = CustomerLayout;
})();
