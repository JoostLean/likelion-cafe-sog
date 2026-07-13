/* admin/index.js — 관리자 대시보드 (통계 / 최근 주문 / 인기 메뉴) */
(function () {
  "use strict";

  const { Store, formatPrice, statusBadge, escapeHtml } = window.CafeUtils;

  (async function init() {
    const ok = await window.AdminLayout.render({ active: "dashboard", title: "대시보드" });
    if (!ok) return;

    const [orders, menus] = await Promise.all([
      Store.getOrders(),
      Store.getMenus(),
    ]);

    /* ---------- 통계 계산 ---------- */
  const activeOrders = orders.filter((o) => o.status !== "canceled");
  const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "progress"
  ).length;

  const stats = [
    { icon: "🧾", value: orders.length, label: "총 주문" },
    { icon: "⏳", value: pendingCount, label: "처리 대기/진행" },
    { icon: "💰", value: formatPrice(totalRevenue), label: "총 매출" },
    { icon: "🍽️", value: menus.length, label: "등록 메뉴" },
  ];

  document.getElementById("statGrid").innerHTML = stats
    .map(
      (s) => `
      <div class="stat-card">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-body">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      </div>`
    )
    .join("");

  /* ---------- 최근 주문 (5건) ---------- */
  const recentBody = document.getElementById("recentOrdersBody");
  const recent = orders.slice(0, 5);
  if (recent.length === 0) {
    document.getElementById("recentEmpty").classList.remove("hidden");
  } else {
    recentBody.innerHTML = recent
      .map(
        (o) => `
        <tr>
          <td><span class="recent-order-num">${escapeHtml(o.id)}</span></td>
          <td>${escapeHtml(o.customer)}</td>
          <td>${formatPrice(o.total)}</td>
          <td>${statusBadge(o.status)}</td>
          <td><a href="orders/detail.html?id=${o.id}" class="btn btn-outline btn-sm">보기</a></td>
        </tr>`
      )
      .join("");
  }

  /* ---------- 많이 팔린 메뉴 TOP 5 (취소 제외) ---------- */
  const countMap = {};
  activeOrders.forEach((o) => {
    o.items.forEach((it) => {
      if (!countMap[it.menuId]) {
        countMap[it.menuId] = { name: it.name, emoji: it.emoji, qty: 0 };
      }
      countMap[it.menuId].qty += it.qty;
    });
  });
  const top = Object.values(countMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const topList = document.getElementById("topMenus");
  if (top.length === 0) {
    document.getElementById("topEmpty").classList.remove("hidden");
  } else {
    topList.innerHTML = top
      .map(
        (m, i) => `
        <li class="top-menu-item">
          <span class="rank">${i + 1}</span>
          <div class="t-thumb" style="background:var(--color-cream)">${m.emoji}</div>
          <div class="t-info">
            <div class="t-name">${escapeHtml(m.name)}</div>
            <div class="t-count">${m.qty}잔 판매</div>
          </div>
        </li>`
      )
      .join("");
    }
  })();
})();
