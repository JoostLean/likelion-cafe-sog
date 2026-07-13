/* ============================================================
   admin.js — 관리자 공통 레이아웃 렌더링
   각 admin 페이지에서 AdminLayout.render({ active, title }) 호출
   ============================================================ */
(function () {
  "use strict";

  const { Auth, rootPath } = window.CafeUtils;

  /* 사이드바 네비게이션 정의 (key, 라벨, 아이콘, 경로) */
  const NAV = [
    { key: "dashboard", label: "대시보드", ico: "📊", href: "admin/index.html" },
    { key: "menus", label: "메뉴 관리", ico: "🍽️", href: "admin/menus/list.html" },
    { key: "orders", label: "주문 관리", ico: "🧾", href: "admin/orders/list.html" },
  ];

  const AdminLayout = {
    /* active: NAV의 key, title: 헤더 페이지 제목 */
    render({ active = "", title = "" } = {}) {
      const root = rootPath();

      // 관리자 로그인 보장 (가짜 로그인) — 데모 편의를 위해 자동 관리자 세션
      if (!Auth.isAdmin()) {
        Auth.login("사장님", "admin");
      }
      const user = Auth.current();

      const navHtml = NAV.map((item) => {
        const isActive = item.key === active ? " active" : "";
        return `<a href="${root}${item.href}" class="${isActive.trim()}">
            <span class="ico">${item.ico}</span><span>${item.label}</span>
          </a>`;
      }).join("");

      const sidebar = document.querySelector(".admin-sidebar");
      if (sidebar) {
        sidebar.innerHTML = `
          <div class="admin-brand">
            <span class="logo">☕</span>
            <span class="name">SOG Cafe<span class="sub">관리자</span></span>
          </div>
          <nav class="admin-nav">${navHtml}</nav>
          <div class="admin-sidebar-footer">
            <a href="${root}index.html"><span class="ico">🏠</span><span>고객 화면으로</span></a>
          </div>`;
      }

      const header = document.querySelector(".admin-header");
      if (header) {
        header.innerHTML = `
          <h1 class="page-title">${title}</h1>
          <div class="header-actions">
            <span class="admin-user">👤 ${user ? user.name : "관리자"}</span>
          </div>`;
      }
    },
  };

  window.AdminLayout = AdminLayout;
})();
