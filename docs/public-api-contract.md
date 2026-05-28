# Public API Contract

This is the Phase 4 data contract for `community-watch.matters.town`.

The public site can ship with static sample data before the Matters server public query is available. When the API is ready, keep the public route shape stable and replace only the data source.

## Routes

- `/`: public landing page, summary metrics, recent records.
- `/records/`: paginated public list for all Community Watch actions.
- `/records/{uuid}/`: public detail page for one Community Watch action.

## Minimum Homepage List Query

GraphQL shape used by the homepage recent-record list:

```graphql
query CommunityWatchActions($input: CommunityWatchActionsInput!) {
  communityWatchActions(input: $input) {
    edges {
      cursor
      node {
        uuid
        commentId
        sourceType
        sourceTitle
        sourceId
        reason
        actorDisplayName
        createdAt
        actionState
        appealState
        reviewState
        originalContent
        contentCleared
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

Example variables:

```json
{ "input": { "first": 50 } }
```

Required behavior:

- Return only Community Watch actions intended for public transparency.
- Include active, restored, and voided records once Phase 5 review exists.
- Do not include unrelated generic banned comments.
- Do not require login.
- The homepage uses `originalContent` for the recent-record list only. The full `/records/` list should not request original content.

## Minimum Full List Query

GraphQL shape used by `/records/`:

```graphql
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
        createdAt
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

Example variables:

```json
{ "input": { "first": 50, "after": "optional-cursor" } }
```

Required behavior:

- Return stable cursor pagination so URLs such as `/records/?after=...` can reproduce the same page.
- Do not return `originalContent` in the full list query.
- Each row must link to `/records/{uuid}/` for detailed audit and appeal review.

## Minimum Detail Query

GraphQL shape:

```graphql
query CommunityWatchAction($uuid: ID!) {
  communityWatchAction(input: { uuid: $uuid }) {
    uuid
    commentId
    sourceType
    sourceTitle
    sourceId
    reason
    actorDisplayName
    createdAt
    actionState
    appealState
    reviewState
    originalContent
    contentCleared
  }
}
```

Required behavior:

- `originalContent` may be `null` after privacy clearing.
- If `originalContent` is `null`, return `contentCleared = true`.
- The page still shows audit metadata when content has been cleared.
- The client blurs `originalContent` by default and reveals it only after a local click.

## Reason Mapping

- `porn_ad`: `色情廣告`
- `spam_ad`: `濫發廣告`

## States

Appeal state:

- `none`: no appeal received.
- `received`: appeal received by staff.
- `resolved`: appeal resolved.

Review state:

- `pending`: not yet reviewed by staff.
- `upheld`: staff upheld the removal.
- `reversed`: staff restored or reversed the removal.
- `reason_adjusted`: staff changed the reason.

## Cache

- Recent list: public cache for about 60 seconds.
- Detail page: public cache for about 60 seconds.
- Staff review changes can rely on short TTL at MVP; explicit invalidation can be added later.

## Site Environment

- `COMMUNITY_WATCH_API_URL`: GraphQL endpoint used by the Cloudflare runtime, for example `https://server.matters.town/graphql`.
- `COMMUNITY_WATCH_API_FIRST`: optional homepage recent-record list size, default `20`, capped at `100`.
- If `COMMUNITY_WATCH_API_URL` is unset or unavailable, the Astro site falls back to local sample records in `src/content/page.ts`.

## Homepage Metrics

- Summary metrics are totals across all public Community Watch action pages, not just the recent-record list.
- The homepage may keep the visible record list limited to `COMMUNITY_WATCH_API_FIRST`, but metrics must paginate through `pageInfo` until all public actions are counted.
- Metric pagination should request only the fields needed for counting, such as `reason`, `actionState`, and `appealState`, so the homepage does not render every original comment body.

## Privacy

- Do not expose `actor_id`, `comment_author_id`, email, IP address, or internal staff notes.
- Display the Community Watch member by their Matters display name.
- Clear `originalContent` directly when a valid privacy/personal-data request requires it.
- Do not run automatic original-content cleanup in the current plan.
