# Matters Community Watch

Matters Community Watch is the public-site and implementation workspace for 「馬特市守望相助隊」.

The project goal is to let a small set of trusted citizens remove spam comments while keeping every action publicly auditable: who handled which comment, when, why, what appeal/review state it is in, and how Matters staff can recover or override the action.

Production page:

- https://community-watch.matters.town/

## Public Page

This repository now owns the standalone Astro static site for the public transparency page. The page was split out from `thematters/design-system` after the prototype became a real public property.

Edit page copy, fallback moderation records, appeal text, and AI-training notes here:

```text
src/content/page.ts
```

Build-time API integration lives here:

```text
src/content/communityWatchData.ts
```

Set `COMMUNITY_WATCH_API_URL` to use the Matters server public GraphQL audit queries. When it is unset or unavailable, the page keeps using the local fallback records.

Main UI files:

- `src/pages/index.astro`
- `src/styles/global.css`
- `src/styles/vendor/tokens.css`
- `public/images/`

Local development:

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
```

Deployment notes live in [DEPLOYMENT.md](DEPLOYMENT.md).

## Scope

MVP scope:

- Admin can assign or remove the `communityWatch` permission for users.
- Community Watch members can remove only article and moment comments.
- First version reasons are limited to:
  - `porn_ad`: 色情廣告
  - `spam_ad`: 濫發廣告
- Removed comments are replaced in-place with: `本則貼文已由守望相助隊檢舉`.
- The replacement links to a public audit record on `community-watch.matters.town`.
- Original removed content is blurred by default on the public page.
- `original_content` is not automatically cleared in the current plan; privacy/personal-data requests can still clear stored content directly.
- Appeals go through `hi@matters.town` with the removed comment ID.
- AI is not allowed to remove comments in the first version. It can only provide future candidate detection or hints.

Out of scope for MVP:

- Circle comments, because circle is being sunset.
- Article deletion, moment body deletion, account suspension, or any site-wide ban power.
- Heavy multi-step approval workflow.
- AI auto-removal.
- Rebuilding the existing comment UI.

## Repository Role

This repository is the planning and public-site home for Community Watch. Product/backend/frontend changes will still land in the existing Matters repositories:

- `thematters/matters-server`: GraphQL API, DB migrations, permission checks, audit table, comment state updates.
- `thematters/matters-web`: comment dropdown entry, removed-comment placeholder, public page integration if implemented in the main web app.
- `thematters/design-system`: shared UI components, tokens, and brand guidance consumed by this public page.

## Current Status

Phase 0 is complete as repo-backed planning, and the standalone public page is now in this repository:

- [docs/decisions.md](docs/decisions.md)
- [docs/phase-0-repo-survey.md](docs/phase-0-repo-survey.md)
- [docs/implementation-plan.md](docs/implementation-plan.md)
- [docs/public-api-contract.md](docs/public-api-contract.md)
- [docs/staging-verification.md](docs/staging-verification.md)
- [docs/status.md](docs/status.md)

Next implementation target: after the server-side public query is deployed, set `COMMUNITY_WATCH_API_URL` in the Pages environment and verify the public page against real audit records.
