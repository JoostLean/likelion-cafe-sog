/* my/index.js — 고객 마이페이지 (프로필 / 통계 / 가짜 로그인·로그아웃) */
(function () {
  "use strict";

  const { Store, Auth, formatPrice, escapeHtml, rootPath, toast } =
    window.CafeUtils;
  window.CustomerLayout.render({ active: "my" });

  const root = document.getElementById("myRoot");
  const rp = rootPath();

  function render() {
    const user = Auth.current();
    user ? renderLoggedIn(user) : renderLoggedOut();
  }

  /* ---------- 로그인 상태 ---------- */
  function renderLoggedIn(user) {
    // 주문 통계 (가짜 인증 데모: 전체 주문 기준)
    const orders = Store.getOrders();
    const activeOrders = orders.filter((o) => o.status !== "canceled");
    const totalSpent = activeOrders.reduce((s, o) => s + o.total, 0);
    const cartCount = Store.cartCount();

    const roleBadge =
      user.role === "admin"
        ? `<span class="role-badge">관리자</span>`
        : "";

    root.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">${user.role === "admin" ? "🧑‍🍳" : "😊"}</div>
        <div class="profile-info">
          <div class="greeting">${escapeHtml(user.name)}님</div>
          <div class="role">반갑습니다 ☕${roleBadge}</div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${orders.length}</div>
          <div class="stat-label">총 주문</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${cartCount}</div>
          <div class="stat-label">장바구니</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatPrice(totalSpent).replace("원", "")}</div>
          <div class="stat-label">누적 금액(원)</div>
        </div>
      </div>

      <div class="menu-links">
        <a href="${rp}orders/list.html" class="menu-link">
          <span class="link-ico">🧾</span><span class="link-label">주문 내역</span><span class="link-arrow">›</span>
        </a>
        <a href="${rp}basket/list.html" class="menu-link">
          <span class="link-ico">🛒</span><span class="link-label">장바구니</span><span class="link-arrow">›</span>
        </a>
        <a href="${rp}menus/list.html" class="menu-link">
          <span class="link-ico">🍽️</span><span class="link-label">메뉴 보기</span><span class="link-arrow">›</span>
        </a>
        ${
          user.role === "admin"
            ? `<a href="${rp}admin/index.html" class="menu-link">
                 <span class="link-ico">🔧</span><span class="link-label">관리자 페이지</span><span class="link-arrow">›</span>
               </a>`
            : ""
        }
      </div>

      <button type="button" class="btn btn-outline logout-btn js-logout">로그아웃</button>`;
  }

  /* ---------- 로그아웃 상태 (로그인 폼) ---------- */
  function renderLoggedOut() {
    root.innerHTML = `
      <div class="login-card">
        <div class="login-emoji">👋</div>
        <h2>로그인이 필요해요</h2>
        <p>이름을 입력하고 SOG Cafe를 시작하세요.<br />(데모용 간편 로그인)</p>
        <form class="login-form" id="loginForm">
          <input type="text" id="nameInput" class="input" placeholder="이름을 입력하세요" required />
          <div class="role-toggle" id="roleToggle">
            <button type="button" class="chip active" data-role="customer">고객</button>
            <button type="button" class="chip" data-role="admin">관리자</button>
          </div>
          <button type="submit" class="btn btn-primary btn-block">시작하기</button>
        </form>
      </div>`;

    const form = document.getElementById("loginForm");
    const roleToggle = document.getElementById("roleToggle");
    let role = "customer";

    roleToggle.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      role = btn.dataset.role;
      roleToggle
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.toggle("active", c === btn));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("nameInput").value.trim();
      if (!name) {
        document.getElementById("nameInput").classList.add("invalid");
        return;
      }
      Auth.login(name, role);
      toast(`${name}님, 환영합니다!`);
      render();
    });
  }

  /* ---------- 로그아웃 (이벤트 위임) ---------- */
  root.addEventListener("click", (e) => {
    if (!e.target.closest(".js-logout")) return;
    if (confirm("로그아웃 하시겠습니까?")) {
      Auth.logout();
      toast("로그아웃되었습니다.");
      render();
    }
  });

  render();
})();
