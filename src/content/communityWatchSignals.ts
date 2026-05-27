type Reason = "porn_ad" | "spam_ad";
type AppealState = "none" | "received" | "resolved";
type ReviewState = "pending" | "upheld" | "reversed" | "reason_adjusted";

interface CommunityWatchSignalActionNode {
  uuid: string;
  commentId: string;
  reason: Reason;
  actionState: "active" | "restored" | "voided";
  appealState: AppealState;
  reviewState: ReviewState;
  originalContent: string | null;
  contentCleared: boolean;
  createdAt: string;
}

interface CommunityWatchSignalsResponse {
  communityWatchActions: {
    edges: Array<{ node: CommunityWatchSignalActionNode }>;
    pageInfo?: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

type CommunityWatchEnv = Record<string, string | undefined>;

const NORMALIZATION_VERSION = "community-watch-signals-v1";
const MAX_PAGES = 20;
const PAGE_SIZE = 100;
const MAX_MATCHED_SIGNALS = 20;

const COMMUNITY_WATCH_SIGNALS_QUERY = /* GraphQL */ `
  query CommunityWatchSignals($input: CommunityWatchActionsInput!) {
    communityWatchActions(input: $input) {
      edges {
        node {
          uuid
          commentId
          reason
          actionState
          appealState
          reviewState
          originalContent
          contentCleared
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

const toPlainText = (content: string) =>
  content
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizeDomain = (rawUrl: string) => {
  try {
    const url = new URL(
      rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`,
    );
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

const extractUrlDomains = (content: string) => {
  const domains = new Set<string>();
  for (const match of content.matchAll(
    /https?:\/\/[^\s)]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?/gi,
  )) {
    const domain = normalizeDomain(match[0]);
    if (domain) {
      domains.add(domain);
    }
  }
  return [...domains].sort();
};

const normalizeContactValue = (raw: string) =>
  raw.replace(/[^a-zA-Z0-9_.-]+/g, "").toLowerCase();

const normalizeContactKind = (raw: string) =>
  raw.replace(/[:：\s@-]+/g, "").toLowerCase();

const extractContacts = (content: string) => {
  const contacts = new Map<string, { kind: string; value: string }>();
  for (const match of content.matchAll(
    /(?:line|telegram|tg|whatsapp|wechat|微信|賴|line\s*id)[:：\s@-]*([a-z0-9_.-]{4,})/gi,
  )) {
    const kind = normalizeContactKind(match[0].split(match[1])[0]);
    const value = normalizeContactValue(match[1]);
    if (value) {
      contacts.set(`${kind}:${value}`, { kind, value });
    }
  }
  return [...contacts.values()].sort((a, b) =>
    `${a.kind}:${a.value}`.localeCompare(`${b.kind}:${b.value}`),
  );
};

const hashContent = (normalized: string) =>
  sha256(`${NORMALIZATION_VERSION}:content:${normalized}`);

const hashContact = (kind: string, value: string) =>
  sha256(`${NORMALIZATION_VERSION}:contact:${kind}:${value}`);

const hashDomain = (domain: string) =>
  sha256(`${NORMALIZATION_VERSION}:domain:${domain}`);

const requestGraphQL = async <T>(
  query: string,
  variables: Record<string, unknown>,
  runtimeEnv?: CommunityWatchEnv,
): Promise<T | null> => {
  const apiUrl = getApiUrl(runtimeEnv);
  if (!apiUrl) {
    return null;
  }

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
};

const mapSignalRecord = async (action: CommunityWatchSignalActionNode) => {
  const plainText =
    action.contentCleared || action.originalContent === null
      ? ""
      : toPlainText(action.originalContent);
  const normalized = normalizeText(plainText);
  const urlDomains = extractUrlDomains(normalized);
  const contacts = extractContacts(normalized);

  return {
    actionUuid: action.uuid,
    commentId: action.commentId,
    reason: action.reason,
    actionState: action.actionState,
    reviewState: action.reviewState,
    appealState: action.appealState,
    createdAt: action.createdAt,
    contentSha256: normalized ? await hashContent(normalized) : null,
    contacts: await Promise.all(
      contacts.map(async ({ kind, value }) => ({
        kind,
        valueSha256: await hashContact(kind, value),
      })),
    ),
    urls: await Promise.all(
      urlDomains.map(async (domain) => ({
        domainSha256: await hashDomain(domain),
      })),
    ),
  };
};

export const getCommunityWatchSignalsData = async (
  runtimeEnv?: CommunityWatchEnv,
) => {
  const records: CommunityWatchSignalActionNode[] = [];
  let after: string | null = null;
  let pages = 0;

  do {
    const input: Record<string, unknown> = { first: PAGE_SIZE };
    if (after) {
      input.after = after;
    }

    const data = await requestGraphQL<CommunityWatchSignalsResponse>(
      COMMUNITY_WATCH_SIGNALS_QUERY,
      { input },
      runtimeEnv,
    );
    if (!data) {
      return null;
    }

    const connection = data.communityWatchActions;
    records.push(...connection.edges.map(({ node }) => node));
    after = connection.pageInfo?.hasNextPage
      ? (connection.pageInfo.endCursor ?? null)
      : null;
    pages += 1;
  } while (after && pages < MAX_PAGES);

  const signalRecords = await Promise.all(records.map(mapSignalRecord));

  return {
    normalizationVersion: NORMALIZATION_VERSION,
    generatedAt: new Date().toISOString(),
    usageNotice:
      "This dataset is for defensive spam detection and audit only. It intentionally excludes raw content, full contacts, and URL paths to reduce secondary propagation.",
    total: signalRecords.length,
    records: signalRecords,
  };
};

type CommunityWatchSignalRecord = NonNullable<
  Awaited<ReturnType<typeof getCommunityWatchSignalsData>>
>["records"][number];

export type CommunityWatchSignalCheckInput = {
  text?: string;
  contacts?: Array<{ kind?: string; value?: string }>;
  urls?: string[];
};

type MatchedSignal = {
  type: "content" | "contact" | "url_domain";
  hash: string;
  count: number;
  reasons: Reason[];
  actionStates: CommunityWatchSignalRecord["actionState"][];
  reviewStates: ReviewState[];
};

const toSortedUnique = <T extends string>(values: Set<T>) =>
  [...values].sort((a, b) => a.localeCompare(b));

const addMatchedSignal = (
  matches: Map<
    string,
    {
      type: MatchedSignal["type"];
      hash: string;
      count: number;
      reasons: Set<Reason>;
      actionStates: Set<CommunityWatchSignalRecord["actionState"]>;
      reviewStates: Set<ReviewState>;
    }
  >,
  type: MatchedSignal["type"],
  hash: string,
  record: CommunityWatchSignalRecord,
) => {
  const key = `${type}:${hash}`;
  const current = matches.get(key) ?? {
    type,
    hash,
    count: 0,
    reasons: new Set<Reason>(),
    actionStates: new Set<CommunityWatchSignalRecord["actionState"]>(),
    reviewStates: new Set<ReviewState>(),
  };

  current.count += 1;
  current.reasons.add(record.reason);
  current.actionStates.add(record.actionState);
  current.reviewStates.add(record.reviewState);
  matches.set(key, current);
};

const getCheckCandidates = async (input: CommunityWatchSignalCheckInput) => {
  const text = input.text ? normalizeText(input.text) : "";
  const contactCandidates = new Map<string, { kind: string; value: string }>();
  const domains = new Set<string>();

  if (text) {
    for (const contact of extractContacts(text)) {
      contactCandidates.set(`${contact.kind}:${contact.value}`, contact);
    }
    for (const domain of extractUrlDomains(text)) {
      domains.add(domain);
    }
  }

  for (const contact of input.contacts ?? []) {
    const kind = normalizeContactKind(contact.kind ?? "");
    const value = normalizeContactValue(contact.value ?? "");
    if (kind && value) {
      contactCandidates.set(`${kind}:${value}`, { kind, value });
    }
  }

  for (const rawUrl of input.urls ?? []) {
    const domain = normalizeDomain(rawUrl);
    if (domain) {
      domains.add(domain);
    }
  }

  return {
    contentSha256: text ? await hashContent(text) : null,
    contactHashes: new Set(
      await Promise.all(
        [...contactCandidates.values()].map(({ kind, value }) =>
          hashContact(kind, value),
        ),
      ),
    ),
    domainHashes: new Set(
      await Promise.all([...domains].map((domain) => hashDomain(domain))),
    ),
  };
};

export const checkCommunityWatchSignals = async (
  input: CommunityWatchSignalCheckInput,
  runtimeEnv?: CommunityWatchEnv,
) => {
  const data = await getCommunityWatchSignalsData(runtimeEnv);
  if (!data) {
    return null;
  }

  const candidates = await getCheckCandidates(input);
  const matches = new Map<
    string,
    {
      type: MatchedSignal["type"];
      hash: string;
      count: number;
      reasons: Set<Reason>;
      actionStates: Set<CommunityWatchSignalRecord["actionState"]>;
      reviewStates: Set<ReviewState>;
    }
  >();

  for (const record of data.records) {
    if (
      candidates.contentSha256 &&
      record.contentSha256 === candidates.contentSha256
    ) {
      addMatchedSignal(matches, "content", candidates.contentSha256, record);
    }

    for (const contact of record.contacts) {
      if (candidates.contactHashes.has(contact.valueSha256)) {
        addMatchedSignal(matches, "contact", contact.valueSha256, record);
      }
    }

    for (const url of record.urls) {
      if (candidates.domainHashes.has(url.domainSha256)) {
        addMatchedSignal(matches, "url_domain", url.domainSha256, record);
      }
    }
  }

  const matchedSignals = [...matches.values()]
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
    .slice(0, MAX_MATCHED_SIGNALS)
    .map((match) => ({
      type: match.type,
      hash: match.hash,
      count: match.count,
      reasons: toSortedUnique(match.reasons),
      actionStates: toSortedUnique(match.actionStates),
      reviewStates: toSortedUnique(match.reviewStates),
    }));

  const strongestConfidence = matchedSignals.reduce((confidence, match) => {
    const matchConfidence =
      match.type === "content" ? 1 : match.type === "contact" ? 0.92 : 0.72;
    return Math.max(confidence, matchConfidence);
  }, 0);

  return {
    normalizationVersion: data.normalizationVersion,
    checkedAt: new Date().toISOString(),
    verdict:
      strongestConfidence >= 0.9
        ? "match"
        : strongestConfidence > 0
          ? "possible_match"
          : "none",
    confidence: strongestConfidence,
    matchedSignals,
  };
};
