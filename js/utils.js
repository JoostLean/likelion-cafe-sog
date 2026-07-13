/* ============================================================
   utils.js — 공통 유틸리티 & 데이터 접근 계층(DAO)
   ------------------------------------------------------------
   설계 원칙:
   - 모든 데이터 접근을 이 파일의 Store.* / Auth.* 함수로 감싼다.
   - 페이지 코드는 Supabase 클라이언트를 직접 만지지 않는다.
   - Store.* / Auth.* 는 전부 async (Promise 반환) 이다.
   전역 노출: window.CafeUtils
   ============================================================ */
(function () {
  "use strict";

  const sb = window.CAFE_SUPABASE;
  if (!sb) {
    console.error("[CafeUtils] Supabase 클라이언트가 없습니다. supabase.js 로드 순서를 확인하세요.");
  }

  /* ============================================================
     행 매핑 — DB snake_case → 앱 camelCase
     (기존 페이지 템플릿이 쓰던 필드명을 그대로 유지)
     ============================================================ */
  function mapMenu(row) {
    if (!row) return null;
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description || "",
      price: row.price,
      emoji: row.emoji,
      imageUrl: row.image_url || "",
      gradient: row.gradient,
      badges: row.badges || [],
      soldOut: row.sold_out,
      createdAt: row.created_at,
    };
  }

  function mapOrder(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      customer: row.customer,
      total: row.total,
      status: row.status,
      memo: row.memo || "",
      createdAt: row.created_at,
      items: (row.order_items || []).map((it) => ({
        menuId: it.menu_id,
        name: it.name,
        emoji: it.emoji,
        imageUrl: it.image_url || "",
        price: it.price,
        qty: it.qty,
      })),
    };
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
    const parts = window.location.pathname.split("/").filter(Boolean);
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

  function statusBadge(status) {
    const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
    return `<span class="badge ${s.className}">${s.label}</span>`;
  }

  /* ============================================================
     Store — 데이터 접근 계층 (Supabase)
     모든 메서드는 async
     ============================================================ */
  const Store = {
    /* ---------- 카테고리 ---------- */
    async getCategories() {
      const { data, error } = await sb
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("[Store.getCategories]", error);
        return [];
      }
      return data;
    },

    /* ---------- 메뉴 ---------- */
    async getMenus() {
      const { data, error } = await sb
        .from("menus")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[Store.getMenus]", error);
        return [];
      }
      return data.map(mapMenu);
    },
    async getMenu(id) {
      const { data, error } = await sb
        .from("menus")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("[Store.getMenu]", error);
        return null;
      }
      return mapMenu(data);
    },
    async createMenu(data) {
      const row = {
        category_id: data.categoryId,
        name: data.name,
        description: data.description || "",
        price: Number(data.price) || 0,
        emoji: data.emoji || "☕",
        image_url: data.imageUrl || "",
        gradient: data.gradient || "linear-gradient(135deg, #f3e9dd, #c8a27c)",
        badges: data.badges || [],
        sold_out: !!data.soldOut,
      };
      const { data: inserted, error } = await sb
        .from("menus")
        .insert(row)
        .select()
        .single();
      if (error) {
        console.error("[Store.createMenu]", error);
        throw error;
      }
      return mapMenu(inserted);
    },
    async updateMenu(id, patch) {
      const row = {};
      if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.price !== undefined) row.price = Number(patch.price) || 0;
      if (patch.emoji !== undefined) row.emoji = patch.emoji;
      if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
      if (patch.gradient !== undefined) row.gradient = patch.gradient;
      if (patch.badges !== undefined) row.badges = patch.badges;
      if (patch.soldOut !== undefined) row.sold_out = !!patch.soldOut;

      const { data: updated, error } = await sb
        .from("menus")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("[Store.updateMenu]", error);
        throw error;
      }
      return mapMenu(updated);
    },
    async deleteMenu(id) {
      const { error } = await sb.from("menus").delete().eq("id", id);
      if (error) {
        console.error("[Store.deleteMenu]", error);
        throw error;
      }
    },

    /* ---------- 장바구니 (cart_items 테이블, 로그인 필요) ----------
       반환 형태(raw): [{ menuId, qty }] */
    async getCart() {
      const user = await Auth.current();
      if (!user) return [];
      const { data, error } = await sb
        .from("cart_items")
        .select("menu_id, qty")
        .eq("user_id", user.id);
      if (error) {
        console.error("[Store.getCart]", error);
        return [];
      }
      return data.map((r) => ({ menuId: r.menu_id, qty: r.qty }));
    },
    /* 메뉴 정보를 조인한 상세 장바구니 */
    async getCartDetailed() {
      const user = await Auth.current();
      if (!user) return [];
      const { data, error } = await sb
        .from("cart_items")
        .select("qty, menu:menus(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[Store.getCartDetailed]", error);
        return [];
      }
      return data
        .filter((r) => r.menu)
        .map((r) => {
          const menu = mapMenu(r.menu);
          return {
            menuId: menu.id,
            qty: r.qty,
            menu,
            lineTotal: menu.price * r.qty,
          };
        });
    },
    async cartCount() {
      const cart = await this.getCart();
      return cart.reduce((sum, i) => sum + i.qty, 0);
    },
    async cartTotal() {
      const detailed = await this.getCartDetailed();
      return detailed.reduce((sum, i) => sum + i.lineTotal, 0);
    },
    async addToCart(menuId, qty = 1) {
      const user = await Auth.current();
      if (!user) throw new Error("NOT_LOGGED_IN");
      // 기존 수량 조회 후 증가 (upsert)
      const { data: existing } = await sb
        .from("cart_items")
        .select("qty")
        .eq("user_id", user.id)
        .eq("menu_id", menuId)
        .maybeSingle();
      const newQty = (existing ? existing.qty : 0) + qty;
      const { error } = await sb
        .from("cart_items")
        .upsert(
          { user_id: user.id, menu_id: menuId, qty: newQty },
          { onConflict: "user_id,menu_id" }
        );
      if (error) {
        console.error("[Store.addToCart]", error);
        throw error;
      }
    },
    async updateCartQty(menuId, qty) {
      const user = await Auth.current();
      if (!user) return;
      const nextQty = Math.max(1, qty);
      const { error } = await sb
        .from("cart_items")
        .update({ qty: nextQty })
        .eq("user_id", user.id)
        .eq("menu_id", menuId);
      if (error) console.error("[Store.updateCartQty]", error);
    },
    async removeFromCart(menuId) {
      const user = await Auth.current();
      if (!user) return;
      const { error } = await sb
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("menu_id", menuId);
      if (error) console.error("[Store.removeFromCart]", error);
    },
    async clearCart() {
      const user = await Auth.current();
      if (!user) return;
      const { error } = await sb
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) console.error("[Store.clearCart]", error);
    },

    /* ---------- 주문 ---------- */
    async getOrders() {
      // RLS: 고객은 본인 주문만, 관리자는 전체
      const { data, error } = await sb
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[Store.getOrders]", error);
        return [];
      }
      return data.map(mapOrder);
    },
    async getOrder(id) {
      const { data, error } = await sb
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("[Store.getOrder]", error);
        return null;
      }
      return mapOrder(data);
    },
    async createOrder({ memo = "" } = {}) {
      const user = await Auth.current();
      if (!user) throw new Error("NOT_LOGGED_IN");

      const detailed = await this.getCartDetailed();
      if (detailed.length === 0) return null;

      const total = detailed.reduce((s, d) => s + d.lineTotal, 0);
      const profile = await Auth.currentProfile();

      // 1) 주문 헤더 생성
      const { data: order, error: orderErr } = await sb
        .from("orders")
        .insert({
          user_id: user.id,
          customer: profile ? profile.name : "손님",
          total,
          status: "pending",
          memo,
        })
        .select()
        .single();
      if (orderErr) {
        console.error("[Store.createOrder:order]", orderErr);
        throw orderErr;
      }

      // 2) 주문 항목 (메뉴 스냅샷) 생성
      const itemRows = detailed.map((d) => ({
        order_id: order.id,
        menu_id: d.menu.id,
        name: d.menu.name,
        emoji: d.menu.emoji,
        image_url: d.menu.imageUrl,
        price: d.menu.price,
        qty: d.qty,
      }));
      const { error: itemsErr } = await sb.from("order_items").insert(itemRows);
      if (itemsErr) {
        console.error("[Store.createOrder:items]", itemsErr);
        throw itemsErr;
      }

      // 3) 장바구니 비우기
      await this.clearCart();

      return await this.getOrder(order.id);
    },
    async updateOrderStatus(id, status) {
      const { data, error } = await sb
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select("*, order_items(*)")
        .maybeSingle();
      if (error) {
        console.error("[Store.updateOrderStatus]", error);
        throw error;
      }
      return mapOrder(data);
    },
  };

  /* ============================================================
     Auth — Supabase Authentication (이메일 + 비밀번호)
     ============================================================ */
  let _profileCache = null;

  const Auth = {
    /* 현재 로그인한 auth 유저 (없으면 null) */
    async current() {
      const { data, error } = await sb.auth.getUser();
      if (error || !data || !data.user) return null;
      return data.user;
    },

    /* 현재 유저의 profiles 행 (name, role 포함) */
    async currentProfile() {
      const user = await this.current();
      if (!user) {
        _profileCache = null;
        return null;
      }
      if (_profileCache && _profileCache.id === user.id) return _profileCache;
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("[Auth.currentProfile]", error);
        return null;
      }
      _profileCache = data;
      return data;
    },

    async isLoggedIn() {
      return !!(await this.current());
    },

    async isAdmin() {
      const profile = await this.currentProfile();
      return !!profile && profile.role === "admin";
    },

    /* 회원가입 — 이메일/비밀번호 + 이름, 역할 */
    async signUp({ email, password, name, role = "customer" }) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { name: name || "손님", role } },
      });
      if (error) throw error;
      _profileCache = null;
      return data;
    },

    /* 로그인 — 이메일/비밀번호 */
    async signIn({ email, password }) {
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      _profileCache = null;
      return data;
    },

    async logout() {
      _profileCache = null;
      await sb.auth.signOut();
    },

    /* 인증 상태 변화 구독 (선택) */
    onChange(cb) {
      return sb.auth.onAuthStateChange((_event, session) => {
        _profileCache = null;
        cb(session);
      });
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

  /* ---------- 전역 노출 ---------- */
  window.CafeUtils = {
    sb,
    Store,
    Auth,
    ORDER_STATUS,
    statusBadge,
    formatPrice,
    formatDate,
    escapeHtml,
    getParam,
    rootPath,
    toast,
  };
})();
