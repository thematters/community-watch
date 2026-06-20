import type { APIRoute } from "astro";

import { getCommunityWatchSignalsData } from "../content/communityWatchSignals";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } })
    .runtime?.env;

  try {
    const data = await getCommunityWatchSignalsData(runtimeEnv);
    if (!data) {
      return new Response(
        JSON.stringify({
          error: "COMMUNITY_WATCH_API_URL is not configured",
        }),
        {
          status: 503,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "signals export failed",
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      }
    );
  }
};
