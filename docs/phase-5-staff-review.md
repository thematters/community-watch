# Phase 5 Staff Review and Appeals

This phase should start after the Community Watch removal flow is deployed and observable on staging. It should not introduce a heavy approval workflow before members can act; the control model stays transparent audit, staff override, and appeal handling.

## Goals

- Staff can review a Community Watch action.
- Staff can restore a removed comment.
- Staff can adjust an action reason between `porn_ad` and `spam_ad`.
- Staff can mark appeal state.
- Staff can disable a Community Watch member by removing the existing `communityWatch` feature flag.
- Every staff action leaves audit evidence.

## Existing Patterns to Reuse

- Admin permission: `thematters/matters-server:src/common/enums/permission.ts` and existing `USER_ROLE.admin`.
- Feature flag assignment: `thematters/matters-server:src/mutations/system/putUserFeatureFlags.ts`.
- Comment state changes: `thematters/matters-server:src/mutations/comment/updateCommentsState.ts`.
- Comment connector pattern: put knex-backed read/write helpers under `thematters/matters-server:src/connectors`.
- Public read model: current `community_watch_action` table and `CommunityWatchAction` GraphQL type from Phase 4.

## Data Model

Use the existing `community_watch_action` row as the primary audit row. Add columns only if they were not already added in Phase 2:

- `appeal_state`: `none`, `received`, `resolved`.
- `review_state`: `pending`, `upheld`, `reversed`, `reason_adjusted`.
- `reviewer_id`: nullable staff user ID.
- `review_note`: nullable staff note, not public by default.
- `reviewed_at`: nullable timestamp.
- `updated_at`: timestamp.

Add a separate append-only staff action table if the implementation needs a full history beyond the latest state:

- `community_watch_review_event.id`
- `community_watch_review_event.uuid`
- `community_watch_review_event.action_id`
- `community_watch_review_event.event_type`: `appeal_received`, `appeal_resolved`, `review_upheld`, `comment_restored`, `reason_changed`, `content_cleared`
- `community_watch_review_event.actor_id`
- `community_watch_review_event.old_value`
- `community_watch_review_event.new_value`
- `community_watch_review_event.note`
- `community_watch_review_event.created_at`

MVP can update the main row first, but production audit quality is better with the append-only review event table.

## API Shape

Prefer admin-only GraphQL mutations under the existing mutation patterns:

```graphql
enum CommunityWatchAppealState {
  none
  received
  resolved
}

enum CommunityWatchReviewState {
  pending
  upheld
  reversed
  reason_adjusted
}

input UpdateCommunityWatchActionStateInput {
  uuid: ID!
  appealState: CommunityWatchAppealState
  reviewState: CommunityWatchReviewState
  reason: CommunityWatchRemoveCommentReason
  note: String
}

input RestoreCommunityWatchCommentInput {
  uuid: ID!
  note: String
}

input ClearCommunityWatchOriginalContentInput {
  uuid: ID!
  note: String
}
```

Expected mutations:

- `updateCommunityWatchActionState(input:)`
- `restoreCommunityWatchComment(input:)`
- `clearCommunityWatchOriginalContent(input:)`

All three require admin/staff permission. None should be callable by Community Watch members unless they are also staff.

## Restore Behavior

When staff restores a comment:

1. Load the active `community_watch_action` by public `uuid`.
2. Confirm the comment still exists and is currently `banned` because of the Community Watch action.
3. Set the comment state back to the previous visible state, likely `active` for MVP.
4. Set `community_watch_action.action_state = restored`.
5. Set `review_state = reversed`.
6. Set `reviewer_id`, `review_note`, and `reviewed_at`.
7. Emit a review event if the append-only event table exists.
8. Invalidate article or moment comment cache using the same cache paths as the removal mutation.

If another moderation action banned the same comment later, staff restore must not silently override that later action.

## Appeal Handling

Email remains the MVP intake path:

1. User emails `hi@matters.town` with the removed comment ID or public record URL.
2. Staff finds the row by `uuid` or `comment_id`.
3. Staff marks `appeal_state = received`.
4. Staff reviews the original content, source, reason, actor display name, and timing.
5. Staff either upholds, adjusts reason, restores the comment, or clears original content for privacy.
6. Staff marks `appeal_state = resolved`.

The public page should show only public state labels. Internal notes stay private unless the team explicitly decides otherwise.

## Acceptance Criteria

- Non-admin users cannot call Phase 5 mutations.
- Community Watch members without admin role cannot review or restore.
- Staff can mark appeal received/resolved.
- Staff can uphold an action.
- Staff can change reason from `porn_ad` to `spam_ad` or the reverse.
- Staff can restore a Community Watch removed comment.
- Restored public records remain visible and show the reversal state.
- Clearing original content keeps comment ID, source ID/title, reason, actor display name, timestamps, appeal state, and review state.
- Every mutation has rollback-safe DB migration coverage and resolver tests.

## Deferred

- Full admin UI polish.
- SLA tracking for appeals.
- Multi-reviewer approval.
- AI-assisted review suggestions.
- Automatic original-content retention cleanup.
