# Lumière Beauty Bar 管理系統

雲端同步版 · 單店管理 App（營業額 / 進貨 / 人事 / 支出 / 報表）。
資料儲存在你自己的 Supabase 帳號裡，多裝置自動同步、支援離線使用。

---

## 🎯 部署總覽（約 30–40 分鐘）

只需要做一次，之後就一直可以用。

1. **Supabase**：建立帳號、建專案、跑一段 SQL（10 分鐘）
2. **GitHub**：建 repo、上傳檔案（5 分鐘）
3. **Vercel**：連 GitHub 一鍵部署、設定環境變數（10 分鐘）
4. **手機**：開啟網址、加到主畫面、註冊登入（5 分鐘）

全部都是免費方案、不需要信用卡。

---

## 一、Supabase 設定（雲端資料庫）

### Step 1 — 註冊 Supabase

1. 開 https://supabase.com → 右上 **Start your project**
2. 選 **Continue with GitHub**（或 Email 也可）
3. 完成驗證

### Step 2 — 建立專案

1. 進到 Dashboard → **New project**
2. 填寫：
   - **Name**：`lumiere-beauty-bar`（隨便取）
   - **Database Password**：點 Generate a password → **複製存到備忘錄**（之後幾乎用不到，但留著保險）
   - **Region**：選離你最近的（新加坡選 `Southeast Asia (Singapore)`）
   - **Plan**：Free
3. 點 **Create new project** → 等大約 1–2 分鐘讓專案初始化

### Step 3 — 建立資料表（執行 SQL）

1. 左側選單點 **SQL Editor**（圖示像 `</>`）
2. 點 **+ New query**
3. 打開專案資料夾裡的 `supabase-setup.sql` → **整份內容複製貼進去**
4. 點右下 **Run**（或按 Cmd/Ctrl + Enter）
5. 看到綠色 **Success. No rows returned** 就完成了

### Step 4 — 關掉 Email 驗證（讓註冊更順）

> 單人使用不需要 email 驗證，省一步。

1. 左側 **Authentication** → **Sign In / Up** 分頁（或 Providers → Email）
2. 找到 **Confirm email** → **關掉**（toggle off）
3. **Save**

> 如果你想要保留 email 驗證也可以，註冊時系統會寄信給你，點連結後再回 App 登入即可。

### Step 5 — 拿到金鑰（兩個值）

1. 左側 **Project Settings**（齒輪圖示）→ **API Keys**
2. 複製這兩個值，先貼到備忘錄等等用：
   - **Project URL**：`https://xxxxx.supabase.co`
   - **anon public key**：`eyJhbGciOi...` 那個很長的字串
   - ⚠️ **不要**複製 `service_role` 那個，那是後台密鑰

✅ Supabase 設定完成。

---

## 二、GitHub 上傳專案

### Step 1 — 註冊 GitHub（已有帳號可跳過）

1. https://github.com → **Sign up**
2. 完成驗證

### Step 2 — 建立 Repository

1. 右上 **+** → **New repository**
2. **Name**：`lumiere-beauty-bar`，**Public** 或 **Private** 都可（建議 Private）
3. 其他**全部不要勾**，直接 **Create repository**

### Step 3 — 上傳檔案

1. 在空白 repo 頁面找到 **uploading an existing file** 連結
2. 把解壓後 `lumiere-beauty-bar` 資料夾**裡面所有檔案和子資料夾**拖進去
   - 包含：`package.json`、`vite.config.js`、`index.html`、`vercel.json`、`.gitignore`、`.env.example`、`supabase-setup.sql`、`README.md`、`src/`、`public/`
   - ⚠️ 是拖**裡面內容**，不是拖最外層那個資料夾本身
   - ⚠️ **不要上傳 `.env`**（如果有），那是放真正金鑰的，會被 `.gitignore` 自動擋掉
3. 下方綠色 **Commit changes**

✅ GitHub 上傳完成。

---

## 三、Vercel 部署 + 連接 Supabase

### Step 1 — 註冊並 Import

1. https://vercel.com → **Sign Up** → **Continue with GitHub**
2. 授權 Vercel 讀取你的 repo
3. 進入後點 **Add New...** → **Project**
4. 在列表找到 `lumiere-beauty-bar` → 點 **Import**

### Step 2 — 設定環境變數（很重要）

在 **Configure Project** 畫面：

1. 展開 **Environment Variables** 區塊
2. 加入兩筆（注意鍵名前綴 `VITE_`）：

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | 剛剛複製的 Project URL |
   | `VITE_SUPABASE_ANON_KEY` | 剛剛複製的 anon public key |

3. 其他什麼都不用改 → 點 **Deploy**
4. 等 30 秒～1 分鐘，看到 🎉 就完成
5. 點 **Visit** 或複製拿到的網址（例如 `lumiere-beauty-bar.vercel.app`）

✅ Vercel 部署完成。

---

## 四、手機 + 首次註冊

### Step 1 — 註冊帳號

1. 用手機 / 電腦開啟 Vercel 給你的網址
2. 看到登入畫面 → 點下方 **還沒有帳號？點此註冊**
3. 填 Email + 密碼（密碼至少 6 位） → 註冊
4. 進入主畫面，右上會看到 ✦ **已同步**（綠色雲圖示）

### Step 2 — 手機加入主畫面

**iPhone (Safari)：**
- 開啟網址 → 底部分享按鈕 ⬆ → **加入主畫面** → 完成

**Android (Chrome)：**
- 開啟網址 → 右上 ⋮ → **加到主畫面** → 完成

之後從主畫面點圖示，全螢幕運行，跟 App 一樣。

### Step 3 — 在電腦也登入

- 在電腦瀏覽器打開同一個網址 → **用同樣的 email + 密碼登入**
- 雲端資料會自動拉下來，與手機完全同步

---

## 五、日常使用

### 同步狀態（看右上角小標籤）

- 🟢 **已同步**：所有變動都已上傳雲端
- 🔵 **同步中…**：正在上傳
- 🟡 **離線**：網路斷了，資料先存本地，恢復後自動補送
- 🔴 **同步失敗**：滑鼠移上去會看到錯誤訊息，點 ⚙ → 「立即同步」可重試

### 多裝置使用

- 完全自動，無需任何動作
- 在手機新增營業額 → 約 1 秒後上傳 → 電腦下次開啟（或點 ⚙ → 立即同步）就會看到

### 離線使用

- 沒網路時照常輸入，資料先存在裝置上
- 網路恢復時會自動推上雲端

### ⚙ 設定選單裡可以做的事

- **立即同步**：強制把本地推上去 + 從雲端拉下來
- **登出**：登出後資料還在裝置上，重新登入後會再同步
- **匯出備份 (JSON)**：另存一份 JSON 檔到電腦，作為「保險的保險」
- **從備份檔還原**：用 JSON 檔覆蓋目前資料
- **清除所有本地資料**：只清這個瀏覽器上的，雲端的資料不會動

---

## 六、之後要修改 App

### 內容修改（改文字、改顏色等）

1. 到你的 GitHub repo 頁面
2. 點要改的檔案 → 右上鉛筆 → 編輯 → **Commit changes**
3. Vercel 約 1 分鐘後自動上線，網址不變

### 想加新功能

把改好的檔案丟到 GitHub（覆蓋舊版即可），同上自動部署。

---

## 七、本機開發（選用）

如果想在自己電腦改：

```bash
# 1. 把 .env.example 複製為 .env，填入你的 Supabase 兩個值
cp .env.example .env

# 2. 安裝套件 + 啟動本機伺服器
npm install
npm run dev    # http://localhost:5173

# 3. Build 正式版
npm run build
```

需要先裝 Node.js（https://nodejs.org，下載 LTS 版本）。

---

## 八、檔案結構

```
lumiere-beauty-bar/
├── package.json
├── vite.config.js
├── vercel.json
├── index.html
├── supabase-setup.sql        ← 在 Supabase SQL Editor 跑這個
├── .env.example              ← 環境變數範本
├── .gitignore
├── README.md
├── public/
│   ├── manifest.webmanifest  ← PWA 設定（加到主畫面）
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx
    ├── App.jsx               ← 主程式
    └── lib/
        ├── supabase.js       ← Supabase 客戶端
        └── sync.js           ← 同步邏輯（debounce, offline queue）
```

---

## 九、常見問題

**Q：忘記 Vercel 給的網址？**
A：登入 Vercel → 點 lumiere-beauty-bar 專案 → 上方有顯示。

**Q：忘記密碼？**
A：Supabase 後台 → Authentication → Users → 找到你的 email → 點旁邊三點選單 → Send password reset。或直接刪掉重新註冊（資料還在）。

**Q：免費額度夠嗎？**
A：完全夠。Supabase Free 給 500 MB 資料庫 + 50,000 月活躍用戶；Vercel Free 給 100 GB 月流量。單人單店連 1% 都用不到。

**Q：資料安全嗎？**
A：每筆資料都有 Row Level Security，**只有你自己用你的密碼能讀寫**。Supabase 自動加密儲存，每天自動備份 7 天。

**Q：如果哪天不想用了？**
A：到 Supabase 後台匯出資料（CSV/SQL），或用 App 內建的「匯出備份 (JSON)」就能拿到完整資料。

**Q：登入畫面一直跳「Invalid login credentials」？**
A：1) 確認 email/密碼正確；2) 如果有開 email 確認，要先去信箱點驗證連結；3) 直接點「點此註冊」用新密碼註冊一個。

**Q：右上角顯示「同步失敗」？**
A：常見原因：1) Vercel 環境變數打錯（檢查 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）；2) Supabase 還沒跑 `supabase-setup.sql`；3) 暫時網路問題，點 ⚙ → 立即同步 重試。

**Q：可以多個員工各自登入嗎？**
A：可以，但目前每個人看到的是自己的資料（互不影響）。若要共用一份店面資料，最簡單的做法是大家**共用同一個帳號**登入。
