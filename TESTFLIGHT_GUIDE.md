# Mochi 默契 — TestFlight 上架指南

## 前置需求

- [x] macOS + Xcode 15+
- [x] Apple Developer Program 帳號（$99/年）
- [x] iOS 專案已建立（`ios/` 目錄）
- [x] Apple Sign-In 已整合
- [x] 隱私權、服務條款、支援頁面已建立

---

## 一、Xcode 專案設定

### 1. 開啟專案

```bash
npm run build:ios
# 或手動：
# NEXT_OUTPUT=export npx next build && npx cap sync ios && npx cap open ios
```

### 2. 設定簽名

在 Xcode 中：

1. 選擇左側 **App** 專案 → **Signing & Capabilities**
2. 勾選 **Automatically manage signing**
3. **Team** 選擇你的 Apple Developer 團隊
4. **Bundle Identifier** 確認為 `com.mochi.match`

### 3. 啟用 Sign in with Apple

1. 在 **Signing & Capabilities** 點選 **+ Capability**
2. 搜尋並加入 **Sign in with Apple**
3. 確認 Apple Developer 後台也已啟用此功能：
   - 登入 [developer.apple.com](https://developer.apple.com)
   - Certificates, Identifiers & Profiles → Identifiers
   - 找到 `com.mochi.match` → 勾選 Sign In with Apple

### 4. 設定 Deployment Target

- **Minimum Deployments**: iOS 16.0
- **Device**: iPhone（取消 iPad 若不需要）

### 5. App Icon 確認

App Icon 已自動配置在 `ios/App/App/Assets.xcassets/AppIcon.appiconset/`。
在 Xcode 中確認 Asset Catalog 沒有黃色警告。

---

## 二、建置與封存

### 1. 選擇目標裝置

Xcode 上方工具列，將 target device 選為 **Any iOS Device (arm64)**

### 2. Archive（封存）

```
Product → Archive
```

等待封存完成，會自動開啟 **Organizer** 視窗。

### 3. 上傳到 App Store Connect

在 Organizer 中：

1. 選擇剛剛的 Archive
2. 點選 **Distribute App**
3. 選擇 **App Store Connect**
4. 選擇 **Upload**
5. 保持預設選項，點 **Next** → **Upload**

---

## 三、App Store Connect 設定

### 1. 建立 App

登入 [App Store Connect](https://appstoreconnect.apple.com)：

1. **My Apps** → **+** → **New App**
2. 填寫資料：
   - **Platform**: iOS
   - **Name**: Mochi 默契
   - **Primary Language**: 繁體中文
   - **Bundle ID**: com.mochi.match
   - **SKU**: mochi-match-001

### 2. 填寫 App 資訊

參考 `APP_STORE_METADATA.md` 填入：

- **描述**: 複製中文描述
- **關鍵字**: `MBTI,配對,交友,性格,人格,默契,約會,戀愛,16型人格,INFP,ENFJ,台灣交友,免費交友,個性配對,情境題`
- **支援 URL**: 你部署的 `support.html` URL
- **隱私權政策 URL**: 你部署的 `privacy.html` URL
- **類別**: Social Networking
- **內容分級**: 填寫問卷（選 17+）

### 3. 上傳截圖

需要準備：
- **6.9 吋截圖** (1320×2868) — iPhone 16 Pro Max
- **6.3 吋截圖** (1206×2622) — iPhone 16 Pro

建議截圖頁面：登入、MBTI 測試、情境問答、每日推薦、聊天、設定

### 4. 隱私權問卷

App Store Connect → App Privacy：

| 資料類型 | 收集？ | 用途 |
|---------|--------|------|
| 姓名 | 是（Apple Sign-In） | App 功能 |
| Email | 是（Apple Sign-In） | App 功能 |
| 使用資料 | 是（Analytics） | 分析（不追蹤） |

> 選擇「Data is NOT linked to the user's identity」和「Data is NOT used for tracking」

---

## 四、TestFlight 測試

### 1. 選擇 Build

上傳後約 15-30 分鐘，Build 會出現在 App Store Connect → TestFlight。

### 2. 內部測試

1. **TestFlight** → **Internal Testing**
2. 新增測試群組
3. 加入你的 Apple ID（最多 100 位內部測試者）
4. 選擇 Build → **Start Testing**

### 3. 外部測試（可選）

1. **TestFlight** → **External Testing**
2. 新增測試群組
3. 需要通過 Beta App Review（1-2 天）
4. 可加入最多 10,000 位外部測試者

### 4. 安裝測試

測試者收到 TestFlight 邀請 Email → 下載 TestFlight App → 安裝 Mochi 默契

---

## 五、常用指令

```bash
# 完整建置流程（Web → iOS sync → 開啟 Xcode）
npm run build:ios

# 只同步 Web 資源到 iOS
npm run cap:sync

# 只開啟 Xcode
npm run cap:open

# 重新建置 Web
NEXT_OUTPUT=export npx next build

# 同步到 iOS
npx cap sync ios

# 在 Xcode 中開啟
npx cap open ios
```

---

## 六、常見問題

### Q: Archive 失敗 — Signing 錯誤
確認 Xcode → Signing & Capabilities → Team 已正確設定，且 Bundle ID 在 Apple Developer 後台已註冊。

### Q: Upload 失敗 — Icon 缺少
確認 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 有完整的 18 個 icon 檔案。

### Q: Apple Sign-In 不能用
確認：
1. Xcode 已加入 Sign in with Apple capability
2. Apple Developer 後台 Identifier 已啟用此功能
3. Provisioning Profile 已包含此 entitlement

### Q: Build 出現在 TestFlight 但無法安裝
等待 Apple 處理（最多 30 分鐘）。如果超過 1 小時未出現，檢查 App Store Connect 的 email 通知。

---

## Checklist

- [ ] Apple Developer 帳號已購買
- [ ] Xcode Signing 設定完成
- [ ] Sign in with Apple capability 已加入
- [ ] 成功 Archive
- [ ] 成功上傳至 App Store Connect
- [ ] 建立 App 並填寫完整資訊
- [ ] 部署 `public-legal/` 頁面並設定公開 URL
- [ ] 隱私權問卷填寫完成
- [ ] 選擇 Build 開始 TestFlight 測試
- [ ] 在實機上安裝並驗證功能
