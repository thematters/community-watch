# Merge Boundary Work

This list tracks what was safe before `thematters/matters-server` #4762 merged and what became available after merge.

## Merge Status

#4762 was merged into `thematters/matters-server:develop` on 2026-05-11.

- Merge commit: `82235f10d`
- Branch: `codex/community-watch-phase1`
- Base: `develop`

## Safe Before Merge

- Keep the public Astro site deployable with sample-data fallback.
- Prepare Cloudflare Pages project settings for `community-watch`.
- Add or verify custom domain routing for `community-watch.matters.town`.
- Keep `COMMUNITY_WATCH_API_URL` unset in production until the server public query is deployed.
- Run local and browser verification for `/` and `/records/{uuid}/`.
- Refine staging and production rollout checklists.
- Prepare Phase 5 staff-review API and data-model specs.
- Prepare privacy handling for `original_content` clearing.

## Available After Merge / Deploy

- Enable live production `COMMUNITY_WATCH_API_URL`.
- Validate live public records from real DB rows.
- Remove temporary schema bypasses from Matters web, if the deployed GraphQL schemas make them unnecessary.
- Start full staging flow with real member assignment and real comment removal.
- Open Phase 5 server implementation PRs against `develop`.
