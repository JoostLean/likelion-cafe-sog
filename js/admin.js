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
    /* active: NAV의 key, title: 헤더 페이지 제목
       반환: 관리자 인증 통과 시 true, 아니면 false(리다이렉트됨) */
    async render({ active = "", title = "" } = {}) {
      const root = rootPath();

      // 실제 관리자 권한 검사 (profiles.role === 'admin')
      const profile = await Auth.currentProfile();
      if (!profile) {
        // 미로그인 → 로그인 페이지로
        alert("관리자 로그인이 필요합니다.");
        location.href = `${root}my/index.html`;
        return false;
      }
      if (profile.role !== "admin") {
        alert("관리자 권한이 없습니다.");
        location.href = `${root}index.html`;
        return false;
      }
      const user = profile;

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
            <span class="name">Cafe SOG<span class="sub">관리자</span></span>
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
      return true;
    },
  };

  window.AdminLayout = AdminLayout;
})();
