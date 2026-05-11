# Status

Last updated: 2026-05-11

## Current Phase

Only Phase 1 server PR #4762 remains open. It is mergeable after resolving the latest `develop` conflict, and all visible checks now pass; GitHub still shows `CHANGES_REQUESTED` until the CTO review state is cleared. Phase 2 server, Phase 3 server/web, and Phase 4 server PRs have been merged.

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
- Advanced pre-merge Phase 4-6 work in this repo:
  - Expanded `DEPLOYMENT.md` with Cloudflare Pages setup, environment variables, rollout order, rollback, and production gate.
  - Expanded `docs/staging-verification.md` into a role-based staging checklist with expected results and failure handling.
  - Added `docs/pre-merge-work.md` to separate safe pre-merge work from items that need #4762 merge/deploy.
  - Added `docs/phase-5-staff-review.md` for admin review, restore, appeal state, reason adjustment, and content clearing API planning.
  - Added `docs/privacy-original-content.md` for manual and future structured clearing of `original_content`.
  - Added a bottom-page warning label to the public site without adding a reveal confirmation dialog.
  - Verified the updated public site with `pnpm typecheck`, `pnpm build`, API-failure fallback build, and in-app browser checks for `/` and `/records/cw-demo-8f2a71/`.

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
- Current open PR:
  - `thematters/matters-server` #4762 remains open against `develop`.
  - #4762 is no longer draft.
  - #4762 GitHub `build / build` passed on commit `b3543d34f` after the connector refactor.
  - #4762 GitHub `codecov/patch` and `codecov/project` passed after the connector refactor.
  - #4762 is mergeable after merging `origin/develop`; push build passed on merge commit `5e3684ebe`.
  - The pull_request build on `5e3684ebe` initially failed in develop's `channel/feedback.test.js` setup (`createTopicChannel` undefined), but the rerun passed.
  - #4762 still shows `CHANGES_REQUESTED`; the remaining blocker is review-state cleanup, not merge conflict or CI.
  - `thematters/matters-server` #4763, #4764, #4765 and `thematters/matters-web` #5881 are merged.

## Next

After Phase 1 server PR #4762 is merged and the public query is deployed:

- Set `COMMUNITY_WATCH_API_URL` for the public site and verify live audit records render on `/` and `/records/{uuid}/`.
- Phase 5: add staff review and appeal status workflows.
- Phase 6: configure `community-watch.matters.town`, staging validation, monitoring, and human production approval.
