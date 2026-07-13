/* ============================================================
   supabase.js — Supabase 클라이언트 초기화
   ------------------------------------------------------------
   - @supabase/supabase-js UMD 빌드가 먼저 로드되어 있어야 함
     (HTML에서 CDN <script>로 window.supabase 노출)
   - publishable(anon) 키는 공개되어도 안전한 키 (RLS로 보호)
   전역 노출: window.CAFE_SUPABASE
   ============================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://fkxlwxdvmwkpiqzsgqxa.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_zkVd8CEL-zd0i4GQorY3KA__yfAxbfc";

  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      "[Cafe] supabase-js 라이브러리가 로드되지 않았습니다. CDN <script> 순서를 확인하세요."
    );
    return;
  }

  window.CAFE_SUPABASE = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "cafe.sb.auth",
      },
    }
  );
})();
