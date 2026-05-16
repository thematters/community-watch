#!/usr/bin/env node

const endpoint = process.env.COMMUNITY_WATCH_API_URL || "https://server.matters.icu/graphql";
const token = process.env.MATTERS_STAGING_ACCESS_TOKEN;

const requiredQueries = ["communityWatchActions", "communityWatchAction"];
const requiredMutations = [
  "communityWatchRemoveComment",
  "updateCommunityWatchActionState",
  "restoreCommunityWatchComment",
  "clearCommunityWatchOriginalContent",
];

const query = async ({ query, variables, auth = false }) => {
  const headers = { "content-type": "application/json" };

  if (auth && token) {
    headers["x-access-token"] = token;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const body = await response.json().catch(async () => ({
    errors: [{ message: await response.text() }],
  }));

  if (!response.ok || body.errors) {
    const message = body.errors?.map((error) => error.message).join("; ");
    throw new Error(message || `HTTP ${response.status}`);
  }

  return body.data;
};

const formatList = (items) => (items.length > 0 ? items.join(", ") : "(none)");

const run = async () => {
  console.log(`Community Watch staging check`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Auth token: ${token ? "provided" : "not provided"}`);

  const schema = await query({
    query: `
      query CommunityWatchSchemaCheck {
        queryType: __type(name: "Query") { fields { name } }
        mutationType: __type(name: "Mutation") { fields { name } }
      }
    `,
  });

  const queryFields = schema.queryType.fields.map(({ name }) => name);
  const mutationFields = schema.mutationType.fields.map(({ name }) => name);
  const missingQueries = requiredQueries.filter((field) => !queryFields.includes(field));
  const missingMutations = requiredMutations.filter((field) => !mutationFields.includes(field));

  console.log(`Required public queries: ${formatList(requiredQueries)}`);
  console.log(`Missing public queries: ${formatList(missingQueries)}`);
  console.log(`Required mutations: ${formatList(requiredMutations)}`);
  console.log(`Missing mutations: ${formatList(missingMutations)}`);

  const records = await query({
    query: `
      query CommunityWatchPublicRecordsCheck {
        communityWatchActions(input: { first: 5 }) {
          totalCount
          edges {
            node {
              uuid
              reason
              actionState
              appealState
              reviewState
              actorDisplayName
              createdAt
            }
          }
        }
      }
    `,
  });

  console.log(`Public record count: ${records.communityWatchActions.totalCount}`);
  records.communityWatchActions.edges.forEach(({ node }, index) => {
    console.log(
      `Record ${index + 1}: ${node.uuid} ${node.reason} ${node.actionState} ${node.reviewState} by ${node.actorDisplayName} at ${node.createdAt}`
    );
  });

  if (token) {
    const viewer = await query({
      auth: true,
      query: `
        query CommunityWatchViewerCheck {
          viewer {
            id
            userName
            displayName
            status { state role }
            oss { featureFlags { type } }
          }
        }
      `,
    });

    const flags = viewer.viewer.oss.featureFlags.map(({ type }) => type);
    console.log(`Viewer: ${viewer.viewer.displayName} (@${viewer.viewer.userName})`);
    console.log(`Viewer role: ${viewer.viewer.status.role}`);
    console.log(`Viewer state: ${viewer.viewer.status.state}`);
    console.log(`Viewer feature flags: ${formatList(flags)}`);
    console.log(`Viewer communityWatch: ${flags.includes("communityWatch") ? "yes" : "no"}`);
  }

  if (missingQueries.length > 0 || missingMutations.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`Staging API preflight passed.`);
};

run().catch((error) => {
  console.error(`Staging API preflight failed.`);
  console.error(error.message);
  process.exitCode = 1;
});
