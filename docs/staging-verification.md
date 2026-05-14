# matters.icu Staging 驗收清單

本文件用於「馬特市守望相助隊」正式上線前的完整流程驗收。所有穩定流程須先於 `matters.icu` 驗證通過，才可將相關變更合併至 `master`。

## 發布原則

- `matters.icu` 必須完成端到端驗收，包含 admin 指定隊員、隊員處理留言、前端操作入口、公開頁紀錄、admin 覆核與恢復留言。
- 不得僅因 CI 或 build 通過即合併至 `master`。
- 若任一必要項目未通過，應先於 `develop` 修正並重新驗收。
- production rollout 需由人員明確核准。

## 驗收環境

| 項目                    | 位置                                                      | 預期狀態                                                            |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| Matters staging web     | `https://matters.icu`                                     | 包含守望相助隊留言操作入口與被移除留言 placeholder。                |
| Matters staging GraphQL | `https://server.matters.icu/graphql`                      | 提供守望相助隊 public query、隊員操作 mutation、站方覆核 mutation。 |
| 公開頁                  | `https://community-watch.matters.town` 或 staging preview | 可讀取目標 GraphQL endpoint 的公開紀錄。                            |
| 發布 PR                 | 相關 `matters-server` / `matters-web` PR                  | 驗收通過前維持 draft 或不合併至 `master`。                          |

公開頁若使用 staging 資料，應以 staging preview 或本機 preview 驗證：

```bash
COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql pnpm preview
```

不得讓正式公開域名長期指向 staging 資料。

## 最小通過門檻

以下項目全部通過，才視為可進入 production review：

| 編號 | 必要流程           | 通過標準                                                                  | 證據                               |
| ---- | ------------------ | ------------------------------------------------------------------------- | ---------------------------------- |
| G1   | admin 指定隊員     | 指定後，隊員重新整理即可取得 `communityWatch` 權限。                      | 後台截圖或 API 結果。              |
| G2   | 隊員處理留言       | 隊員可於文章留言與動態留言選擇「色情廣告」或「濫發廣告」。                | 操作截圖、留言 ID、公開紀錄 ID。   |
| G3   | 一般使用者不可操作 | 一般使用者看不到守望相助隊處理入口，亦無法呼叫 mutation。                 | 截圖與 API 錯誤結果。              |
| G4   | 前端替換文案       | 被處理留言於原處顯示 `本則貼文已由守望相助隊檢舉`，並連至公開紀錄。       | 原頁截圖與連結。                   |
| G5   | 公開頁紀錄         | 公開頁顯示理由、處理者顯示名稱、時間、留言 ID、來源、申訴狀態與覆核狀態。 | 公開紀錄頁 URL 與截圖。            |
| G6   | 原留言遮蔽         | 原留言內容預設遮蔽，點開後始顯示全文。                                    | 預設狀態與展開狀態截圖。           |
| G7   | 站方覆核           | admin 可恢復留言、調整理由、標記申訴狀態、清除原留言內容。                | 前後截圖或 API 結果。              |
| G8   | 權限取消           | admin 取消隊員權限後，該使用者不再看到操作入口，既有 mutation 也被拒絕。  | 後台截圖、前端截圖、API 錯誤結果。 |

## 測試帳號

驗收前填寫。

| 角色              | Matters 帳號 | 登入方式 / 負責人 | 備註                                       |
| ----------------- | ------------ | ----------------- | ------------------------------------------ |
| Admin / staff     |              |                   | 可指定權限、覆核、恢復留言。               |
| 守望相助隊候選人  |              |                   | 驗收中會取得並移除 `communityWatch` 權限。 |
| 一般使用者        |              |                   | 不得看到處理入口。                         |
| 文章作者 / 留言者 |              |                   | 建立文章留言測試資料。                     |
| 動態作者 / 留言者 |              |                   | 建立動態留言測試資料。                     |

## 測試內容

請於 staging 建立新內容，避免與既有資料混淆。測試文字須明確可判斷，但不得包含真實惡意連結、真實成人內容或真實個資。

| 內容     | URL | 來源 ID | 留言 ID | 測試理由 | 備註 |
| -------- | --- | ------- | ------- | -------- | ---- |
| 文章留言 |     |         |         | 色情廣告 |      |
| 文章留言 |     |         |         | 濫發廣告 |      |
| 動態留言 |     |         |         | 色情廣告 |      |
| 動態留言 |     |         |         | 濫發廣告 |      |

圍爐不納入本專案驗收範圍。

## 事前檢查

可先用 repo 內的只讀 preflight 腳本確認 staging API 是否已部署到位：

```bash
pnpm staging:check
```

若需同時確認登入者是否為 admin / 守望相助隊員，提供臨時 staging access token。腳本只會把 token 作為 `x-access-token` header 呼叫 `server.matters.icu`，不會輸出或保存 token：

```bash
MATTERS_STAGING_ACCESS_TOKEN=... pnpm staging:check
```

| 檢查項目               | 預期結果                                                                                 | Pass/Fail | 證據 |
| ---------------------- | ---------------------------------------------------------------------------------------- | --------- | ---- |
| Staging server schema  | `server.matters.icu` 提供守望相助隊 public query、隊員操作 mutation、站方覆核 mutation。 |           |      |
| Staging web deployment | `matters.icu` 已包含守望相助隊留言選單與 placeholder UI。                                |           |      |
| 公開頁資料來源         | 驗證 staging 紀錄時，公開頁指向 `server.matters.icu` 或明確的 staging preview。          |           |      |
| 申訴信箱               | `hi@matters.town` 負責人知道本次 staging 驗收。                                          |           |      |
| 發布狀態               | 相關 PR 尚未合併至 `master`。                                                            |           |      |

## 2026-05-13 實際事前檢查紀錄

| 檢查項目                       | 結果                              | 證據 / 備註                                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matters staging web            | Pass                              | `https://matters.icu/a/ckl5le599uwc` 可開啟，Safari 已登入 `mashbean`。                                                                                                                                                               |
| Admin UI signal                | Pass                              | 文章「更多操作」可見 `設為首頁精選`、`標記 SPAM`、`標記廣告`、`關小黑屋`、`凍結用戶`、`註銷用戶` 等 admin 操作。                                                                                                                      |
| Staging server schema          | Pass                              | `https://server.matters.icu/graphql` 已提供 `communityWatchActions`、`communityWatchAction`、`communityWatchRemoveComment`、`updateCommunityWatchActionState`、`restoreCommunityWatchComment`、`clearCommunityWatchOriginalContent`。 |
| Public audit records           | Pending data                      | `communityWatchActions(input: { first: 5 })` 回傳 `totalCount: 0`，staging 尚無可驗證公開紀錄。                                                                                                                                       |
| Safari authenticated API check | Blocked by local browser settings | Safari 阻擋網址列 JavaScript，且未開啟 Apple Events JavaScript。未讀取或保存登入 token。後續可使用 `MATTERS_STAGING_ACCESS_TOKEN=... pnpm staging:check` 做只讀權限確認。                                                             |
| Feature flag management UI     | Not found                         | `matters-web` 目前未找到使用 `putUserFeatureFlags` 的後台 UI；communityWatch 指定仍沿用既有 admin GraphQL mutation。                                                                                                                  |

## 2026-05-13 #4775 後續驗證紀錄

| 檢查項目                     | 結果             | 證據 / 備註                                                                                                                                                                                                      |
| ---------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server follow-up PR          | Pass             | `thematters/matters-server` #4775 已 merge 到 `develop`，develop deploy、schema push、DB migration、EB deploy 與 Lambda deploys 均完成。                                                                         |
| Stale public read fix        | Pass             | `pnpm staging:check` 顯示公開 API 目前有 1 筆紀錄：`957ebd2b-ac4a-4fa6-ba62-0e9c3d79e748`，reason `porn_ad`，action state `restored`，review state `reversed`，處理人 `mashbean`。                               |
| Public API record detail     | Pass             | `communityWatchAction(input: { uuid })` 可由本機 Cloudflare preview 讀取，顯示留言 ID `Q29tbWVudDozNjkzMg`、來源 `A test a day, keeps the bugs away`、處理人 `mashbean`、站方覆核 `已恢復`。                     |
| Public page staging preview  | Pass             | 以 `wrangler pages dev dist --binding COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql` 啟動本機 preview 後，首頁顯示 staging 公開紀錄。                                                              |
| Production public domain     | Expected pending | `https://community-watch.matters.town` 仍顯示示範資料；正式域名不應長期指向 staging。staging 驗收請使用 staging preview 或本機 preview。                                                                         |
| Authenticated full E2E rerun | Blocked          | Atlas 已登入 `matters.icu`，但「允許 Apple 事件的 JavaScript」目前關閉；Safari 目前只有錯誤頁。若要自動重跑建立留言、移除、覆核恢復流程，需要臨時 staging access token，或手動開啟瀏覽器 JavaScript 自動化通道。 |

## 2026-05-13 #4779 / #5887 後續驗證紀錄

| 檢查項目                     | 結果                | 證據 / 備註                                                                                                                                                                                                                      |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server placeholder list fix  | Pass                | `thematters/matters-server` #4779 已 merge；移除留言後，文章 comments query 回傳 banned comment 與 `communityWatchAction.uuid`。                                                                                                 |
| Web article comment gate fix | Pass                | `thematters/matters-web` #5887 已 merge；文章留言抽屜打開後，原處顯示 `本則貼文已由守望相助隊檢舉`。                                                                                                                             |
| Authenticated E2E remove     | Pass                | 測試留言 `Q29tbWVudDozNjkzNA`，公開紀錄 `73cfede7-8d54-48ec-bb41-42b96b0b92ce`，理由 `porn_ad`，處理人 `mashbean`。                                                                                                              |
| Placeholder link             | Pass with follow-up | 原處 placeholder 連至 `https://community-watch.matters.town/records/73cfede7-8d54-48ec-bb41-42b96b0b92ce`；需補尾斜線或讓公開頁同時接受 no-slash URL。                                                                           |
| Public page live domain      | Blocked             | `https://community-watch.matters.town/records/{uuid}/` 可進頁面，但目前 production domain 未設定 `COMMUNITY_WATCH_API_URL`，因此無法讀取 staging record。                                                                        |
| Public page local preview    | Pass                | 本機 `wrangler pages dev dist --binding COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql` 可顯示該 record：來源 `Fediverse staging 測試文章 2026-05-12`、處理人 `mashbean`、理由 `色情廣告`，原留言預設 `is-blurred`。 |
| Staff restore                | Pass                | 已用 admin mutation 恢復 `73cfede7-8d54-48ec-bb41-42b96b0b92ce`；留言狀態回到 `active`，公開紀錄為 `actionState: restored`、`reviewState: reversed`。                                                                            |

## 2026-05-14 Cloudflare Pages staging data binding

| 檢查項目                 | 結果                   | 證據 / 備註                                                                                                                                                                                                                  |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production Pages binding | Pass                   | Cloudflare Pages production secret `COMMUNITY_WATCH_API_URL` 已暫時設定為 `https://server.matters.icu/graphql`，僅供 `matters.icu` staging 驗收使用。正式上線前不得讓 production domain 長期指向 staging data。              |
| Manual deployment        | Pass                   | `CLOUDFLARE_ACCOUNT_ID=757aaed316df635d8deb63859258808c wrangler pages deploy dist --project-name community-watch --branch main` 已完成；deployment URL 為 `https://ca069b50.community-watch.pages.dev`。                    |
| Public domain root       | Pass                   | `https://community-watch.matters.town/?verify=20260514T1140` 回傳 200，`Cache-Control: no-store`，首頁 `公開 API` 字串出現次數為 0，並顯示 staging 紀錄。                                                                      |
| Public record route      | Pass                   | `https://community-watch.matters.town/records/73cfede7-8d54-48ec-bb41-42b96b0b92ce` 與 `/records/73cfede7-8d54-48ec-bb41-42b96b0b92ce/` 均回傳 200。                                                                         |
| Public record content    | Pass                   | 公開紀錄顯示留言 `Q29tbWVudDozNjkzNA`、處理者 `mashbean`、來源 `Fediverse staging 測試文章 2026-05-12`、理由 `色情廣告`、覆核狀態 `已恢復`，且原留言預設仍有 `is-blurred` 遮蔽。                                             |
| Production switch        | Required before master | 正式 rollout 前，需將 `COMMUNITY_WATCH_API_URL` 改為 `https://server.matters.town/graphql`，或移除該 binding 回到 sample fallback；切換後需重新驗證 root、record route、placeholder link 與 staff restore 後的公開紀錄狀態。 |

## 2026-05-14 完整 UI E2E 驗收紀錄

| 檢查項目                    | 結果 | 證據 / 備註                                                                                                                                                                                                                 |
| --------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web viewer flag deployment  | Pass | `thematters/matters-web` #5889 已 merge 到 `develop`；`matters.icu` live build `W_M6ay-BSxG-9U-_6hpgW` 已包含 viewer OSS feature flags，隊員留言選單可顯示「色情廣告」與「濫發廣告」。                                     |
| Test article                | Pass | 驗收文章：`https://matters.icu/a/ckl5le599uwc`，標題 `Fediverse staging 測試文章 2026-05-12`。                                                                                                                              |
| Comment creation            | Pass | 新增測試留言 `Q29tbWVudDozNjkzNQ`，內容為明確測試標記，不含真實廣告連結、成人內容或個資。                                                                                                                                  |
| Community Watch removal     | Pass | 隊員 `mashbean` 於留言選單選擇「色情廣告」後，產生公開紀錄 `7ac9cd2d-abc9-4afb-bdce-ddecb4c5ca51`，reason 為 `porn_ad`。                                                                                                   |
| Placeholder link            | Pass | 原留言位置顯示 `本則貼文已由守望相助隊檢舉`，連至 `https://community-watch.matters.town/records/7ac9cd2d-abc9-4afb-bdce-ddecb4c5ca51/`。                                                                                    |
| Public record detail        | Pass | 公開紀錄頁顯示留言 ID `Q29tbWVudDozNjkzNQ`、來源標題、處理者 `mashbean`、理由 `色情廣告`、申訴狀態與站方覆核狀態；原留言內容預設遮蔽，展開後可供申訴、覆核與社群稽核使用。                                               |
| Public dashboard            | Pass | 公開頁首頁可讀取公開紀錄資料，近期紀錄與統計連動至 staging API 資料。                                                                                                                                                       |
| Staff restore               | Pass | admin 執行 `restoreCommunityWatchComment(input: { uuid: "7ac9cd2d-abc9-4afb-bdce-ddecb4c5ca51", note: "manual staging validation restore" })` 後，公開紀錄更新為 `actionState: restored`、`reviewState: reversed`。       |
| Original comment after restore | Pass | 原留言 GraphQL node 回到 `state: active`，且 `communityWatchAction: null`；原文恢復於文章留言串。                                                                                                                           |
| Feature flag workflow       | Pass | `matters-server` develop 已包含 feature flag workflow 的 cache endpoint fallback：若 EB 環境未提供 `MATTERS_CACHE_HOST`，會透過 `ENV_STORE_PATH` 讀取 SSM，再清除使用者 full-query cache。                                 |
| Badge schema deployment     | Pass | `matters-server` #4786 已 merge 到 `develop`；develop DB migration 與 EB deploy 已通過。`server.matters.icu` GraphQL introspection 已回傳 `BadgeType.community_watch` 與 `UserFeatureFlagType.communityWatch`。             |
| Badge UI deployment         | Pass | `matters-web` #5891 與 #5892 已 merge 並部署；個人頁 badge UI 會使用既有徽章系統顯示守望相助隊火炬 badge。                                                                                                                |
| Staging API preflight       | Pass | `pnpm staging:check` 通過；`server.matters.icu` 提供必要 public queries 與 member/staff mutations，並回傳 4 筆公開紀錄。                                                                                                    |
| Public page no-store redeploy | Pass | `community-watch.matters.town` 已重新部署至 `https://ca069b50.community-watch.pages.dev`；首頁與公開紀錄頁 header 均為 `Cache-Control: no-store`，首頁不再顯示 `公開 API` 標籤。                                         |

## 詳細驗收流程

| 步驟 | 操作者     | 操作                                  | 預期結果                                           | 證據                                    | Pass/Fail |
| ---- | ---------- | ------------------------------------- | -------------------------------------------------- | --------------------------------------- | --------- |
| 1    | Admin      | 指定候選人 `communityWatch` 權限。    | 候選人重新整理後取得隊員權限。                     | 後台截圖或 API 結果。                   |           |
| 2    | 隊員       | 開啟文章留言選單。                    | 顯示「色情廣告」與「濫發廣告」操作。               | 截圖。                                  |           |
| 3    | 隊員       | 開啟動態留言選單。                    | 顯示「色情廣告」與「濫發廣告」操作。               | 截圖。                                  |           |
| 4    | 一般使用者 | 開啟相同文章與動態留言選單。          | 不顯示守望相助隊操作。                             | 截圖。                                  |           |
| 5    | 隊員       | 以「色情廣告」處理一則文章留言。      | 留言被處理，產生公開紀錄。                         | 留言 ID、公開紀錄 ID、截圖或 API 結果。 |           |
| 6    | 使用者     | 重新整理原文章頁。                    | 原留言位置顯示 `本則貼文已由守望相助隊檢舉`。      | 截圖。                                  |           |
| 7    | 使用者     | 點擊 placeholder 連結。               | 開啟同一筆公開紀錄。                               | 公開紀錄 URL 與截圖。                   |           |
| 8    | 隊員       | 以「濫發廣告」處理一則動態留言。      | 留言被處理，產生公開紀錄。                         | 留言 ID、公開紀錄 ID、截圖或 API 結果。 |           |
| 9    | 使用者     | 重新整理原動態頁。                    | 原留言位置顯示 placeholder，並連至公開紀錄。       | 截圖。                                  |           |
| 10   | 隊員       | 檢查可用操作。                        | 不存在刪文章、刪動態本文、限制帳號或全站停權入口。 | 截圖與操作紀錄。                        |           |
| 11   | Admin      | 移除隊員 `communityWatch` 權限。      | 隊員重新整理後失去權限。                           | 後台截圖或 API 結果。                   |           |
| 12   | 原隊員     | 再次開啟留言選單並嘗試既有 mutation。 | UI 操作消失，mutation 被拒絕。                     | 截圖與 API 錯誤結果。                   |           |
| 13   | Admin      | 恢復一則被處理留言。                  | 留言恢復，公開紀錄覆核狀態更新。                   | 公開紀錄 ID、前後截圖或 API 結果。      |           |
| 14   | Admin      | 調整一筆公開紀錄理由。                | 公開頁顯示更新後理由與覆核狀態。                   | 前後截圖。                              |           |
| 15   | Admin      | 標記一筆申訴狀態。                    | 公開頁顯示申訴狀態變更。                           | 前後截圖。                              |           |
| 16   | Admin      | 清除一筆 `originalContent`。          | 公開頁保留 metadata，不再顯示原留言內容。          | 前後截圖或 API 結果。                   |           |

## 公開紀錄檢查

每筆公開紀錄均需檢查。

| 欄位 / 行為    | 預期結果                                                              | Pass/Fail | 證據 |
| -------------- | --------------------------------------------------------------------- | --------- | ---- |
| 公開紀錄 URL   | URL 為 `/records/{uuid}/`，且與原留言 placeholder 連結一致。          |           |      |
| 留言 ID        | 顯示被處理留言 ID。                                                   |           |      |
| 來源           | 顯示文章或動態來源類型，以及來源標題或 ID。                           |           |      |
| 理由           | 僅顯示「色情廣告」或「濫發廣告」。                                    |           |      |
| 處理者         | 顯示隊員的 Matters 顯示名稱，不顯示內部 user ID、電子郵件或 IP 位址。 |           |      |
| 處理時間       | 顯示處理時間。                                                        |           |      |
| 申訴           | 顯示 `hi@matters.town` 申訴說明。                                     |           |      |
| 覆核狀態       | 隨 admin 操作正確更新。                                               |           |      |
| 原留言預設狀態 | 原留言內容預設遮蔽。                                                  |           |      |
| 原留言展開     | 點擊「顯示全文」後顯示文字，按鈕改為「收起全文」。                    |           |      |
| 額外確認       | 點開全文前不出現額外確認視窗。                                        |           |      |
| 頁底警示       | 頁底仍顯示公開原文使用警示。                                          |           |      |
| 清除內容       | 清除 `originalContent` 後，公開紀錄保留非個資 metadata。              |           |      |

## 停止條件

若發生以下任一情況，不得進入 production review：

- 非隊員可看到或呼叫守望相助隊處理功能。
- 隊員可影響文章、動態本文、帳號、圍爐內容或全站停權狀態。
- 被處理留言完全消失，未在原處顯示 placeholder。
- placeholder 連結無法開啟對應公開紀錄。
- 公開紀錄顯示內部 user ID、電子郵件、IP 位址、站方備註或隱藏帳號資料。
- 站方恢復留言後，留言狀態或公開紀錄覆核狀態不一致。
- 清除 `originalContent` 時刪除整筆公開紀錄，而非保留非個資 metadata。
- 公開頁預設直接顯示垃圾內容，造成二次散播風險。

## 問題排查

| 狀況                          | 優先檢查                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| 權限指定後未生效              | 檢查 `user_feature_flag` row 與 viewer feature flags。                                          |
| 隊員看不到操作入口            | 確認 `matters.icu` web deployment 包含最新 UI，並重新整理 viewer 權限。                         |
| 隊員 mutation 失敗            | 檢查 viewer 權限與目標留言來源類型。                                                            |
| mutation 成功但公開紀錄未出現 | 檢查 audit table insert 與 public query response。                                              |
| placeholder 未顯示            | 檢查被處理留言是否仍回傳 placeholder 所需資料。                                                 |
| 公開頁仍顯示示範資料          | 確認 `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql` 並確認 staging 已有公開紀錄。 |
| admin 覆核後公開頁未更新      | 檢查 review event 寫入與公開 query response。                                                   |

## 驗收結論

| 項目                             | 填寫 |
| -------------------------------- | ---- |
| 驗收日期                         |      |
| 驗收人                           |      |
| matters.icu web 版本 / commit    |      |
| server.matters.icu 版本 / commit |      |
| 公開頁版本 / commit              |      |
| 是否通過最小門檻                 |      |
| 未解問題                         |      |
| 是否可進入 production review     |      |

驗收全數通過後：

1. 保存證據連結與截圖。
2. 於相關 PR 留言摘要 `matters.icu` 驗收結果。
3. 將 PR 標記為 ready for review。
4. 經人員核准後，才可合併至 `master`。
5. production 部署後，再確認 `server.matters.town/graphql` 與 `community-watch.matters.town` 讀取正式資料正常。
