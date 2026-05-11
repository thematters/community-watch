# Pre-Merge Work

This list tracks work that can proceed before `thematters/matters-server` #4762 is merged.

## Safe Before Merge

- Keep the public Astro site deployable with sample-data fallback.
- Prepare Cloudflare Pages project settings for `community-watch`.
- Add or verify custom domain routing for `community-watch.matters.town`.
- Keep `COMMUNITY_WATCH_API_URL` unset in production until the server public query is deployed.
- Run local and browser verification for `/` and `/records/{uuid}/`.
- Refine staging and production rollout checklists.
- Prepare Phase 5 staff-review API and data-model specs.
- Prepare privacy handling for `original_content` clearing.

## Wait Until #4762 Merge / Deploy

- Enable live production `COMMUNITY_WATCH_API_URL`.
- Validate live public records from real DB rows.
- Remove temporary schema bypasses from Matters web, if the deployed GraphQL schemas make them unnecessary.
- Start full staging flow with real member assignment and real comment removal.
- Open Phase 5 server implementation PRs against `develop`.

## Current Merge Gate

As of 2026-05-11, #4762 is mergeable and all visible checks pass. The remaining blocker is GitHub review state: `CHANGES_REQUESTED`.
