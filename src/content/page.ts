export interface CTA {
  label: string;
  href: string;
}

export interface Metric {
  label: string;
  value: string;
  note: string;
}

export interface WatchCase {
  id: string;
  commentId: string;
  sourceType: "動態留言" | "文章留言";
  sourceTitle: string;
  sourceId: string;
  sourceUrl?: string | null;
  actionState?: "active" | "restored" | "voided";
  reason: "色情廣告" | "濫發廣告";
  publicNotice: string;
  commentPreview: string;
  watcher: string;
  handledAt: string;
  reportSynced?: boolean;
  appealStatus: string;
  reviewStatus: string;
}

export interface Step {
  title: string;
  body: string;
}

export interface FlowItem {
  label: string;
  title: string;
  body: string;
}

export interface CommunityWatchContent {
  pageTitle: string;
  pageDescription: string;
  lang?: string;
  domain: string;
  statusLabel: string;
  hero: {
    title: string;
    slogan: string;
    subtitle: string;
    primaryCta: CTA;
    secondaryCta?: CTA;
    note: string;
    imageAlt: string;
  };
  metrics: Metric[];
  flow: {
    eyebrow: string;
    title: string;
    description: string;
    items: FlowItem[];
    note: string;
  };
  log: {
    eyebrow: string;
    title: string;
    description: string;
    cases: WatchCase[];
  };
  appeal: {
    eyebrow: string;
    title: string;
    body: string;
    email: string;
    steps: Step[];
  };
  training: {
    eyebrow: string;
    title: string;
    body: string;
    steps: Step[];
  };
  footer: {
    note: string;
    warning: string;
    links?: CTA[];
  };
}

export const page: CommunityWatchContent = {
  pageTitle: "馬特市守望相助隊｜matters.town",
  pageDescription:
    "馬特市守望相助隊公開紀錄頁。加入守望相助隊，一起減少垃圾廣告留言，所有處理紀錄均公開查詢，供申訴、覆核與社群稽核使用。",
  lang: "zh-Hant",
  domain: "community-watch.matters.town",
  statusLabel: "公開紀錄",
  hero: {
    title: "馬特市守望相助隊",
    slogan: "馬特市向垃圾廣告宣戰",
    subtitle:
      "加入守望相助隊，一起降低垃圾廣告留言對社群討論的干擾。\n在這裡，守望相助隊的所有處理紀錄均會公開，\n讓申訴、覆核與社群稽核都有依據。",
    primaryCta: { label: "查看處理紀錄", href: "#watch-log" },
    secondaryCta: { label: "我要申訴", href: "#appeal" },
    note: "如需刊登廣告，請使用 Billboard 支持馬特市站方，\n也請正規廣告主一起支持社群永續。",
    imageAlt: "馬特市守望相助隊公開處理垃圾留言紀錄的視覺圖像。",
  },
  metrics: [
    { label: "色情廣告", value: "18", note: "本月已移除" },
    { label: "濫發廣告", value: "42", note: "本月已移除" },
    { label: "誤刪申訴", value: "5", note: "這個數字越小越好" },
  ],
  flow: {
    eyebrow: "處理流程",
    title: "從廣告留言到申訴覆核",
    description:
      "守望相助隊只處理明確的垃圾廣告留言；每次移除都會留下公開紀錄，讓被處理者、站方與社群都能回頭查核。",
    items: [
      {
        label: "廣告留言",
        title: "色情廣告或濫發廣告出現",
        body: "垃圾留言干擾文章與動態討論，符合明確類別時才進入守望相助流程。",
      },
      {
        label: "守望相助隊",
        title: "受託市民協助判斷",
        body: "守望相助隊僅能針對留言處理，並需選擇色情廣告或濫發廣告作為理由。",
      },
      {
        label: "刪除行為",
        title: "留言替換並公開留痕",
        body: "原留言會改為處理提示，公開紀錄保留留言 ID、處理人、日期與處理理由。",
      },
      {
        label: "申訴行為",
        title: "留言者可要求站方覆核",
        body: "若認為遭誤判，可用留言 ID 寄信申訴；站方保留恢復留言與調整權限的最終決定權。",
      },
    ],
    note: "透明紀錄的目的不是擴大懲罰，而是讓刪除、申訴與覆核之間形成可查核的社群自治循環。",
  },
  log: {
    eyebrow: "公開紀錄",
    title: "近期處理紀錄",
    description:
      "原留言內容預設遮蔽，避免垃圾內容被二次散播；需要申訴、覆核或社群稽核時，使用者仍可點開全文比對。正式 API 接上前，本頁先以示範資料展示公開紀錄格式。",
    cases: [
      {
        id: "cw-demo-8f2a71",
        commentId: "cmt-8f2a71",
        sourceType: "動態留言",
        sourceTitle: "關於今天站內活動的討論",
        sourceId: "moment-demo-01",
        reason: "濫發廣告",
        publicNotice: "本則貼文已由守望相助隊檢舉",
        commentPreview: "限時優惠，點擊連結領取投資教學名額，加客服可立即開通會員方案。",
        watcher: "木棉街讀者",
        handledAt: "2026-05-09 18:22",
        appealStatus: "未申訴",
        reviewStatus: "待覆核",
      },
      {
        id: "cw-demo-3b91cd",
        commentId: "cmt-3b91cd",
        sourceType: "文章留言",
        sourceTitle: "一篇長文底下的回覆串",
        sourceId: "article-demo-01",
        reason: "色情廣告",
        publicNotice: "本則貼文已由守望相助隊檢舉",
        commentPreview: "成人交友廣告，附外站聯絡方式與多組重複關鍵字，和原文討論無關。",
        watcher: "榕樹下讀者",
        handledAt: "2026-05-09 12:04",
        appealStatus: "站方覆核中",
        reviewStatus: "覆核中",
      },
      {
        id: "cw-demo-1d77e4",
        commentId: "cmt-1d77e4",
        sourceType: "文章留言",
        sourceTitle: "新作者的第一篇文章",
        sourceId: "article-demo-02",
        reason: "濫發廣告",
        publicNotice: "本則貼文已由守望相助隊檢舉",
        commentPreview: "多篇文章重複張貼相同購物折扣碼與外部短網址，未回應文章內容。",
        watcher: "樓下鄰長",
        handledAt: "2026-05-08 22:38",
        appealStatus: "未申訴",
        reviewStatus: "待覆核",
      },
    ],
  },
  appeal: {
    eyebrow: "救濟機制",
    title: "被移除留言可提出申訴",
    body: "若你認為留言遭誤判，請寄信至 hi@matters.town。站方會依留言 ID 查核原文、處理理由與守望相助隊操作紀錄。",
    email: "hi@matters.town",
    steps: [
      { title: "附上留言 ID", body: "例如 cmt-8f2a71，公開紀錄中均會顯示。" },
      { title: "說明帳號與理由", body: "請提供 Matters 帳號，並說明為何認為該留言不是垃圾留言。" },
      { title: "由站方覆核", body: "站方保留最終決定權；必要時會恢復留言或調整守望相助隊權限。" },
    ],
  },
  training: {
    eyebrow: "下一步",
    title: "守望相助 AI 資料規劃",
    body: "人工處理紀錄未來可整理為訓練與評測資料；第一階段 AI 僅得作為候選提示，不得直接刪除留言。",
    steps: [
      {
        title: "整理明確樣本",
        body: "僅收錄「色情廣告」與「濫發廣告」兩類明確樣本，降低模型誤判正常討論的風險。",
      },
      {
        title: "僅作候選提示",
        body: "自動檢測工具僅提供候選提示與批次整理，不直接刪除留言。",
      },
      {
        title: "保留覆核依據",
        body: "未來若導入模型，仍應記錄模型版本、分數與人工覆核結果，方便修正與追蹤。",
      },
    ],
  },
  footer: {
    note: "© Matters Lab · community-watch.matters.town",
    warning: "公開原文僅供申訴、覆核與社群稽核使用；請勿轉貼垃圾連結、色情廣告或詐騙內容。",
    links: [
      { label: "隊員規章", href: "/rules/" },
      { label: "申訴信箱", href: "mailto:hi@matters.town" },
      { label: "Matters 首頁", href: "https://matters.town" },
      { label: "Billboard", href: "https://matters.town/billboard" },
    ],
  },
};
