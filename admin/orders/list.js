/* admin/orders/list.js — 관리자 주문 목록 (상태 필터 / 인라인 상태 변경) */
(function () {
  "use strict";

  const { Store, formatPrice, formatDate, statusBadge, escapeHtml, ORDER_STATUS, toast } =
    window.CafeUtils;

  const tbody = document.getElementById("orderTableBody");
  const emptyState = document.getElementById("emptyState");
  const chipGroup = document.getElementById("statusChips");

  let activeStatus = "all";
  let allOrders = []; // 인메모리 보관

  /* ---------- 상태 필터 칩 (건수 포함) ---------- */
  function renderChips() {
    const counts = { all: allOrders.length };
    Object.keys(ORDER_STATUS).forEach((k) => {
      counts[k] = allOrders.filter((o) => o.status === k).length;
    });

    const chips = [
      { id: "all", label: "전체" },
      ...Object.keys(ORDER_STATUS).map((k) => ({
        id: k,
        label: ORDER_STATUS[k].label,
      })),
    ];

    chipGroup.innerHTML = chips
      .map(
        (c) =>
          `<button class="chip${c.id === activeStatus ? " active" : ""}" data-status="${c.id}">${c.label} <b>${counts[c.id]}</b></button>`
      )
      .join("");
  }

  /* ---------- 테이블 ---------- */
  function renderTable() {
    let orders = allOrders;
    if (activeStatus !== "all") {
      orders = orders.filter((o) => o.status === activeStatus);
    }

    if (orders.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    tbody.innerHTML = orders
      .map((o) => {
        const first = o.items[0];
        const rest = o.items.length - 1;
        const menuSummary = !first
          ? "-"
          : rest > 0
          ? `${escapeHtml(first.name)} <span class="more">외 ${rest}건</span>`
          : escapeHtml(first.name);

        const options = Object.keys(ORDER_STATUS)
          .map(
            (k) =>
              `<option value="${k}"${k === o.status ? " selected" : ""}>${ORDER_STATUS[k].label}</option>`
          )
          .join("");

        return `
          <tr data-id="${o.id}">
            <td><span class="order-num-cell">${escapeHtml(o.id)}</span></td>
            <td>${escapeHtml(o.customer)}</td>
            <td class="order-menu-cell"><span class="menu-summary">${menuSummary}</span></td>
            <td class="order-price-cell">${formatPrice(o.total)}</td>
            <td>${formatDate(o.createdAt)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>
              <div class="row-actions">
                <select class="status-select js-status">${options}</select>
                <a href="detail.html?id=${o.id}" class="btn btn-outline btn-sm">상세</a>
              </div>
            </td>
          </tr>`;
      })
      .join("");
  }

  /* ---------- 이벤트 ---------- */
  chipGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeStatus = btn.dataset.status;
    renderChips();
    renderTable();
  });

  tbody.addEventListener("change", async (e) => {
    const sel = e.target.closest(".js-status");
    if (!sel) return;
    const id = e.target.closest("tr").dataset.id;
    try {
      await Store.updateOrderStatus(id, sel.value);
    } catch (err) {
      toast("상태 변경에 실패했습니다.");
      return;
    }
    // 인메모리 상태 갱신
    const target = allOrders.find((o) => o.id === id);
    if (target) target.status = sel.value;
    toast(`주문 상태를 '${ORDER_STATUS[sel.value].label}'(으)로 변경했습니다.`);
    renderChips();
    renderTable();
  });

  /* ---------- 초기 렌더 ---------- */
  (async function init() {
    const ok = await window.AdminLayout.render({ active: "orders", title: "주문 관리" });
    if (!ok) return;

    allOrders = await Store.getOrders();
    renderChips();
    renderTable();
  })();
})();
