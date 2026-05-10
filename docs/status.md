# Status

Last updated: 2026-05-10

## Current Phase

Phase 2 is in implementation review as a stacked PR on Phase 1.

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
- Opened Phase 2 server PR:
  - Repository: `thematters/matters-server`
  - Branch: `codex/community-watch-phase2`
  - Base branch while stacked: `codex/community-watch-phase1`
  - PR: https://github.com/thematters/matters-server/pull/4763
- Fixed Phase 2 Codecov patch coverage by adding a GraphQL-level Community Watch mutation test in the CI upload batch.

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

## Next

After Phase 1 and Phase 2 review/CI:

- Phase 3: add the minimal existing-comment-dropdown entry and placeholder rendering.
- Phase 4: replace mock audit records in `src/content/page.ts` with the public audit API.
- Add a retention cleanup job or scheduled operation that clears `community_watch_action.original_content` after seven days.
