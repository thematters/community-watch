# Implementation Plan

## Minimal Viable Architecture

Use the existing Matters server and web architecture.

- Permission source: add `communityWatch` to `user_feature_flag`.
- Removal state: set the target comment to `COMMENT_STATE.banned`.
- Audit source: add a new queryable DB table, `community_watch_action`.
- Public transparency page: query `community_watch_action`, not S3 audit logs.
- Frontend entry: add one action in the existing comment dropdown.
- Frontend replacement: render a Community Watch placeholder when a banned comment has a matching active audit action.

This avoids a parallel moderation system while still separating Community Watch evidence from generic reports and generic admin bans.

## Repositories / Modules to Change

### `thematters/matters-server`

Expected changes:

- `db/migrations/*`
  - Add `communityWatch` to the user feature flag enum.
  - Add `unique(user_id, type)` to `user_feature_flag`.
  - Add `community_watch_action`.
  - Add rollback for every migration.
- `src/common/enums/oss.ts`
  - Add `USER_FEATURE_FLAG_TYPE.communityWatch`.
- `src/common/enums/index.ts`
  - Add Community Watch enums only if the codebase prefers central enum definitions.
- `src/types/system.ts`
  - Expose admin assignment through existing feature flag mutation or add a narrower mutation if needed.
- `src/types/comment.ts`
  - Add `communityWatchRemoveComment`.
  - Add public audit fields on `Comment` if placeholder data is queried through comment fragments.
- `src/mutations/comment/communityWatchRemoveComment.ts`
  - Validate viewer has the `communityWatch` feature flag.
  - Validate comment type is article or moment.
  - Validate comment is not already archived/banned by unrelated flow.
  - Store audit row and set comment state to `banned` in one transaction.
- `src/connectors/commentService.ts`
  - Add helper to fetch placeholder/audit data for removed comments.
  - Keep default list filtering behavior unless query changes are needed to include placeholders.
- `src/types/communityWatch.ts` or `src/types/system.ts`
  - Add public query for audit records.
  - Add admin/staff review mutations in Phase 5.

### `thematters/matters-web`

Expected changes:

- `src/components/Context/Viewer/index.tsx`
  - Expose `viewer.oss.featureFlags` to identify Community Watch members.
- `src/components/Comment/DropdownActions/index.tsx`
  - Add the Community Watch action for eligible users.
- `src/components/Comment/Content/index.tsx`
  - Render `本則貼文已由守望相助隊檢舉` and link to the audit record for Community Watch removals.
- `src/components/Comment/Feed/gql.ts`
  - Include minimal audit placeholder fields.
- `src/common/utils/comment/index.ts`
  - Ensure Community Watch removed comments can render as placeholders even if banned comments are otherwise filtered.
- `src/components/Dialogs/MomentDetailDialog/Comments.tsx`
  - Update active-only filtering so moment comment placeholders can appear.
- Public page route or link handling for `community-watch.matters.town`, if hosted inside `matters-web`.

### `thematters/design-system`

Use existing package `@matters/design-system-react` for the public page if the public site is implemented in this repository or in `matters-web`.

### `thematters/community-watch`

Use this repository for:

- Public-page implementation if kept separate from `matters-web`.
- Product decisions.
- Repo-backed planning.
- Staging verification records.
- Future data export specs for AI training.

## Permission Model

Do not add a new user role.

Use:

- `user.role = admin` for staff/admin.
- `user_feature_flag.type = communityWatch` for Community Watch members.

Rules:

- Admin can add/remove `communityWatch`.
- A Community Watch member can remove only comments.
- A Community Watch member cannot remove articles, moment bodies, users, circle content, or account state.
- Permission must be checked server-side on every mutation.
- Frontend visibility is convenience only, not security.
- Removing the feature flag must immediately prevent new removals.

## Audit Table Design

Draft table: `community_watch_action`.

Fields:

- `id`: big integer primary key.
- `uuid`: public stable ID for URLs.
- `comment_id`: target comment ID.
- `comment_type`: copied from `comment.type`.
- `target_type`: `article` or `moment`.
- `target_id`: article or moment ID.
- `target_title`: article title when available; for moments, use target ID or a short generated label.
- `target_short_hash`: article short hash when available.
- `reason`: enum `porn_ad` or `spam_ad`.
- `actor_id`: Community Watch member user ID.
- `comment_author_id`: original comment author user ID, nullable if privacy handling later requires removal.
- `original_content`: comment content at removal time, nullable and manually clearable for privacy/personal-data requests.
- `original_state`: previous comment state.
- `action_state`: `active`, `restored`, `voided`.
- `appeal_state`: `none`, `received`, `resolved`.
- `review_state`: `pending`, `upheld`, `reversed`, `reason_adjusted`.
- `reviewer_id`: staff reviewer user ID, nullable.
- `review_note`: staff note, nullable.
- `reviewed_at`: timestamp, nullable.
- `content_expires_at`: dormant compatibility field from the earlier seven-day retention plan; do not run automatic cleanup until a later product/legal decision re-enables timed retention.
- `created_at`: removal time.
- `updated_at`: update time.

Indexes:

- `unique(comment_id)` where `action_state = active`, if the database supports partial unique indexes.
- Index `created_at`.
- Index `actor_id, created_at`.
- Index `reason, created_at`.
- Index `review_state, created_at`.
- Index `content_expires_at` only if timed retention is re-enabled later.

Retention:

- Do not automatically clear `original_content` in the current plan.
- Preserve non-personal audit metadata unless a privacy/legal request requires additional deletion.
- If personal data is found in `original_content`, clear `original_content` directly and keep the audit action metadata.
- Revisit timed retention as a separate product/legal decision before enabling any cleanup job.

## Removed Comment State

Use existing `COMMENT_STATE.banned`.

Reasoning:

- `banned` already represents forcibly hidden comments in server and web code.
- `archived` is already used for author/self-delete.
- `collapsed` is a lower-severity hidden state and does not fit immediate spam removal.

Required additional behavior:

- A banned comment with an active `community_watch_action` must render a Community Watch placeholder instead of a generic forcibly-hidden message.
- Comment list queries may need to include placeholder rows for Community Watch removals, because existing `commentService.find` and frontend utilities often filter out `banned` comments.

## Admin Assignment Flow

Phase 1 path:

1. Admin opens the existing admin tooling or user feature flag control.
2. Admin adds `communityWatch` to a user.
3. Server writes `user_feature_flag(user_id, communityWatch)`.
4. User's viewer query includes the feature flag.
5. Frontend shows Community Watch comment actions.
6. Admin removes the flag to revoke permission.

Tests:

- Admin can assign the flag.
- Admin can remove the flag.
- Non-admin cannot assign the flag.
- Duplicate assignment is blocked by `unique(user_id, type)`.
- Removed flag prevents the mutation even if UI is stale.

## Community Watch Comment Flow

1. Member opens article or moment comments.
2. Existing comment dropdown shows a Community Watch action.
3. Member chooses one of two reasons:
   - 色情廣告
   - 濫發廣告
4. Server validates permission and target type.
5. Server stores audit row and sets comment state to `banned` in one transaction.
6. UI updates the comment in place to `本則貼文已由守望相助隊檢舉`.
7. Placeholder links to the public record.

No confirmation dialog is required.

Add a warning note near the action surface or page bottom, not a blocking confirmation:

> 守望相助隊操作會留下公開紀錄，請只處理明確垃圾留言。

## Placeholder and Public Record Link

Comment placeholder:

```text
本則貼文已由守望相助隊檢舉
```

Link target:

```text
https://community-watch.matters.town/records/{community_watch_action.uuid}
```

The placeholder needs at least:

- action UUID
- reason
- created time
- actor display name if shown

If the comment list does not include banned comments, the server should provide placeholder nodes or adjust the relevant query to include Community Watch removed comments without exposing generic banned comments.

## Public Page Data, API, Cache, and Deployment

Minimum public API:

- `communityWatchActions(first, after, reason, reviewState)`
  - recent public records
- `communityWatchAction(uuid)`
  - one public record
- `communityWatchStats`
  - optional in MVP; can be delayed

Public fields:

- action UUID
- comment ID
- source type
- source title or ID
- reason label
- actor display name
- removal time
- appeal status
- staff review status
- original content, unless manually privacy-cleared

Caching:

- Recent list: short public cache, for example 60 seconds.
- Detail page: short public cache, for example 60 seconds.
- Do not cache unblurred client state as a separate public endpoint.
- After staff restore/review changes, invalidate or allow short TTL to expire.

Deployment options:

- Option A: host public page inside `matters-web`, with domain routing for `community-watch.matters.town`.
- Option B: host a small public site in this repository, using `@matters/design-system-react` and the Matters GraphQL API.

Current recommendation:

- Use this repository for the public page if the team wants clean domain ownership and fewer changes to `matters-web`.
- Use `matters-web` if the team wants shared auth/session, existing i18n, and existing GraphQL client behavior.

MVP can start with the API and link shape first, then decide the hosting option before Phase 4.

Current no-server-dependency work:

- Keep `thematters/community-watch` deployable as a static Astro site.
- Provide sample public records in `src/content/page.ts` and label them as demonstration data.
- Provide record detail routes at `/records/{uuid}/` with blurred content and appeal instructions.
- Keep the API contract in `docs/public-api-contract.md` so the later server query can replace the static fallback without changing the public route shape.

## Appeals and Staff Review

Appeal flow:

1. Public page shows appeal instruction: send removed comment ID to `hi@matters.town`.
2. Staff marks `appeal_state = received`.
3. Staff reviews the action.
4. Staff can:
   - uphold removal;
   - restore comment;
   - adjust reason;
   - void audit action if it was invalid;
   - remove the member's `communityWatch` flag.
5. Every staff review action updates the audit row and should also emit internal audit logging.

Restore behavior:

- Set comment state back to `original_state` when safe.
- Set `action_state = restored`.
- Set `review_state = reversed`.
- Keep audit metadata public so the removal and reversal remain traceable.

## AI Training Data

Use audit rows as future training/evaluation labels only after staff review policy is defined.

Export principles:

- Include only the two clear labels: `porn_ad`, `spam_ad`.
- Prefer reviewed/upheld rows for training.
- Use reversed rows as negative or evaluation examples only with care.
- Remove or mask personal data.
- Remove or neutralize dangerous external links.
- Record source, label, action time, review result, and retention status.
- Never let the first AI version directly remove comments.

## Risks and Decision Points

Abuse by Community Watch members:

- Mitigation: small permission scope, public audit page, staff review, appeal path, immediate flag removal.

False positives:

- Mitigation: restore path, public reversal state, appeal email, preserve metadata.

Privacy:

- Mitigation: no automatic public spreading, blur-by-default, direct content clearing on privacy requests, avoid storing unnecessary personal fields.

Secondary spread of spam:

- Mitigation: blur-by-default, warning text, short content retention, no SEO-oriented spam presentation.

Data retention:

- Decision needed for `original_content` timed retention and non-content audit metadata lifetime.

Model misuse:

- Mitigation: Phase 7 only exports data and builds candidate hints. No AI auto-removal.

Existing banned-comment filtering:

- Mitigation: adjust query or add placeholder data so public placeholders render even when banned comments are filtered.

## Phases

### Phase 0: Repo Survey and Architecture Confirmation

Deliverable:

- Repo-backed survey and implementation plan.

Acceptance:

- Existing permission, comment, report, audit, admin, API, frontend, deployment, and spam-detection patterns are identified with file references.

### Phase 1: Admin Assignment

Deliverable:

- `communityWatch` feature flag.
- Unique constraint on `user_feature_flag(user_id, type)`.
- Admin assignment and removal path.

Acceptance:

- Assigned user has permission.
- Removed user immediately loses permission.
- Duplicate flag cannot be created.
- Non-admin cannot assign.

### Phase 2: Comment Removal API

Deliverable:

- Mutation for Community Watch removal.
- Two allowed reasons.
- Audit row written in DB.
- Comment state set to `banned`.

Acceptance:

- Non-member cannot remove.
- Member can remove article and moment comments.
- Member cannot remove circle comments, articles, moment bodies, or users.
- Duplicate action is handled predictably.
- Audit row and comment state update are transactional.

### Phase 3: Minimal Comment UI

Deliverable:

- Comment dropdown action visible only to Community Watch members.
- Removed comment placeholder visible to general users.
- Placeholder links to public record.

Acceptance:

- No general-user onboarding friction.
- Existing comment UI remains intact.
- Article and moment comments both work.

### Phase 4: Public Page and API

Deliverable:

- `community-watch.matters.town` public page.
- Recent records and detail record.
- Blurred original content with click-to-view.
- Appeal instruction.

Acceptance:

- Page shows statistics or recent records, reason, time, comment ID, appeal instruction, and review state.
- Original content is blurred by default.
- Page does not become an unfiltered spam showcase.

### Phase 5: Appeals and Staff Review

Deliverable:

- Admin/staff review tools.
- Restore mutation.
- Reason adjustment.
- Appeal/review state updates.
- Member deactivation path.

Acceptance:

- Staff can restore a removed comment.
- Staff can update review and appeal states.
- All staff review operations leave audit evidence.

### Phase 6: Deployment and Monitoring

Deliverable:

- Staging domain and production domain routing.
- Scheduled job for clearing `original_content`.
- Error and permission-operation monitoring.

Acceptance:

- Staging validates assignment, removal, public page, appeal ID, and restore.
- Production rollout requires human approval.

### Phase 7: AI Data Planning

Deliverable:

- Safe export plan for training/evaluation data.
- Candidate-detection-only AI design.

Acceptance:

- Data is de-identified or masked.
- Labels are limited to the two MVP reasons.
- AI cannot directly remove comments.

## MVP Scope

MVP includes:

- Phase 1 through Phase 4.
- 7-day original content retention.
- Public audit detail pages.
- Basic appeal instruction.

Defer:

- Staff review UI polish.
- Statistics dashboards beyond simple counts.
- AI candidate detection.
- Complex moderation workflow.
- Multi-language expansion beyond existing product language needs.
- Circle support.
