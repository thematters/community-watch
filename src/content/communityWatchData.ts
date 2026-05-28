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
  sourceUrl: string | null;
  reason: Reason;
  actorDisplayName: string;
  actionState: "active" | "restored" | "voided";
  appealState: AppealState;
  reviewState: ReviewState;
  originalContent: string | null;
  contentCleared: boolean;
  reportSynced: boolean;
  createdAt: string;
}

interface CommunityWatchActionsConnection<T> {
  edges: Array<{
    node: T;
  }>;
  pageInfo?: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
}

type CommunityWatchActionMetricNode = Pick<
  CommunityWatchActionNode,
  "reason" | "actionState" | "appealState"
>;
type CommunityWatchActionListNode = Omit<
  CommunityWatchActionNode,
  "originalContent" | "contentCleared"
>;

interface CommunityWatchActionsResponse {
  communityWatchActions: CommunityWatchActionsConnection<CommunityWatchActionNode>;
}

interface CommunityWatchActionMetricsResponse {
  communityWatchActions: CommunityWatchActionsConnection<CommunityWatchActionMetricNode>;
}

interface CommunityWatchActionListResponse {
  communityWatchActions: CommunityWatchActionsConnection<CommunityWatchActionListNode>;
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

export interface CommunityWatchRecordListData {
  cases: WatchCase[];
  source: "api" | "sample" | "unavailable";
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
}

type CommunityWatchEnv = Record<string, string | undefined>;

const PUBLIC_NOTICE = "本則貼文已由守望相助隊檢舉";
const CLEARED_CONTENT_TEXT = "原留言內容已因隱私或個資請求清空。";
const DEFAULT_RECENT_FIRST = 20;
const DEFAULT_RECORD_LIST_FIRST = 50;
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
          sourceUrl
          reason
          actorDisplayName
          actionState
          appealState
          reviewState
          originalContent
          contentCleared
          reportSynced
          createdAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const COMMUNITY_WATCH_ACTION_METRICS_QUERY = /* GraphQL */ `
  query CommunityWatchActionMetrics($input: CommunityWatchActionsInput!) {
    communityWatchActions(input: $input) {
      edges {
        node {
          reason
          actionState
          appealState
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const COMMUNITY_WATCH_ACTION_LIST_QUERY = /* GraphQL */ `
  query CommunityWatchActionList($input: CommunityWatchActionsInput!) {
    communityWatchActions(input: $input) {
      edges {
        node {
          uuid
          commentId
          sourceType
          sourceTitle
          sourceId
          sourceUrl
          reason
          actorDisplayName
          actionState
          appealState
          reviewState
          reportSynced
          createdAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
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
      sourceUrl
      reason
      actorDisplayName
      actionState
      appealState
      reviewState
      originalContent
      contentCleared
      reportSynced
      createdAt
    }
  }
`;

const getBuildEnv = () =>
  (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env ?? {};

const getRuntimeEnv = (runtimeEnv?: CommunityWatchEnv) => ({
  ...getBuildEnv(),
  ...runtimeEnv,
});

const getApiUrl = (runtimeEnv?: CommunityWatchEnv) =>
  getRuntimeEnv(runtimeEnv).COMMUNITY_WATCH_API_URL?.trim();

const getFirst = (runtimeEnv?: CommunityWatchEnv) => {
  const raw = Number.parseInt(
    getRuntimeEnv(runtimeEnv).COMMUNITY_WATCH_API_FIRST ?? "",
    10,
  );
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(raw, 100);
  }
  return DEFAULT_RECENT_FIRST;
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
  sourceUrl: action.sourceUrl,
  actionState: action.actionState,
  reason: mapReason(action.reason),
  publicNotice: PUBLIC_NOTICE,
  commentPreview:
    action.contentCleared || action.originalContent === null
      ? CLEARED_CONTENT_TEXT
      : toPlainText(action.originalContent),
  watcher: action.actorDisplayName,
  handledAt: formatHandledAt(action.createdAt),
  reportSynced: action.reportSynced,
  appealStatus: mapAppealStatus(action.appealState),
  reviewStatus: mapReviewStatus(action.reviewState),
});

const mapActionSummary = (action: CommunityWatchActionListNode): WatchCase => ({
  id: action.uuid,
  commentId: action.commentId,
  sourceType: mapSourceType(action.sourceType),
  sourceTitle: action.sourceTitle,
  sourceId: action.sourceId,
  sourceUrl: action.sourceUrl,
  actionState: action.actionState,
  reason: mapReason(action.reason),
  publicNotice: PUBLIC_NOTICE,
  commentPreview: "",
  watcher: action.actorDisplayName,
  handledAt: formatHandledAt(action.createdAt),
  reportSynced: action.reportSynced,
  appealStatus: mapAppealStatus(action.appealState),
  reviewStatus: mapReviewStatus(action.reviewState),
});

const buildLiveMetrics = (
  actions: CommunityWatchActionMetricNode[],
): Metric[] => {
  const activeActions = actions.filter((item) => item.actionState === "active");
  const pornCount = activeActions.filter(
    (item) => item.reason === "porn_ad",
  ).length;
  const spamCount = activeActions.filter(
    (item) => item.reason === "spam_ad",
  ).length;
  const appealCount = activeActions.filter(
    (item) => item.appealState !== "none",
  ).length;

  return [
    { label: "色情廣告", value: String(pornCount), note: "全部公開紀錄" },
    { label: "濫發廣告", value: String(spamCount), note: "全部公開紀錄" },
    { label: "誤刪申訴", value: String(appealCount), note: "這個數字越小越好" },
  ];
};

const buildPage = (
  cases: WatchCase[],
  source: CommunityWatchPageData["source"],
  metrics = page.metrics,
) => ({
  ...page,
  metrics: source === "api" ? metrics : page.metrics,
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
  runtimeEnv?: CommunityWatchEnv,
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
    console.warn(
      `Community Watch API unavailable, using sample data: ${error}`,
    );
    return null;
  }
};

const getLiveCases = async (runtimeEnv?: CommunityWatchEnv) => {
  const data = await requestGraphQL<CommunityWatchActionsResponse>(
    COMMUNITY_WATCH_ACTIONS_QUERY,
    { input: { first: getFirst(runtimeEnv) } },
    runtimeEnv,
  );
  if (!data) {
    return null;
  }

  const nodes = data?.communityWatchActions.edges.map(({ node }) => node) ?? [];
  return nodes.map(mapAction);
};

const getLiveCaseConnection = async (
  input: { first: number; after?: string },
  runtimeEnv?: CommunityWatchEnv,
) => {
  const data = await requestGraphQL<CommunityWatchActionListResponse>(
    COMMUNITY_WATCH_ACTION_LIST_QUERY,
    { input },
    runtimeEnv,
  );
  if (!data) {
    return null;
  }

  return data.communityWatchActions;
};

const getLiveMetrics = async (runtimeEnv?: CommunityWatchEnv) => {
  const actions: CommunityWatchActionMetricNode[] = [];
  let after: string | null = null;

  do {
    const input: Record<string, unknown> = { first: 100 };
    if (after) {
      input.after = after;
    }

    const data = await requestGraphQL<CommunityWatchActionMetricsResponse>(
      COMMUNITY_WATCH_ACTION_METRICS_QUERY,
      { input },
      runtimeEnv,
    );
    if (!data) {
      return null;
    }

    const connection = data.communityWatchActions;
    actions.push(...connection.edges.map(({ node }) => node));
    after = connection.pageInfo?.hasNextPage
      ? (connection.pageInfo.endCursor ?? null)
      : null;
  } while (after);

  return buildLiveMetrics(actions);
};

const getLiveCase = async (uuid: string, runtimeEnv?: CommunityWatchEnv) => {
  const data = await requestGraphQL<CommunityWatchActionResponse>(
    COMMUNITY_WATCH_ACTION_QUERY,
    { uuid },
    runtimeEnv,
  );

  if (!data) {
    return null;
  }

  return data.communityWatchAction
    ? mapAction(data.communityWatchAction)
    : undefined;
};

const findSampleCase = (uuid: string) =>
  page.log.cases.find((watchCase) => watchCase.id === uuid);

const loadCommunityWatchPageData = async (
  runtimeEnv?: CommunityWatchEnv,
): Promise<CommunityWatchPageData> => {
  const liveCases = await getLiveCases(runtimeEnv);
  if (liveCases) {
    const liveMetrics = await getLiveMetrics(runtimeEnv);
    return {
      page: buildPage(
        liveCases,
        "api",
        liveMetrics ??
          buildLiveMetrics(
            liveCases.map((watchCase) => ({
              actionState: watchCase.actionState ?? "active",
              appealState:
                watchCase.appealStatus === "未申訴" ? "none" : "received",
              reason: watchCase.reason === "色情廣告" ? "porn_ad" : "spam_ad",
            })),
          ),
      ),
      source: "api",
    };
  }

  return { page: buildPage(page.log.cases, "sample"), source: "sample" };
};

export const getCommunityWatchPageData = async (
  runtimeEnv?: CommunityWatchEnv,
): Promise<CommunityWatchPageData> => loadCommunityWatchPageData(runtimeEnv);

export const getCommunityWatchActionData = async (
  uuid: string,
  runtimeEnv?: CommunityWatchEnv,
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

export const getCommunityWatchRecordListData = async (
  {
    first = DEFAULT_RECORD_LIST_FIRST,
    after,
  }: {
    first?: number;
    after?: string | null;
  } = {},
  runtimeEnv?: CommunityWatchEnv,
): Promise<CommunityWatchRecordListData> => {
  const safeFirst = Math.max(1, Math.min(first, 100));
  const safeAfter = after?.trim();
  const input: { first: number; after?: string } = { first: safeFirst };
  if (safeAfter) {
    input.after = safeAfter;
  }

  const liveConnection = await getLiveCaseConnection(input, runtimeEnv);
  if (liveConnection) {
    return {
      cases: liveConnection.edges.map(({ node }) => mapActionSummary(node)),
      source: "api",
      pageInfo: {
        endCursor: liveConnection.pageInfo?.endCursor ?? null,
        hasNextPage: Boolean(liveConnection.pageInfo?.hasNextPage),
      },
    };
  }

  if (getApiUrl(runtimeEnv)) {
    return {
      cases: [],
      source: "unavailable",
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
      },
    };
  }

  return {
    cases: page.log.cases.slice(0, safeFirst),
    source: "sample",
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
    },
  };
};
