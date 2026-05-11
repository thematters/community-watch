# Deployment

`community-watch.matters.town` is a static Astro site intended for Cloudflare Pages.

## Cloudflare Pages

- Project: `community-watch`
- Production domain: `community-watch.matters.town`
- Build command: `pnpm build`
- Build output directory: `dist`
- Production branch: `main`

## Manual Deploy

When deploying without Git integration:

```bash
pnpm install
pnpm build
CLOUDFLARE_ACCOUNT_ID=<account-id> pnpm dlx wrangler pages deploy dist --project-name community-watch --branch main
```

## Local Verification

```bash
pnpm install
pnpm build
pnpm preview
```

## Content Source

Page copy and fallback sample audit rows live in:

```text
src/content/page.ts
```

Build-time API integration lives in:

```text
src/content/communityWatchData.ts
```

The sample rows are explicitly labeled as demonstration data on the page. Set `COMMUNITY_WATCH_API_URL` to fetch live public audit records at build time; if the API is unavailable, the build falls back to the sample rows.

Optional build-time environment:

```bash
COMMUNITY_WATCH_API_URL=https://server.matters.town/graphql
COMMUNITY_WATCH_API_FIRST=50
```

## Public Routes

- `/`: landing page, statistics, recent records, appeal copy.
- `/records/{uuid}/`: public record detail page with blurred original content and appeal instructions.

These routes can be built and deployed before the Matters server public audit schema is deployed, because they fall back to local sample data.
