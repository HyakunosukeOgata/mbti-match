# Mochi 默契 — App Store 上架資料

## 基本資訊

- **App 名稱**: Mochi 默契
- **副標題**: 用 MBTI 性格找到對的人
- **Bundle ID**: com.mochi.match
- **主要語言**: 繁體中文 (zh-TW)
- **類別**: 社交 (Social Networking)
- **次要類別**: 生活風格 (Lifestyle)
- **內容分級**: 17+ (頻繁/強烈的成熟/暗示性主題)
- **價格**: 免費

---

## App 描述（4000 字以內）

### 繁體中文

Mochi 默契 — 台灣首款基於 MBTI 人格特質的智慧配對交友 APP

💡 什麼是 Mochi 默契？

厭倦了只看外表的交友軟體？Mochi 默契透過 MBTI 16 型人格測試與獨家情境題，幫你找到真正合拍、有默契的另一半。

🧠 科學配對
• 完成 MBTI 四維度人格分析（E/I、S/N、T/F、J/P）
• 回答精心設計的情境問題，反映你的真實價值觀
• 系統根據人格相容性 + 價值觀匹配度，計算契合度

💜 每日推薦
• 每天 5 位精選對象，品質 > 數量
• 每張卡片附帶話題引導，不怕開口尬聊
• 了解對方的 MBTI 類型與共同點

💬 有深度的聊天
• 配對成功後即可開始聊天
• 系統推薦破冰話題，從共同興趣出發
• 安全的檢舉與封鎖功能

📊 每週情境題
• 每週新增 4 道情境題，持續優化配對準確度
• 深入了解你自己的價值觀和偏好

🔒 安全與隱私
• 嚴格的內容審核機制
• 一鍵檢舉、封鎖不當用戶
• 資料加密傳輸，保護你的隱私

立即下載 Mochi 默契，用性格找到最有默契的 Ta！

---

## 關鍵字（100 字以內，逗號分隔）

MBTI,配對,交友,性格,人格,默契,約會,戀愛,16型人格,INFP,ENFJ,台灣交友,免費交友,個性配對,情境題

---

## 支援 URL

- **支援網址**: https://hyakunosukeogata.github.io/mbti-match/support.html
- **隱私權政策**: https://hyakunosukeogata.github.io/mbti-match/privacy.html
- **服務條款**: https://hyakunosukeogata.github.io/mbti-match/terms.html
- **行銷網址**: https://hyakunosukeogata.github.io/mbti-match/ （可選）

> 📌 已設定 GitHub Actions 自動部署。推送 `public-legal/` 到 main 分支後，需到 GitHub repo Settings → Pages → Source 選 "GitHub Actions"。

---

## App 審核資訊

### 審核備註

This is a personality-based dating app that matches users based on their MBTI personality type and scenario question answers. Key features:

1. MBTI Assessment: Users complete a 4-dimension personality test
2. Scenario Questions: Weekly questions that assess values and preferences
3. Smart Matching: Algorithm combines MBTI compatibility (30%) + scenario answer alignment (70%)
4. Chat: Matched users can communicate with guided conversation topics
5. Safety: Report/block functionality, content moderation

Demo account: Enter any name on the login screen to create a test account.

### 聯絡資訊

- **名字**: [你的名字]
- **電話**: [你的電話]
- **Email**: [你的 Email]

---

## 截圖規格

需要準備以下裝置截圖（每款最多 10 張）：

### iPhone 6.9 吋 (必要)
- 解析度: 1320 x 2868 px
- 適用: iPhone 16 Pro Max, 15 Pro Max

### iPhone 6.3 吋  
- 解析度: 1206 x 2622 px
- 適用: iPhone 16 Pro, 15 Pro

### iPad 13 吋 (如果支援 iPad)
- 解析度: 2064 x 2752 px

### 建議截圖內容：
1. **登入頁** — 展示品牌形象和登入方式
2. **MBTI 測試** — 展示個性化測驗流程
3. **情境問答** — 展示獨特的配對問題
4. **每日推薦** — 展示配對卡片和契合度
5. **聊天對話** — 展示話題引導功能
6. **個人設定** — 展示完整的個人資料

---

## 版本紀錄

### v1.0.0
初始版本
- MBTI 四維度人格測試（含強度選擇）
- 4 週 16 道情境題
- 每日 5 位推薦配對
- 即時聊天功能
- 檢舉與封鎖機制
- 隱私權政策與服務條款
- PWA 支援
- 繁體中文介面

---

## 上架前 Checklist

- [ ] Apple Developer 帳號 (年費 USD $99)
- [ ] 部署隱私權政策到公開 URL
- [ ] 部署服務條款到公開 URL
- [ ] Supabase 後端（Auth + DB + Realtime）
- [ ] Apple Sign-In 整合
- [ ] 生成 iOS 專案 (`npm run cap:init:ios`)
- [ ] 生成 App Icons (`node scripts/generate-ios-icons.mjs`)
- [ ] 製作截圖
- [ ] 設定 code signing (Xcode)
- [ ] TestFlight 測試
- [ ] 提交審核
