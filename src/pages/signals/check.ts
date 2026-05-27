import type { APIRoute } from "astro";

import {
  checkCommunityWatchSignals,
  type CommunityWatchSignalCheckInput,
} from "../../content/communityWatchSignals";

export const prerender = false;

const MAX_TEXT_LENGTH = 5000;
const MAX_CONTACTS = 20;
const MAX_URLS = 20;
const MAX_FIELD_LENGTH = 500;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validatePayload = (
  payload: unknown,
):
  | { input: CommunityWatchSignalCheckInput }
  | { error: string; status: number } => {
  if (!isRecord(payload)) {
    return { error: "JSON body must be an object", status: 400 };
  }

  if (payload.text !== undefined && typeof payload.text !== "string") {
    return { error: "text must be a string", status: 400 };
  }

  const text = payload.text;
  if (text && text.length > MAX_TEXT_LENGTH) {
    return { error: "text is too long", status: 413 };
  }

  const contacts = payload.contacts;
  if (contacts !== undefined && !Array.isArray(contacts)) {
    return { error: "contacts must be an array", status: 400 };
  }
  if (Array.isArray(contacts) && contacts.length > MAX_CONTACTS) {
    return { error: "too many contacts", status: 413 };
  }

  const parsedContacts: CommunityWatchSignalCheckInput["contacts"] = [];
  for (const contact of Array.isArray(contacts) ? contacts : []) {
    if (!isRecord(contact)) {
      return { error: "contacts must contain objects", status: 400 };
    }
    const kind = contact.kind;
    const value = contact.value;
    if (typeof kind !== "string" || typeof value !== "string") {
      return { error: "contacts require kind and value strings", status: 400 };
    }
    if (kind.length > MAX_FIELD_LENGTH || value.length > MAX_FIELD_LENGTH) {
      return { error: "contact field is too long", status: 413 };
    }
    parsedContacts.push({ kind, value });
  }

  const urls = payload.urls;
  if (urls !== undefined && !Array.isArray(urls)) {
    return { error: "urls must be an array", status: 400 };
  }
  if (Array.isArray(urls) && urls.length > MAX_URLS) {
    return { error: "too many urls", status: 413 };
  }

  const parsedUrls: string[] = [];
  for (const url of Array.isArray(urls) ? urls : []) {
    if (typeof url !== "string") {
      return { error: "urls must contain strings", status: 400 };
    }
    if (url.length > MAX_FIELD_LENGTH) {
      return { error: "url is too long", status: 413 };
    }
    parsedUrls.push(url);
  }

  return {
    input: {
      ...(text ? { text } : {}),
      ...(parsedContacts.length ? { contacts: parsedContacts } : {}),
      ...(parsedUrls.length ? { urls: parsedUrls } : {}),
    },
  };
};

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const validation = validatePayload(payload);
  if ("error" in validation) {
    return json({ error: validation.error }, validation.status);
  }

  const runtimeEnv = (
    locals as { runtime?: { env?: Record<string, string | undefined> } }
  ).runtime?.env;

  try {
    const result = await checkCommunityWatchSignals(
      validation.input,
      runtimeEnv,
    );
    if (!result) {
      return json({ error: "COMMUNITY_WATCH_API_URL is not configured" }, 503);
    }

    return json(result);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "signals check failed",
      },
      502,
    );
  }
};

export const GET: APIRoute = async () =>
  json({ error: "POST JSON to this endpoint" }, 405);
