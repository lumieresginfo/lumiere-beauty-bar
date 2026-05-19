-- ═══════════════════════════════════════════════════════════════════════════
-- Lumière Beauty Bar — Supabase Schema
--
-- 使用方式：
-- 1. 到 Supabase 後台你的專案 → 左側選單 SQL Editor
-- 2. 點 + New query
-- 3. 整個檔案內容貼進去
-- 4. 點 Run（或按 Cmd/Ctrl + Enter）
-- 5. 看到「Success. No rows returned」就完成了
-- ═══════════════════════════════════════════════════════════════════════════

-- 單一 key-value 表，每個使用者一份
create table if not exists public.kv_store (
  user_id    uuid not null references auth.users on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 啟用 Row Level Security（資料層級權限）
alter table public.kv_store enable row level security;

-- 政策：每個使用者只能讀寫自己的資料
drop policy if exists "kv_select_own" on public.kv_store;
create policy "kv_select_own"
  on public.kv_store for select
  using (auth.uid() = user_id);

drop policy if exists "kv_insert_own" on public.kv_store;
create policy "kv_insert_own"
  on public.kv_store for insert
  with check (auth.uid() = user_id);

drop policy if exists "kv_update_own" on public.kv_store;
create policy "kv_update_own"
  on public.kv_store for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "kv_delete_own" on public.kv_store;
create policy "kv_delete_own"
  on public.kv_store for delete
  using (auth.uid() = user_id);
