# Status

Last updated: 2026-05-10

## Current Phase

Phase 1 is in implementation review.

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

## Phase 1 PR Scope

- Adds `communityWatch` to existing `user_feature_flag` permission flow.
- Adds a DB migration that:
  - extends `user_feature_flag.type`;
  - deduplicates existing `(user_id, type)` rows;
  - adds `unique(user_id, type)`;
  - removes `communityWatch` rows before rollback enum shrink.
- Adds GraphQL schema/type support.
- Adds a focused admin mutation test for duplicate `communityWatch` input.

## Verification Notes

- `npm run gen`: passed after rebuilding local `bcrypt` native dependency.
- `npm run build`: passed.
- `MATTERS_ENV=test node --experimental-vm-modules node_modules/.bin/jest build/common/utils/__test__/communityWatchFeatureFlagMigration.test.js --runInBand --forceExit`: passed.
- Focused Jest command reached the test suite but failed before assertions because local test connections failed with `AggregateError`; this appears to be an environment/test dependency issue, not a Community Watch assertion failure.
- `npm ci` is currently blocked locally because the repo lockfile is missing several optional dependency entries. Local verification used `npm install --ignore-scripts --no-save` and `npm rebuild bcrypt` without changing `package-lock.json`.

## Next

After Phase 1 review/CI:

- Phase 2: add the Community Watch comment-removal API and DB audit table.
- Phase 3: add the minimal existing-comment-dropdown entry and placeholder rendering.
- Public page: replace mock audit records in `src/content/page.ts` with the public audit API when Phase 2 data is available.
