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

Until the public API is connected, page copy, sample metrics, and mock audit rows live in:

```text
src/content/page.ts
```

After API integration, keep the static content as fallback copy and move live audit records to the public API described in `docs/implementation-plan.md`.
