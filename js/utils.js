/* ============================================================
   utils.js — 공통 유틸리티 & 데이터 접근 계층(DAO)
   ------------------------------------------------------------
   설계 원칙:
   - 모든 데이터 접근을 이 파일의 Store.* 함수로 감싼다.
   - 페이지 코드는 localStorage를 직접 만지지 않는다.
   - 추후 Supabase 연동 시, Store.* 내부 구현만 async API 호출로 교체.
   전역 노출: window.CafeUtils
   ============================================================ */
(function () {
  "use strict";

  /* ---------- localStorage 키 ---------- */
  const KEYS = {
    MENUS: "cafe.menus",
    CATEGORIES: "cafe.categories",
    CART: "cafe.cart",
    ORDERS: "cafe.orders",
    AUTH: "cafe.auth",
    SEEDED: "cafe.seeded.v1",
  };

  /* ============================================================
     저수준 storage 헬퍼
     ============================================================ */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn("[CafeUtils] read 실패:", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("[CafeUtils] write 실패:", key, e);
    }
  }

  /* ============================================================
     시드 초기화 — 최초 1회 메뉴/카테고리 주입
     ============================================================ */
  function ensureSeeded() {
    if (localStorage.getItem(KEYS.SEEDED)) return;
    const seed = window.CAFE_SEED || { categories: [], menus: [] };
    write(KEYS.CATEGORIES, seed.categories);
    write(KEYS.MENUS, seed.menus);
    localStorage.setItem(KEYS.SEEDED, "1");
  }

  /* ============================================================
     포맷 유틸
     ============================================================ */
  function formatPrice(won) {
    const n = Number(won) || 0;
    return n.toLocaleString("ko-KR") + "원";
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${hh}:${mm}`;
  }

  function genId(prefix) {
    return (
      (prefix || "id") +
      "-" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  /* HTML 이스케이프 (사용자 입력 렌더링 시 XSS 방지) */
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  /* URL 쿼리 파라미터 읽기 */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* 현재 페이지 깊이에 맞는 루트 상대경로 계산
     예: /admin/menus/list.html 에서 rootPath() -> "../../" */
  function rootPath() {
    const parts = window.location.pathname
      .split("/")
      .filter(Boolean);
    // 마지막은 파일명(.html)이므로 제외 → 남은 디렉토리 개수만큼 상위로
    const depth = Math.max(parts.length - 1, 0);
    return depth === 0 ? "./" : "../".repeat(depth);
  }

  /* ============================================================
     주문 상태 정의
     ============================================================ */
  const ORDER_STATUS = {
    pending: { label: "접수 대기", className: "status-pending" },
    progress: { label: "준비 중", className: "status-progress" },
    done: { label: "완료", className: "status-done" },
    canceled: { label: "취소", className: "status-canceled" },
  };

  /* ============================================================
     Store — 데이터 접근 계층 (추후 Supabase로 교체 지점)
     ============================================================ */
  const Store = {
    /* ---------- 카테고리 ---------- */
    getCategories() {
      return read(KEYS.CATEGORIES, []);
    },

    /* ---------- 메뉴 ---------- */
    getMenus() {
      return read(KEYS.MENUS, []);
    },
    getMenu(id) {
      return this.getMenus().find((m) => m.id === id) || null;
    },
    createMenu(data) {
      const menus = this.getMenus();
      const menu = {
        id: genId("m"),
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || "",
        price: Number(data.price) || 0,
        emoji: data.emoji || "☕",
        gradient:
          data.gradient || "linear-gradient(135deg, #f3e9dd, #c8a27c)",
        badges: data.badges || [],
        soldOut: !!data.soldOut,
        createdAt: new Date().toISOString(),
      };
      menus.push(menu);
      write(KEYS.MENUS, menus);
      return menu;
    },
    updateMenu(id, patch) {
      const menus = this.getMenus();
      const idx = menus.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      menus[idx] = { ...menus[idx], ...patch, id };
      if (patch.price !== undefined) menus[idx].price = Number(patch.price) || 0;
      write(KEYS.MENUS, menus);
      return menus[idx];
    },
    deleteMenu(id) {
      const menus = this.getMenus().filter((m) => m.id !== id);
      write(KEYS.MENUS, menus);
    },

    /* ---------- 장바구니 ----------
       cart: [{ menuId, qty, options }] */
    getCart() {
      return read(KEYS.CART, []);
    },
    getCartDetailed() {
      const menus = this.getMenus();
      return this.getCart()
        .map((item) => {
          const menu = menus.find((m) => m.id === item.menuId);
          if (!menu) return null;
          return {
            ...item,
            menu,
            lineTotal: menu.price * item.qty,
          };
        })
        .filter(Boolean);
    },
    cartCount() {
      return this.getCart().reduce((sum, i) => sum + i.qty, 0);
    },
    cartTotal() {
      return this.getCartDetailed().reduce((sum, i) => sum + i.lineTotal, 0);
    },
    addToCart(menuId, qty = 1) {
      const cart = this.getCart();
      const existing = cart.find((i) => i.menuId === menuId);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ menuId, qty });
      }
      write(KEYS.CART, cart);
      return cart;
    },
    updateCartQty(menuId, qty) {
      const cart = this.getCart();
      const item = cart.find((i) => i.menuId === menuId);
      if (!item) return;
      item.qty = Math.max(1, qty);
      write(KEYS.CART, cart);
    },
    removeFromCart(menuId) {
      write(KEYS.CART, this.getCart().filter((i) => i.menuId !== menuId));
    },
    clearCart() {
      write(KEYS.CART, []);
    },

    /* ---------- 주문 ----------
       order: { id, items, total, status, createdAt, customer, memo } */
    getOrders() {
      return read(KEYS.ORDERS, []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    },
    getOrder(id) {
      return this.getOrders().find((o) => o.id === id) || null;
    },
    createOrder({ memo = "" } = {}) {
      const detailed = this.getCartDetailed();
      if (detailed.length === 0) return null;
      const auth = Auth.current();
      const order = {
        id: genId("o"),
        items: detailed.map((d) => ({
          menuId: d.menu.id,
          name: d.menu.name,
          emoji: d.menu.emoji,
          price: d.menu.price,
          qty: d.qty,
        })),
        total: this.cartTotal(),
        status: "pending",
        memo,
        customer: auth ? auth.name : "손님",
        createdAt: new Date().toISOString(),
      };
      const orders = read(KEYS.ORDERS, []);
      orders.push(order);
      write(KEYS.ORDERS, orders);
      this.clearCart();
      return order;
    },
    updateOrderStatus(id, status) {
      const orders = read(KEYS.ORDERS, []);
      const order = orders.find((o) => o.id === id);
      if (!order) return null;
      order.status = status;
      write(KEYS.ORDERS, orders);
      return order;
    },
  };

  /* ============================================================
     Auth — 가짜 로그인 (추후 Supabase Auth로 교체 지점)
     ============================================================ */
  const Auth = {
    current() {
      return read(KEYS.AUTH, null);
    },
    isLoggedIn() {
      return !!this.current();
    },
    isAdmin() {
      const u = this.current();
      return !!u && u.role === "admin";
    },
    login(name, role = "customer") {
      const user = { id: genId("u"), name: name || "손님", role };
      write(KEYS.AUTH, user);
      return user;
    },
    logout() {
      localStorage.removeItem(KEYS.AUTH);
    },
  };

  /* ============================================================
     Toast — 간단한 알림
     ============================================================ */
  function toast(message) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ============================================================
     초기화 — 스크립트 로드 시 시드 보장
     ============================================================ */
  ensureSeeded();

  /* ---------- 전역 노출 ---------- */
  window.CafeUtils = {
    KEYS,
    Store,
    Auth,
    ORDER_STATUS,
    formatPrice,
    formatDate,
    genId,
    escapeHtml,
    getParam,
    rootPath,
    toast,
  };
})();
