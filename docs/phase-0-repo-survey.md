# Phase 0 Repo Survey

This survey is based on the existing Matters repositories. It should be treated as the starting contract for implementation, not as a replacement for code review during each phase.

## Repositories Checked

- `thematters/matters-server`
  - Local checkout used for survey: `/Users/mashbean/Documents/Codex/2026-04-30/files-mentioned-by-the-user-matters/repos/matters-server`
  - Remote: `https://github.com/thematters/matters-server.git`
- `thematters/matters-web`
  - Local checkout used for survey: `/Users/mashbean/Documents/Codex/2026-04-30/files-mentioned-by-the-user-matters/repos/matters-web`
  - Remote: `https://github.com/thematters/matters-web.git`
- `thematters/design-system`
  - Local checkout used for survey: `/Users/mashbean/Documents/AI-Agent/external/design-system`
  - Remote: `https://github.com/thematters/design-system.git`

## Admin / Role / Permission

Repo-backed facts:

- `thematters/matters-server:src/common/enums/permission.ts` defines `USER_ROLE` as `admin`, `user`, `visitor`, and `AUTH_MODE` as `visitor`, `oauth`, `user`, `admin`.
- `thematters/matters-server:src/common/utils/getViewer.ts` builds the viewer and exposes `viewer.hasRole()`, with ordered role access.
- `thematters/matters-server:src/types/directives/auth.ts` implements the GraphQL `@auth` directive and enforces auth modes.
- `thematters/matters-server:db/migrations/20181128150000_create_user_table.js` defines `user.role` as enum `user/admin`, and `user.state` as `onboarding/active/banned/frozen/archived`.
- `thematters/matters-server:src/types/user.ts` exposes admin mutations such as `updateUserState` and `updateUserRole`, and exposes user status role.
- `thematters/matters-server:db/migrations/20250113101920_user_feature_flag.js` creates `user_feature_flag`.
- `thematters/matters-server:src/common/enums/oss.ts` defines existing feature flags including `bypassSpamDetection`, `unlimitedArticleFetch`, and `readSpamStatus`.
- `thematters/matters-server:src/connectors/userService.ts` has `findFeatureFlags`, `updateFeatureFlags`, `addFeatureFlag`, and `removeFeatureFlag`.
- `thematters/matters-server:src/types/system.ts` and `src/mutations/system/putUserFeatureFlags.ts` expose admin update for feature flags.
- `thematters/matters-web:src/components/Context/Viewer/index.tsx` derives `isAdmin` from `viewer.status?.role === 'admin'`.

Implementation implication:

- Do not extend `user.role` for Community Watch. Use `user_feature_flag` with a new `communityWatch` type.
- Add `unique(user_id, type)` to `user_feature_flag` before using it as a permission source.

## Comment Model, Comment State, and Shared Article / Moment Path

Repo-backed facts:

- `thematters/matters-server:src/common/enums/index.ts` defines `COMMENT_STATE` as `active`, `archived`, `banned`, `collapsed`.
- The same file defines `COMMENT_TYPE` as `article`, `circle_discussion`, `circle_broadcast`, `moment`.
- `thematters/matters-server:db/migrations/20181203010000_create_comment_table.js` creates the base `comment` table with `id`, `uuid`, `author_id`, `article_id`, `parent_comment_id`, `content`, `state`, and timestamps.
- `thematters/matters-server:db/migrations/20191125153804_comment_state_collapse.js` adds the `collapsed` comment state.
- `thematters/matters-server:db/migrations/20201230165620_add_type_to_comment.js` and `20210204115557_alter_comment_type.js` add and extend `comment.type`.
- `thematters/matters-server:src/types/comment.ts` exposes `Comment`, `CommentInput`, `CommentState`, `CommentType`, `deleteComment`, and `updateCommentsState`.
- `thematters/matters-server:src/queries/article/comment/comments.ts` and `src/queries/moment/comments.ts` both use `commentService.find`.
- `thematters/matters-server:src/queries/comment/node.ts` resolves comment targets by `comment.type` to Article, Moment, or Circle nodes.

Implementation implication:

- Article comments and moment comments share the same comment model.
- MVP should accept only `COMMENT_TYPE.article` and `COMMENT_TYPE.moment`.
- Circle comment types must be explicitly rejected for Community Watch.

## Comment Deletion / Moderation / Spam

Repo-backed facts:

- `thematters/matters-server:src/mutations/comment/deleteComment.ts` is a self/target-author delete flow. It sets `state: archived`.
- `thematters/matters-server:src/mutations/comment/updateCommentsState.ts` lets admins batch update comment states and emits `comment_banned` notifications for banned comments.
- `thematters/matters-server:src/connectors/commentService.ts` hides archived/banned comments in default list queries and exposes spam detection helpers.
- `thematters/matters-server:src/queries/comment/content.ts` returns comment content only for `active`, `collapsed`, or admin viewer; otherwise it returns an empty string.
- `thematters/matters-server:db/migrations/20251014025100_add_spam_status_to_comment_and_moment_tables.js` adds `spam_score` and `is_spam` to comments and moments.
- `thematters/matters-server:src/mutations/system/setSpamStatus.ts` lets admins set spam state on Article, Comment, or Moment.
- `thematters/matters-server:src/connectors/spamDetector.ts` calls the existing spam detector service.

Implementation implication:

- Use `COMMENT_STATE.banned` for Community Watch removals, because it already means forcibly hidden.
- Add a separate audit table to distinguish Community Watch removals from normal admin bans.
- Comment list queries or frontend filtering must be adjusted so the placeholder can render for Community Watch removed comments, even if banned comments are normally hidden.

## Reports / Ban / Audit Log

Repo-backed facts:

- `thematters/matters-server:src/mutations/system/submitReport.ts` submits reports for Article, Comment, or Moment.
- `thematters/matters-server:db/migrations/20190101113802_create_report_table.js` creates the report table.
- `thematters/matters-server:db/migrations/20231221154057_alter_report_add_reason.js` adds report reasons and renames `user_id` to `reporter_id`.
- `thematters/matters-server:src/connectors/systemService.ts` inserts reports and implements `tryCollapseComment`, but collapse is article-comment oriented and threshold-based.
- `thematters/matters-server:src/common/logger.ts` and `docs/Audit-Logging.md` implement S3/BigQuery audit logging.
- `thematters/matters-server:src/common/enums/logging.ts` defines existing audit actions such as feature flag changes.

Implementation implication:

- Existing report flow is not a good fit for the two Community Watch reasons and immediate removal behavior.
- Existing S3 audit log is not queryable enough for a public transparency page.
- Add a DB audit table for Community Watch actions, and optionally also write S3 audit events for internal observability.

## GraphQL / REST API Pattern

Repo-backed facts:

- `thematters/matters-server:src/types/comment.ts`, `src/types/system.ts`, and resolver folders show GraphQL SDL plus resolver modules as the primary API pattern.
- `thematters/matters-server:src/types/directives/auth.ts` provides auth gating through schema directives.
- `thematters/matters-server:package.json` includes code generation and test scripts for the GraphQL codebase.

Implementation implication:

- Add Community Watch APIs as GraphQL schema and resolver modules, not a separate REST service.
- Public page data should use a minimal public GraphQL query first, then add statistics later.

## Frontend Comment Components

Repo-backed facts:

- `thematters/matters-web:src/components/Comment/DropdownActions/index.tsx` is the main article/moment comment dropdown. It already renders report, delete, and admin spam controls.
- `thematters/matters-web:src/components/Comment/Content/index.tsx` renders banned/collapsed/archived comment states.
- `thematters/matters-web:src/components/Comment/Feed/index.tsx` and `src/components/Comment/Feed/gql.ts` compose the comment feed and fragments.
- `thematters/matters-web:src/common/utils/comment/index.ts` filters banned/archived comments unless active descendants exist.
- `thematters/matters-web:src/views/ArticleDetail/Comments/LatestComments/index.tsx` has additional archived filtering.
- `thematters/matters-web:src/components/Dialogs/MomentDetailDialog/Comments.tsx` currently filters active comments only.
- `thematters/matters-web:src/components/Dialogs/SubmitReportDialog/Dialog.tsx` has existing report reasons, but they do not match this project.
- `thematters/matters-web:src/components/ToggleSpam/index.tsx` and `gql.ts` implement admin spam toggles.

Implementation implication:

- Add the Community Watch entry in `Comment/DropdownActions`, visible only to users with the new flag.
- Update comment fragments to carry the minimal audit placeholder data.
- Do not rebuild the comment area.

## Admin Tools

Repo-backed facts:

- Admin role and feature flag updates are server-side in `thematters/matters-server:src/types/system.ts` and `src/mutations/system/putUserFeatureFlags.ts`.
- Admin-only web behavior is often controlled by `NEXT_PUBLIC_ADMIN_VIEW`, for example `thematters/matters-web:src/components/Comment/DropdownActions/index.tsx`.
- `thematters/matters-web:src/views/User/UserProfile/DropdownActions/index.tsx` includes staff account actions such as restrict/freeze/archive.

Implementation implication:

- Phase 1 can reuse the existing feature-flag admin mutation.
- Phase 5 should add dedicated staff review mutations and UI. It should not overload generic user ban or report flows.

## Deployment / Domain Routing

Repo-backed facts:

- `thematters/matters-server:.github/workflows/deploy.yml` builds, migrates DB, and deploys server targets.
- `thematters/matters-server:README.md` documents local Postgres/Redis and DB migration usage.
- `thematters/matters-web:.env.prod` points `NEXT_PUBLIC_API_URL` to `https://server.matters.town/graphql`.
- `thematters/matters-web:.env.prod-next` uses `NEXT_PUBLIC_SITE_DOMAIN=web-next.matters.town` and `NEXT_PUBLIC_ADMIN_VIEW=true`.
- `thematters/matters-web:.github/workflows/deploy.yml` builds and deploys web targets.
- `thematters/matters-web:next.config.ts` configures app headers and CSP.

Implementation implication:

- If public page is inside `matters-web`, add host-aware routing and deploy config for `community-watch.matters.town`.
- If public page is separate, use this repo as the public site and point it to the same GraphQL API.
- Staging must validate the full path before production DNS is changed.

## Spam Detection / Bot / Moderation Model

Repo-backed facts:

- `thematters/matters-server:src/connectors/spamDetector.ts` is the current spam detector client.
- `thematters/matters-server:db/migrations/20251014025100_add_spam_status_to_comment_and_moment_tables.js` adds spam fields.
- `thematters/matters-server:src/mutations/system/setSpamStatus.ts` handles manual admin spam state.
- GitHub org contains related repos such as `thematters/spam-detection-scaffold`, `thematters/spam-detection-serverless`, `thematters/matters-ai-comment-demo`, and `thematters/model-service`.

Implementation implication:

- Community Watch audit rows should be structured for future model training.
- First AI phase should only generate candidate hints. It must not directly remove comments.
