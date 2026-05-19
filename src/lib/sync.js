// 同步管理器：localStorage 為主要 UI 來源，背景把變動推到 Supabase
// 設計：local-first，網路斷線時繼續可用，恢復後自動補送

import { supabase, supabaseEnabled } from "./supabase.js";

export const SYNC_KEYS = [
  "lumiere_sales_v2",
  "lumiere_purchases_v2",
  "lumiere_staff_v2",
  "lumiere_expenses_v2",
];

const PENDING_KEY = "lumiere_pending_writes_v1";
const LISTENERS = new Set(); // (status) => void
let status = { state: "idle", lastSyncedAt: null, error: null };

const setStatus = (next) => {
  status = { ...status, ...next };
  LISTENERS.forEach((fn) => fn(status));
};

export const getSyncStatus = () => status;
export const onSyncStatus = (fn) => {
  LISTENERS.add(fn);
  fn(status);
  return () => LISTENERS.delete(fn);
};

// ─── Local storage helpers (with same-tab event so React hooks re-read) ───
export function readLocal(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent("lumiere:storage", { detail: { key, value } })
    );
  } catch {}
}

// ─── Pending writes queue (persists across reloads / offline) ─────────────
function getPending() {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "{}");
  } catch {
    return {};
  }
}
function setPending(obj) {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(obj));
}

// ─── Debounced flush ──────────────────────────────────────────────────────
let flushTimer = null;

export function queueRemoteWrite(key, value) {
  if (!SYNC_KEYS.includes(key)) return;
  if (!supabaseEnabled) return;
  const pending = getPending();
  pending[key] = { value, queuedAt: Date.now() };
  setPending(pending);

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushPending, 800);
}

export async function flushPending() {
  if (!supabaseEnabled) return;
  const pending = getPending();
  const keys = Object.keys(pending);
  if (keys.length === 0) return;

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) {
    setStatus({ state: "offline", error: "未登入" });
    return;
  }

  setStatus({ state: "syncing", error: null });
  const nowIso = new Date().toISOString();
  const rows = keys.map((key) => ({
    user_id: user.id,
    key,
    value: pending[key].value,
    updated_at: nowIso,
  }));

  const { error } = await supabase
    .from("kv_store")
    .upsert(rows, { onConflict: "user_id,key" });

  if (error) {
    setStatus({ state: "error", error: error.message });
    // 不清除 pending，下次再試
    return;
  }

  // 成功才清除
  setPending({});
  setStatus({ state: "synced", lastSyncedAt: nowIso, error: null });
}

// ─── Pull entire dataset from cloud → write to local ──────────────────────
export async function pullFromCloud() {
  if (!supabaseEnabled) return { ok: false, reason: "no-supabase" };
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no-user" };

  setStatus({ state: "syncing", error: null });
  const { data, error } = await supabase
    .from("kv_store")
    .select("key,value,updated_at")
    .in("key", SYNC_KEYS);

  if (error) {
    setStatus({ state: "error", error: error.message });
    return { ok: false, reason: error.message };
  }

  let count = 0;
  data.forEach((row) => {
    if (SYNC_KEYS.includes(row.key)) {
      writeLocal(row.key, row.value);
      count++;
    }
  });

  setStatus({ state: "synced", lastSyncedAt: new Date().toISOString(), error: null });
  return { ok: true, count };
}

// ─── First-login bootstrap：雲端有資料 → 拉下來；雲端空 → 把本地推上去 ──
export async function bootstrapSync() {
  if (!supabaseEnabled) return { ok: false, reason: "no-supabase" };
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no-user" };

  setStatus({ state: "syncing", error: null });
  const { data, error } = await supabase
    .from("kv_store")
    .select("key,value")
    .in("key", SYNC_KEYS);

  if (error) {
    setStatus({ state: "error", error: error.message });
    return { ok: false, reason: error.message };
  }

  if (data && data.length > 0) {
    // 雲端有資料：拉下來覆蓋本地
    data.forEach((row) => writeLocal(row.key, row.value));
    setStatus({ state: "synced", lastSyncedAt: new Date().toISOString() });
    return { ok: true, direction: "pulled", count: data.length };
  }

  // 雲端為空：把本地推上去（如果本地有東西）
  const nowIso = new Date().toISOString();
  const localRows = SYNC_KEYS
    .map((key) => {
      const v = readLocal(key, null);
      if (v == null || (Array.isArray(v) && v.length === 0)) return null;
      return { user_id: user.id, key, value: v, updated_at: nowIso };
    })
    .filter(Boolean);

  if (localRows.length > 0) {
    const { error: upErr } = await supabase
      .from("kv_store")
      .upsert(localRows, { onConflict: "user_id,key" });
    if (upErr) {
      setStatus({ state: "error", error: upErr.message });
      return { ok: false, reason: upErr.message };
    }
    setStatus({ state: "synced", lastSyncedAt: nowIso });
    return { ok: true, direction: "pushed", count: localRows.length };
  }

  setStatus({ state: "synced", lastSyncedAt: nowIso });
  return { ok: true, direction: "empty", count: 0 };
}

// ─── 網路恢復時自動 flush ─────────────────────────────────────────────────
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushPending();
  });
}
