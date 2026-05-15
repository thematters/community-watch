import {
  page,
  type CommunityWatchContent,
  type Metric,
  type WatchCase,
} from "./page";

type SourceType = "article" | "moment";
type Reason = "porn_ad" | "spam_ad";
type AppealState = "none" | "received" | "resolved";
type ReviewState = "pending" | "upheld" | "reversed" | "reason_adjusted";

interface CommunityWatchActionNode {
  uuid: string;
  commentId: string;
  sourceType: SourceType;
  sourceTitle: string;
  sourceId: string;
  reason: Reason;
  actorDisplayName: string;
  actionState: "active" | "restored" | "voided";
  appealState: AppealState;
  reviewState: ReviewState;
  originalContent: string | null;
  contentCleared: boolean;
  createdAt: string;
}

interface CommunityWatchActionsResponse {
  communityWatchActions: {
    edges: Array<{
      node: CommunityWatchActionNode;
    }>;
  };
}

interface CommunityWatchActionResponse {
  communityWatchAction: CommunityWatchActionNode | null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

export interface CommunityWatchPageData {
  page: CommunityWatchContent;
  source: "api" | "sample";
}

type CommunityWatchEnv = Record<string, string | undefined>;

const PUBLIC_NOTICE = "本則貼文已由守望相助隊檢舉";
const CLEARED_CONTENT_TEXT = "原留言內容已因隱私或個資請求清空。";
const DEFAULT_FIRST = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COMMUNITY_WATCH_ACTIONS_QUERY = /* GraphQL */ `
  query CommunityWatchActions($input: CommunityWatchActionsInput!) {
    communityWatchActions(input: $input) {
      edges {
        node {
          uuid
          commentId
          sourceType
          sourceTitle
          sourceId
          reason
          actorDisplayName
          actionState
          appealState
          reviewState
          originalContent
          contentCleared
          createdAt
        }
      }
    }
  }
`;

const COMMUNITY_WATCH_ACTION_QUERY = /* GraphQL */ `
  query CommunityWatchAction($uuid: ID!) {
    communityWatchAction(input: { uuid: $uuid }) {
      uuid
      commentId
      sourceType
      sourceTitle
      sourceId
      reason
      actorDisplayName
      actionState
      appealState
      reviewState
      originalContent
      contentCleared
      createdAt
    }
  }
`;

const getBuildEnv = () =>
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env ?? {};

const getRuntimeEnv = (runtimeEnv?: CommunityWatchEnv) => ({
  ...getBuildEnv(),
  ...runtimeEnv,
});

const getApiUrl = (runtimeEnv?: CommunityWatchEnv) =>
  getRuntimeEnv(runtimeEnv).COMMUNITY_WATCH_API_URL?.trim();

const getFirst = (runtimeEnv?: CommunityWatchEnv) => {
  const raw = Number.parseInt(
    getRuntimeEnv(runtimeEnv).COMMUNITY_WATCH_API_FIRST ?? "",
    10
  );
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(raw, 100);
  }
  return DEFAULT_FIRST;
};

const mapReason = (reason: Reason): WatchCase["reason"] =>
  reason === "porn_ad" ? "色情廣告" : "濫發廣告";

const mapSourceType = (sourceType: SourceType): WatchCase["sourceType"] =>
  sourceType === "article" ? "文章留言" : "動態留言";

const mapAppealStatus = (appealState: AppealState) => {
  switch (appealState) {
    case "received":
      return "申訴已受理";
    case "resolved":
      return "申訴已結案";
    case "none":
    default:
      return "未申訴";
  }
};

const mapReviewStatus = (reviewState: ReviewState) => {
  switch (reviewState) {
    case "upheld":
      return "維持處理";
    case "reversed":
      return "已恢復";
    case "reason_adjusted":
      return "理由已調整";
    case "pending":
    default:
      return "待覆核";
  }
};

const formatHandledAt = (createdAt: string) =>
  new Intl.DateTimeFormat("zh-Hant-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(createdAt))
    .replace(/\//g, "-");

const toPlainText = (content: string) =>
  content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const mapAction = (action: CommunityWatchActionNode): WatchCase => ({
  id: action.uuid,
  commentId: action.commentId,
  sourceType: mapSourceType(action.sourceType),
  sourceTitle: action.sourceTitle,
  sourceId: action.sourceId,
  reason: mapReason(action.reason),
  publicNotice: PUBLIC_NOTICE,
  commentPreview:
    action.contentCleared || action.originalContent === null
      ? CLEARED_CONTENT_TEXT
      : toPlainText(action.originalContent),
  watcher: action.actorDisplayName,
  handledAt: formatHandledAt(action.createdAt),
  appealStatus: mapAppealStatus(action.appealState),
  reviewStatus: mapReviewStatus(action.reviewState),
});

const buildLiveMetrics = (cases: WatchCase[]): Metric[] => {
  const pornCount = cases.filter((item) => item.reason === "色情廣告").length;
  const spamCount = cases.filter((item) => item.reason === "濫發廣告").length;
  const appealCount = cases.filter((item) => item.appealStatus !== "未申訴").length;

  return [
    { label: "色情廣告", value: String(pornCount), note: "近期公開紀錄" },
    { label: "濫發廣告", value: String(spamCount), note: "近期公開紀錄" },
    { label: "誤刪申訴", value: String(appealCount), note: "這個數字越小越好" },
  ];
};

const buildPage = (
  cases: WatchCase[],
  source: CommunityWatchPageData["source"]
) => ({
  ...page,
  metrics: source === "api" ? buildLiveMetrics(cases) : page.metrics,
  log: {
    ...page.log,
    description:
      source === "api"
        ? "原留言內容預設遮蔽，避免垃圾內容被二次散播；需要申訴、覆核或社群稽核時，使用者仍可點開全文比對。"
        : page.log.description,
    cases,
  },
});

const requestGraphQL = async <T>(
  query: string,
  variables: Record<string, unknown>,
  runtimeEnv?: CommunityWatchEnv
): Promise<T | null> => {
  const apiUrl = getApiUrl(runtimeEnv);
  if (!apiUrl) {
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = (await response.json()) as GraphQLResponse<T>;
    if (result.errors?.length) {
      throw new Error(result.errors.map((error) => error.message).join("; "));
    }

    return result.data ?? null;
  } catch (error) {
    console.warn(`Community Watch API unavailable, using sample data: ${error}`);
    return null;
  }
};

const getLiveCases = async (runtimeEnv?: CommunityWatchEnv) => {
  const data = await requestGraphQL<CommunityWatchActionsResponse>(
    COMMUNITY_WATCH_ACTIONS_QUERY,
    { input: { first: getFirst(runtimeEnv) } },
    runtimeEnv
  );
  if (!data) {
    return null;
  }

  const nodes = data?.communityWatchActions.edges.map(({ node }) => node) ?? [];
  return nodes.map(mapAction);
};

const getLiveCase = async (uuid: string, runtimeEnv?: CommunityWatchEnv) => {
  const data = await requestGraphQL<CommunityWatchActionResponse>(
    COMMUNITY_WATCH_ACTION_QUERY,
    { uuid },
    runtimeEnv
  );

  if (!data) {
    return null;
  }

  return data.communityWatchAction ? mapAction(data.communityWatchAction) : undefined;
};

const findSampleCase = (uuid: string) =>
  page.log.cases.find((watchCase) => watchCase.id === uuid);

const loadCommunityWatchPageData = async (
  runtimeEnv?: CommunityWatchEnv
): Promise<CommunityWatchPageData> => {
  const liveCases = await getLiveCases(runtimeEnv);
  if (liveCases) {
    return { page: buildPage(liveCases, "api"), source: "api" };
  }

  return { page: buildPage(page.log.cases, "sample"), source: "sample" };
};

export const getCommunityWatchPageData = async (
  runtimeEnv?: CommunityWatchEnv
): Promise<CommunityWatchPageData> => loadCommunityWatchPageData(runtimeEnv);

export const getCommunityWatchActionData = async (
  uuid: string,
  runtimeEnv?: CommunityWatchEnv
) => {
  if (!UUID_PATTERN.test(uuid)) {
    return findSampleCase(uuid) ?? null;
  }

  const liveCase = await getLiveCase(uuid, runtimeEnv);
  if (liveCase !== null) {
    return liveCase;
  }

  return findSampleCase(uuid) ?? null;
};
