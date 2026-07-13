/* my/index.js — 고객 마이페이지 (프로필 / 통계 / 로그인·회원가입·로그아웃)
   Supabase Authentication (이메일 + 비밀번호) 사용 */
(function () {
  "use strict";

  const { Store, Auth, formatPrice, escapeHtml, rootPath, toast } =
    window.CafeUtils;

  const root = document.getElementById("myRoot");
  const rp = rootPath();

  async function render() {
    const profile = await Auth.currentProfile();
    profile ? await renderLoggedIn(profile) : renderLoggedOut();
  }

  /* ---------- 로그인 상태 ---------- */
  async function renderLoggedIn(user) {
    // 주문 통계 (RLS: 본인 주문만 조회됨)
    const [orders, cartCount] = await Promise.all([
      Store.getOrders(),
      Store.cartCount(),
    ]);
    const activeOrders = orders.filter((o) => o.status !== "canceled");
    const totalSpent = activeOrders.reduce((s, o) => s + o.total, 0);

    const roleBadge =
      user.role === "admin" ? `<span class="role-badge">관리자</span>` : "";

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

  /* ---------- 로그아웃 상태 (로그인 / 회원가입 폼) ---------- */
  function renderLoggedOut() {
    let mode = "login"; // 'login' | 'signup'

    function paint() {
      const isSignup = mode === "signup";
      root.innerHTML = `
        <div class="login-card">
          <div class="login-emoji">👋</div>
          <h2>${isSignup ? "회원가입" : "로그인"}</h2>
          <p>${
            isSignup
              ? "이메일과 비밀번호로 가입하고 Cafe SOG를 시작하세요."
              : "이메일과 비밀번호로 로그인하세요."
          }</p>
          <form class="login-form" id="authForm">
            ${
              isSignup
                ? `<input type="text" id="nameInput" class="input" placeholder="이름" autocomplete="name" required />`
                : ""
            }
            <input type="email" id="emailInput" class="input" placeholder="이메일" autocomplete="email" required />
            <input type="password" id="pwInput" class="input" placeholder="비밀번호 (6자 이상)" autocomplete="${
              isSignup ? "new-password" : "current-password"
            }" minlength="6" required />
            <div class="field-error" id="authError" style="color:#c0392b;min-height:1.2em"></div>
            <button type="submit" class="btn btn-primary btn-block" id="submitBtn">
              ${isSignup ? "가입하기" : "로그인"}
            </button>
          </form>
          <button type="button" class="btn btn-ghost btn-block js-toggle-mode" style="margin-top:.5rem">
            ${isSignup ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
          </button>
        </div>`;

      const form = document.getElementById("authForm");
      const errEl = document.getElementById("authError");
      const submitBtn = document.getElementById("submitBtn");

      root.querySelector(".js-toggle-mode").addEventListener("click", () => {
        mode = isSignup ? "login" : "signup";
        paint();
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errEl.textContent = "";
        const email = document.getElementById("emailInput").value.trim();
        const password = document.getElementById("pwInput").value;

        submitBtn.disabled = true;
        submitBtn.textContent = "처리 중…";

        try {
          if (isSignup) {
            const name = document.getElementById("nameInput").value.trim();
            const result = await Auth.signUp({ email, password, name });
            // 이메일 확인이 꺼져 있으면 세션이 바로 생김. 켜져 있으면 확인 필요.
            if (result.session) {
              toast(`${name}님, 환영합니다!`);
              await render();
            } else {
              errEl.style.color = "#2e7d32";
              errEl.textContent =
                "가입 완료! 이메일 인증 후 로그인해주세요.";
              submitBtn.disabled = false;
              submitBtn.textContent = "가입하기";
              mode = "login";
            }
          } else {
            await Auth.signIn({ email, password });
            toast("로그인되었습니다.");
            await render();
          }
        } catch (err) {
          errEl.style.color = "#c0392b";
          errEl.textContent = translateAuthError(err);
          submitBtn.disabled = false;
          submitBtn.textContent = isSignup ? "가입하기" : "로그인";
        }
      });
    }

    paint();
  }

  /* Supabase 인증 에러 메시지 한글화 */
  function translateAuthError(err) {
    const msg = (err && err.message) || "";
    if (/Invalid login credentials/i.test(msg))
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (/User already registered/i.test(msg))
      return "이미 가입된 이메일입니다. 로그인해주세요.";
    if (/Password should be at least/i.test(msg))
      return "비밀번호는 6자 이상이어야 합니다.";
    if (/valid email/i.test(msg)) return "올바른 이메일 형식이 아닙니다.";
    return msg || "요청을 처리하지 못했습니다.";
  }

  /* ---------- 로그아웃 (이벤트 위임) ---------- */
  root.addEventListener("click", async (e) => {
    if (!e.target.closest(".js-logout")) return;
    if (confirm("로그아웃 하시겠습니까?")) {
      await Auth.logout();
      toast("로그아웃되었습니다.");
      await render();
      await window.CustomerLayout.refreshCartBadge();
    }
  });

  (async function init() {
    await window.CustomerLayout.render({ active: "my" });
    await render();
  })();
})();
