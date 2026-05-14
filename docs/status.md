# Status

Last updated: 2026-05-14

## Current Phase

Phase 1 through Phase 5 are on `develop`. The Phase 5 staff review API is deployed on staging (`server.matters.icu`) and exposes the Community Watch remove, review update, restore, and original-content clearing mutations. Production (`server.matters.town`) has not been rolled out yet.

## Completed

- Created public project repository: `thematters/community-watch`.
- Split the public transparency page out of `thematters/design-system` into this standalone repository.
- Added the Astro public site for `community-watch.matters.town`.
- Completed Phase 0 repo-backed survey and implementation plan.
- Opened Phase 1 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase1`
  - PR: https://github.com/thematters/matters-server/pull/4762
- Added a migration unit test after Codecov reported missing rollback coverage for the Phase 1 migration.
- Fixed #4762 TypeScript build failure from fetched upload MIME-type inference:
  - Commit: `81693d7ed`
  - Normalizes remote `content-type` headers to strings before MIME allow-list checks and upload payload construction.
- Addressed #4762 CTO review feedback that knex queries should live under `src/connectors`:
  - Commit: `b3543d34f`
  - Moved the `Comment.communityWatchAction` active audit lookup from the resolver to `CommentService.findActiveCommunityWatchAction`.
- Resolved #4762 merge conflict with updated `origin/develop`:
  - Commit: `5e3684ebe`
  - Conflict was only in `src/connectors/medium/index.ts`; kept the MIME-type guard and develop's `Invalid content-type.` error text.
  - Push build and pull_request build both passed after rerunning the transient `channel/feedback.test.js` failure.
- Merged Phase 1 server PR #4762 on 2026-05-11:
  - Merge commit: `82235f10d`
  - This completes the server-side `communityWatch` feature flag assignment foundation on `develop`.
  - Merge-time `Push Schema to Apollo` workflow completed successfully for the develop schema.
- Opened Phase 2 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase2`
  - Base branch while stacked: `codex/community-watch-phase1`
  - PR: https://github.com/thematters/matters-server/pull/4763
- Merged Phase 2 server PR #4763 on 2026-05-10.
- Fixed Phase 2 Codecov patch coverage by adding a GraphQL-level Community Watch mutation test in the CI upload batch.
- Opened Phase 3 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase3-server`
  - Base branch while stacked: `codex/community-watch-phase1`
  - PR: https://github.com/thematters/matters-server/pull/4764
- Merged Phase 3 server PR #4764 on 2026-05-11.
- Opened Phase 3 web PR:
  - Repository: `thematters/matters-web`
  - Branch: `codex/community-watch-phase3`
  - Base branch: `develop`
  - PR: https://github.com/thematters/matters-web/pull/5881
- Merged Phase 3 web PR #5881 on 2026-05-11.
- Opened Phase 4 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase4-server`
  - Base branch while stacked: `codex/community-watch-phase3-server`
  - PR: https://github.com/thematters/matters-server/pull/4765
- Merged Phase 4 server PR #4765 on 2026-05-11.
- Pushed a Phase 4 server coverage fix after Codecov reported only 18.18% patch coverage:
  - Commit: `e7f2e49a4`
  - Adds GraphQL-level public audit query coverage to `src/types/__test__/2/comment.test.ts`.
- Opened and merged Phase 4 server follow-up PR #4769 against `develop`:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase4-develop`
  - PR: https://github.com/thematters/matters-server/pull/4769
  - Reason: #4765 was merged into the stacked base `codex/community-watch-phase3-server`; its public root queries were not present on `origin/develop` after #4762 merged.
  - Cherry-picked the Phase 4 public query commits and moved the knex-backed public audit reads into `CommentService` to follow the existing connector pattern.
  - Local verification: `npm run build`, `npm run lint`, and `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchPublicQueries.test.js --runInBand --forceExit` passed.
  - GitHub checks: push build, pull_request build, `codecov/patch`, `codecov/project`, and WIP passed.
  - Merged on 2026-05-11 with merge commit `fc0789792`.
- Verified post-merge server deployment:
  - `Push Schema (develop)` completed successfully.
  - Develop deploy workflow completed successfully after rerun: migration, EB deploy, Lambda deploys, and notification all passed.
  - `https://server.matters.icu/graphql` accepts `communityWatchActions(input:)` and currently returns `totalCount: 0`.
  - `https://server.matters.town/graphql` does not expose `communityWatchActions` yet; production rollout is still pending human approval.
- Opened Phase 5 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase5`
  - Base branch: `develop`
  - PR: https://github.com/thematters/matters-server/pull/4771
  - Adds append-only `community_watch_review_event` records for staff actions.
  - Adds admin-only mutations: `updateCommunityWatchActionState`, `restoreCommunityWatchComment`, and `clearCommunityWatchOriginalContent`.
  - Keeps Community Watch member disablement on the existing admin `putUserFeatureFlags` path.
  - Rejects setting `reviewState: reversed` through the generic update mutation; staff must use `restoreCommunityWatchComment` so the comment state and audit state stay consistent.
  - Local verification: `npm run gen`, `npm run build`, `npm run lint`, and focused Jest for review-event migration plus staff-review service/mutations passed.
  - GitHub checks: push build, pull_request build, `codecov/patch`, and `codecov/project` passed before merge.
- Merged Phase 5 server PR #4771 on 2026-05-11:
  - Merge commit: `1207bc23e`.
  - `Push Schema (develop)` completed successfully; production schema push was skipped.
  - Develop deploy workflow completed successfully: build, DB migration, EB deploy, Lambda deploys, and notification all passed.
  - `https://server.matters.icu/graphql` exposes `communityWatchRemoveComment`, `updateCommunityWatchActionState`, `restoreCommunityWatchComment`, and `clearCommunityWatchOriginalContent`.
  - `https://server.matters.town/graphql` does not expose the Community Watch mutations yet; production rollout still needs human approval.
- Advanced pre-merge Phase 4-6 work in this repo:
  - Expanded `DEPLOYMENT.md` with Cloudflare Pages setup, environment variables, rollout order, rollback, and production gate.
  - Expanded `docs/staging-verification.md` into a role-based staging checklist with expected results and failure handling.
  - Added `docs/pre-merge-work.md` to separate safe pre-merge work from items that need #4762 merge/deploy.
  - Added `docs/phase-5-staff-review.md` for admin review, restore, appeal state, reason adjustment, and content clearing API planning.
  - Added `docs/privacy-original-content.md` for manual and future structured clearing of `original_content`.
  - Added a bottom-page warning label to the public site without adding a reveal confirmation dialog.
  - Verified the updated public site with `pnpm typecheck`, `pnpm build`, API-failure fallback build, and in-app browser checks for `/` and `/records/cw-demo-8f2a71/`.
- Advanced Phase 6 public-site reliability work after #4771 merged:
  - Converted the public site from static-only Astro output to Cloudflare server rendering with `@astrojs/cloudflare`.
  - Kept the existing visual page and sample fallback, but changed `/records/{uuid}/` to resolve records on demand through the public GraphQL detail query.
  - Added public cache headers on the landing page and record detail pages; later changed both dynamic pages to `Cache-Control: no-store` for staging validation freshness.
  - Updated local preview to use `wrangler pages dev` because Astro 4's Cloudflare adapter does not support `astro preview`.
  - Updated deployment docs to describe runtime API reads and Cloudflare Pages Functions output.
- Added a read-only staging preflight script in `scripts/staging-check.mjs`:
  - Confirms `server.matters.icu` exposes the required Community Watch public queries and staff/member mutations.
  - Confirms public audit record count without authentication.
  - Optionally checks the authenticated viewer role and `communityWatch` feature flag when `MATTERS_STAGING_ACCESS_TOKEN` is provided.
  - Does not run mutations, output tokens, or store credentials.
- Began `matters.icu` staging validation on 2026-05-13:
  - Safari is logged in as `mashbean`.
  - The article admin menu confirms admin-level UI access on staging.
  - Public API schema is deployed, but `communityWatchActions(input: { first: 5 })` currently returns `totalCount: 0`.
  - Safari does not currently allow JavaScript from the address bar or Apple Events, so authenticated API preflight requires a temporary staging access token or manual browser operation.
- Merged server follow-up PR #4775 on 2026-05-13:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-primary-audit-read`
  - PR: https://github.com/thematters/matters-server/pull/4775
  - Reason: staging E2E showed staff restore returned the updated action, but the public query could still read stale read-replica values.
  - Change: `CommentService` now reads Community Watch audit records from the primary database for the active comment action, public action detail, and public action list.
  - Local verification: `npm run build`, targeted Community Watch Jest files, and targeted ESLint passed.
  - GitHub checks: push build, pull_request build, `codecov/patch`, and `codecov/project` passed.
  - Develop deployment passed: schema push, DB migration, EB deploy, Lambda deploys, and notification all completed successfully.
- Re-verified staging public reads after #4775:
  - `pnpm staging:check` passed against `https://server.matters.icu/graphql`.
  - Public API now returns the prior E2E record `957ebd2b-ac4a-4fa6-ba62-0e9c3d79e748` as `actionState: restored` and `reviewState: reversed`.
  - Local Cloudflare preview with `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql` shows the record detail page, comment ID `Q29tbWVudDozNjkzMg`, actor display name `mashbean`, and review status `已恢復`.
  - `community-watch.matters.town` still uses production/sample data, so staging public-page validation should use a staging preview or local preview until production rollout is approved.
- Temporarily configured Cloudflare Pages production binding for staging validation:
  - Project: `community-watch`.
  - Binding: `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql`.
  - Manual deployment completed at `https://ca069b50.community-watch.pages.dev`.
  - `https://community-watch.matters.town` now reads staging public records for `matters.icu` validation.
  - Verified both `/records/73cfede7-8d54-48ec-bb41-42b96b0b92ce` and `/records/73cfede7-8d54-48ec-bb41-42b96b0b92ce/` return 200 and show the restored staging audit record.
  - Re-verified root and record pages return `Cache-Control: no-store`; the root page no longer shows the former `公開 API` label.
  - Before production rollout, switch this binding to `https://server.matters.town/graphql` after server production deploy, or remove it to return to sample fallback.

## Phase 1 PR Scope

- Adds `communityWatch` to existing `user_feature_flag` permission flow.
- Adds a DB migration that:
  - extends `user_feature_flag.type`;
  - deduplicates existing `(user_id, type)` rows;
  - adds `unique(user_id, type)`;
  - removes `communityWatch` rows before rollback enum shrink.
- Adds GraphQL schema/type support.
- Adds a focused admin mutation test for duplicate `communityWatch` input.

## Phase 2 PR Scope

- Adds `community_watch_action` as the DB audit table for Community Watch comment removals.
- Stores the original comment content for seven days via `content_expires_at`; later cleanup should clear `original_content`.
- Adds `communityWatchRemoveComment(input: { id, reason })`.
- Keeps the removal scope to existing article and moment comments only; circle comments are intentionally rejected.
- Reuses the existing `banned` comment state for removed comments.
- Requires the existing `communityWatch` feature flag on the viewer.
- Accepts only the first-version reasons: `porn_ad` and `spam_ad`.
- Writes audit evidence, triggers the existing `comment_banned` notification, and invalidates article/moment cache.
- Covers migration rollback plus resolver success/error paths with focused tests.

## Phase 3 PR Scope

Server PR #4764:

- Adds `Comment.communityWatchAction` to expose the active Community Watch audit record for a banned comment.
- Returns the public audit `uuid`, reason, and created time so the web client can render a stable public record link.
- Keeps this as a read-side resolver on the existing `community_watch_action` DB audit table instead of adding a parallel moderation state.
- Covers the new field in the existing Community Watch mutation GraphQL test.

Web PR #5881:

- Adds viewer-side `isCommunityWatch` detection from the existing `oss.featureFlags` viewer fragment.
- Adds two Community Watch-only comment menu actions: `色情廣告` and `濫發廣告`.
- Adds the bottom warning label `所有處理都會公開留痕`; no extra confirmation dialog is added.
- Replaces Community Watch removed comments with the placeholder `本則貼文已由守望相助隊檢舉`.
- Links the placeholder to `https://community-watch.matters.town/records/{uuid}`.
- Keeps Community Watch removed comments in article and moment comment lists so placeholders can render even though the stored comment state is `banned`.
- Leaves circle comments untouched because circle is out of scope.

## Phase 4 PR Scope

Server PR #4765:

- Adds public root query `communityWatchActions(input:)` for recent audit records.
- Adds public root query `communityWatchAction(input: { uuid })` for one audit record.
- Expands `CommunityWatchAction` with fields needed by `community-watch.matters.town`:
  - `commentId`;
  - `sourceType`;
  - `sourceTitle`;
  - `sourceId`;
  - `actorDisplayName`;
  - `actionState`;
  - `appealState`;
  - `reviewState`;
  - `originalContent`;
  - `contentCleared`;
  - `createdAt`.
- Keeps actor identity public only as Matters display name; internal `actor_id` remains DB-only.
- Maps internal numeric comment/source IDs to public GraphQL IDs.
- Does not change the Phase 2 removal mutation.

## Phase 5 PR Scope

Server PR #4771:

- Adds `community_watch_review_event` as an append-only staff action log.
- Adds staff-only GraphQL mutations:
  - `updateCommunityWatchActionState(input:)` for appeal state, review state, and reason updates.
  - `restoreCommunityWatchComment(input:)` for restoring a Community Watch removed comment and marking the audit row reversed.
  - `clearCommunityWatchOriginalContent(input:)` for privacy or personal-data clearing while keeping non-content audit metadata.
- Reuses the existing `community_watch_action` public read model; public records remain visible after restore or content clearing.
- Reuses the existing `putUserFeatureFlags` admin path to disable Community Watch members.
- Keeps knex-backed review and restore writes under `src/connectors/commentService.ts`.

## Verification Notes

- `npm run gen`: passed after rebuilding local `bcrypt` native dependency.
- `npm run build`: passed.
- `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchFeatureFlagMigration.test.js --runInBand --forceExit`: passed.
- GitHub `codecov/patch`: passed after the migration unit test was added.
- GitHub `build / build`: one PR build passed; the push build is being rerun after a DB connection flake in `circle.test`.
- Focused Jest command reached the test suite but failed before assertions because local test connections failed with `AggregateError`; this appears to be an environment/test dependency issue, not a Community Watch assertion failure.
- `npm ci` is currently blocked locally because the repo lockfile is missing several optional dependency entries. Local verification used `npm install --ignore-scripts --no-save` and `npm rebuild bcrypt` without changing `package-lock.json`.
- Phase 2 local verification:
  - `git diff --check`: passed.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchActionMigration.test.js build/common/utils/__test__/communityWatchRemoveComment.test.js --runInBand --forceExit`: passed, 12 tests.
  - Coverage for `src/mutations/comment/communityWatchRemoveComment.ts`: 100% lines, 90% branches.
  - `npm run test:utils` is still blocked locally by the repo script's `--no-experimental-fetch` flag under Node 24; the equivalent targeted Jest command without that flag passes.
- Phase 2 CI after coverage fix:
  - GitHub `build / build`: passed on commit `5db47f5663987f0dbfd5aa24e82e5ba20f3d8b73`.
  - GitHub `codecov/patch`: passed; Codecov reports 81.91% patch coverage.
  - GitHub `codecov/project`: passed; Codecov reports 57.96% project coverage.
- Phase 3 server local verification:
  - `npm run build`: passed.
  - `npm run lint`: passed.
  - `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchActionMigration.test.js build/common/utils/__test__/communityWatchRemoveComment.test.js --runInBand --forceExit`: passed, 12 tests.
- Phase 3 server CI:
  - GitHub `build / build`: passed on commit `032d829abd05e60232cf0772b06953196f54397a`.
  - GitHub `codecov/patch`: passed; Codecov reports 100.00% patch coverage.
  - GitHub `codecov/project`: passed; Codecov reports 57.97% project coverage.
- Phase 3 web local verification:
  - `npm run lint:ts`: passed.
  - `npm run lint`: passed via pre-commit.
  - `npm run test:unit -- src/common/utils/comment.test.ts src/components/Comment/Content/Content.test.tsx src/components/Comment/DropdownActions/DropdownActions.test.tsx`: passed, 15 tests.
  - React tests still print existing `MemoryRouterProvider` act warnings and a react-spring deprecation warning; assertions pass.
- Phase 3 web CI dependency:
  - `thematters/matters-web` CI runs `npm run gen:type` against `server.matters.icu` and `server.matters.town`.
  - Web PR #5881 originally failed at `Generate Types (Develop)` because those endpoints do not yet expose `CommunityWatchRemoveCommentReason`, `communityWatchRemoveComment`, or `Comment.communityWatchAction`.
  - Web PR #5881 now includes a temporary local codegen schema extension in `src/common/utils/types/index.ts` to unblock CI before #4764 is deployed.
  - Runtime still depends on server PR #4764 or equivalent API support; remove the temporary schema extension after the deployed schemas include these fields.
  - After the bypass: `npm run gen:type`, `npm run gen:type:prod`, `npm run lint:ts`, and targeted unit tests passed locally.
- Retention decision update:
  - Do not run automatic `original_content` cleanup in the current plan.
  - Privacy/personal-data requests can still clear `original_content` directly while keeping non-personal audit metadata.
- Phase 4-6 no-server-dependency work:
  - Added `/records/{uuid}/` static public record detail pages using the current sample records.
  - Added blurred-by-default original-content reveal behavior on the detail page.
  - Labeled sample audit rows as demonstration data until the public API is connected.
  - Added `docs/public-api-contract.md` for the future public list/detail query shape.
  - Updated deployment and staging notes so they no longer require a seven-day cleanup job.
  - Added build-time API data-source wiring behind `COMMUNITY_WATCH_API_URL`, with sample-record fallback when the server API is not deployed or unavailable.
  - Updated docs so Cloudflare Pages can enable live public audit records by setting `COMMUNITY_WATCH_API_URL` after the server public query is deployed.
  - `pnpm typecheck`: passed.
  - `pnpm build`: passed and generated `/`, plus three `/records/cw-demo-*/` static pages.
  - Latest pre-merge public site verification after docs/UI updates:
    - `pnpm typecheck`: passed.
    - `pnpm build`: passed.
    - `COMMUNITY_WATCH_API_URL=http://127.0.0.1:9/graphql pnpm build`: passed and fell back to sample records.
    - In-app browser check for `http://127.0.0.1:4321/`: hero, recent records, record links, reveal buttons, and bottom warning were present.
    - In-app browser check for `http://127.0.0.1:4321/records/cw-demo-8f2a71/`: comment ID, appeal email, bottom warning, and reveal/collapse interaction worked; console had no errors or warnings.
  - Smoke-tested `http://127.0.0.1:4321/` and `http://127.0.0.1:4321/records/cw-demo-8f2a71/`: both returned 200.
  - `COMMUNITY_WATCH_API_URL=http://127.0.0.1:9/graphql pnpm build`: passed and fell back to sample records.
  - Mock GraphQL build verification: `COMMUNITY_WATCH_API_URL=http://127.0.0.1:9876/graphql pnpm build` generated `/records/cw-live-test/` and rendered API-sourced record content.
  - Staging GraphQL build verification: `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql pnpm build` passed. Because staging currently has zero Community Watch audit rows, the build generated the index page only.
  - API-failure fallback build verification: `COMMUNITY_WATCH_API_URL=http://127.0.0.1:9/graphql pnpm build` passed and fell back to sample records.
- Phase 4 server local verification:
  - `npm run build`: passed.
  - `npm run lint`: passed.
  - `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchPublicQueries.test.js --runInBand --forceExit`: passed, 3 tests.
  - Added DB-backed GraphQL coverage for `communityWatchActions` and `communityWatchAction` in `src/types/__test__/2/comment.test.ts`.
  - Local `build/types/__test__/2/comment.test.js` still fails before assertions with the existing test database `AggregateError`; CI should verify this suite in the GitHub Actions environment.
- Phase 4 server CI after coverage fix:
  - GitHub `build / build`: passed on commit `e7f2e49a4`.
  - GitHub `codecov/patch`: passed.
  - GitHub `codecov/project`: passed.
- Phase 5 server local verification:
  - `npm run gen`: passed.
  - `npm run build`: passed.
  - `npm run lint`: passed.
  - `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchReviewEventMigration.test.js build/common/utils/__test__/communityWatchStaffReview.test.js --runInBand --forceExit`: passed, 9 tests.
- Phase 5 server CI:
  - GitHub push `build / build`: passed.
  - GitHub pull_request `build / build`: passed.
  - GitHub `codecov/patch`: passed.
  - GitHub `codecov/project`: passed.
- Phase 5 post-merge deploy:
  - `Push Schema (develop)`: passed.
  - Develop deploy workflow: passed.
  - Staging GraphQL exposes `communityWatchRemoveComment`, `updateCommunityWatchActionState`, `restoreCommunityWatchComment`, and `clearCommunityWatchOriginalContent`.
  - Production GraphQL does not expose the Community Watch mutations yet; production rollout remains gated on human approval.
- Phase 6 public site runtime verification:
  - `pnpm typecheck`: passed.
  - `pnpm build`: passed with Cloudflare server output.
  - `wrangler pages dev dist --compatibility-date=2026-05-07 --port 4321`: started successfully.
  - In-app browser check for `http://localhost:4321/`: passed with sample fallback records.
  - In-app browser check for `http://localhost:4321/records/cw-demo-8f2a71/`: passed; blurred content reveal toggled from `顯示全文` to `收起全文`.
  - Header check: `/` and `/records/cw-demo-8f2a71/` both return `Cache-Control: public, max-age=60, s-maxage=60`.
  - Staging API binding check with `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql`: the index rendered `公開 API`; staging still has zero live Community Watch rows.
  - Detail fallback check: non-UUID demo IDs stay on sample data, while a UUID-shaped missing record renders the local "找不到這筆公開紀錄" message.
- Phase 6 Cloudflare Pages deployment:
  - Confirmed the `community-watch` Pages project exists under the Matters Lab Cloudflare account.
  - Confirmed custom domain `community-watch.matters.town` is attached to the Pages project.
  - Set production Pages runtime secret `COMMUNITY_WATCH_API_URL` to `https://server.matters.town/graphql`.
  - Deployed commit `4c87990` to production Pages:
    - Deployment ID: `fea8f282-ec58-40b5-8c59-5f926f4c2ca8`.
    - Deployment URL: `https://fea8f282.community-watch.pages.dev`.
  - Verified `https://community-watch.matters.town/` returns 200 with `Cache-Control: public, max-age=60, s-maxage=60`.
  - Verified `https://community-watch.matters.town/records/cw-demo-8f2a71/` returns 200 with the same cache header.
  - In-app browser check on the production domain passed for the homepage, sample record detail page, appeal email, and blurred-content reveal interaction.
  - Production Matters server does not expose the public Community Watch query yet, so the production public site currently falls back to sample records. It will read production audit records after the server production rollout exposes `communityWatchActions` and `communityWatchAction`.
- Production server release PR:
  - Opened `thematters/matters-server` #4772: `Release Community Watch to production`.
  - PR URL: https://github.com/thematters/matters-server/pull/4772
  - Base: `master`; head: `develop`.
  - Release PR is mergeable but intentionally kept as draft.
  - Checks passed: `build / build`, `WIP`, `codecov/patch`, and `codecov/project`.
  - Production/master rollout is gated on full stable-flow verification on `matters.icu`.
  - Required staging flow before master:
    - admin assigns a Community Watch member;
    - the member sees the remove UI in article and moment comment menus;
    - the member removes comments with `色情廣告` and `濫發廣告`;
    - removed comments render the placeholder in the original UI;
    - removed records appear on the Community Watch public page/API;
    - admin/staff can review removed content and run restore, reason adjustment, appeal state update, and original-content clearing.
  - After the `matters.icu` flow passes, #4772 can be marked ready and merged to `master`.
- Staging verification checklist:
  - Expanded `docs/staging-verification.md` into an executable `matters.icu` acceptance checklist.
  - The checklist now includes environment URLs, test-account table, test-content table, preflight checks, step-by-step pass/fail evidence fields, public record checks, stop conditions, failure handling, and the release decision sequence for #4772.
- Governance rules:
  - Added `docs/community-watch-rules.md` as the v0.1 trial rules for Community Watch membership.
  - Covers joining, exit, trial period, term length, qualification maintenance, suspension, handling scope, conflicts of interest, public audit records, appeal/review, privacy, and AI boundaries.
- Governance and staging copy refresh:
  - Updated `docs/community-watch-rules.md` to the latest v0.1 wording: formal Taiwan usage, `濫用風險`, `紀錄公開`, no automatic seven-day original-content clearing statement, and first-stage AI as candidate hints only.
  - Regenerated `docs/馬特市守望相助隊規章-v0.1.docx` from the latest rules.
  - Reworked `docs/staging-verification.md` into a `matters.icu` release gate focused on admin assignment, member removal, frontend placeholder, public records, staff review, restore, reason adjustment, appeal state update, and original-content clearing.
  - Updated public-page copy in `src/content/page.ts`, live API fallback copy in `src/content/communityWatchData.ts`, and record-detail appeal wording in `src/pages/records/[uuid].astro` to match the formal rules.
  - Verification: `pnpm typecheck` passed; `pnpm build` passed with the existing Cloudflare adapter cleanup warning.
- PR merge status:
  - `thematters/matters-server` #4762, #4763, #4764, #4765, #4769, and #4771 are merged.
  - `thematters/matters-web` #5881 is merged.
  - #4762 merge commit on `develop`: `82235f10d`.
  - #4769 merge commit on `develop`: `fc0789792`.
  - #4771 merge commit on `develop`: `1207bc23e`.

## Next

- Run the full stable-flow verification on `matters.icu`.
- Use `docs/staging-verification.md` as the source checklist for evidence and pass/fail status.
- After the `matters.icu` flow passes, mark `thematters/matters-server` #4772 ready for review/merge and run production rollout.
- After production server rollout, verify live audit records render on `https://community-watch.matters.town/` and `/records/{uuid}/`.
- Run the staging flow in `docs/staging-verification.md`.
- Run staff restore / reason adjustment / content clearing against real Community Watch audit rows on staging.
- Add monitoring/operational checks for failed removals, duplicate removals, permission errors, and public-page API failures.
