# Public API Contract

This is the Phase 4 data contract for `community-watch.matters.town`.

The public site can ship with static sample data before the Matters server public query is available. When the API is ready, keep the public route shape stable and replace only the data source.

## Routes

- `/`: public landing page, summary metrics, recent records.
- `/records/{uuid}/`: public detail page for one Community Watch action.

## Minimum List Query

GraphQL shape:

```graphql
query CommunityWatchActions($first: Int = 20, $after: String, $reason: CommunityWatchReason) {
  communityWatchActions(input: { first: $first, after: $after, reason: $reason }) {
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
        appealState
        reviewState
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

Required behavior:

- Return only Community Watch actions intended for public transparency.
- Include active, restored, and voided records once Phase 5 review exists.
- Do not include unrelated generic banned comments.
- Do not require login.

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

## Privacy

- Do not expose `actor_id`, `comment_author_id`, email, IP address, or internal staff notes.
- Display the Community Watch member by their Matters display name.
- Clear `originalContent` directly when a valid privacy/personal-data request requires it.
- Do not run automatic original-content cleanup in the current plan.
