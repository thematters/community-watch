# Community Watch Production Rollout

This checklist starts after the `matters.icu` staging flow has passed. Do not use it to skip staging validation.

## Current Staging Evidence

Verified on 2026-05-14:

- Article comment flow passed on `matters.icu`.
- Moment comment flow passed on `matters.icu`.
- Admin profile toggle is visible on staging.
- Existing member badge backfill is visible through staging GraphQL: `info.badges: [{ type: "community_watch" }]`.
- `community-watch.matters.town` currently reads staging data through the temporary Pages binding `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql`.
- Public record pages return `Cache-Control: no-store`.

Important staging records:

- Article comment record: `https://community-watch.matters.town/records/7ac9cd2d-abc9-4afb-bdce-ddecb4c5ca51/`
- Moment comment record: `https://community-watch.matters.town/records/014cb8ce-cc22-42a8-bbb9-55233c01a525/`

## Release PR

Server production release PR:

- PR: `https://github.com/thematters/matters-server/pull/4772`
- Base: `master`
- Head: `develop`
- Title: `Release Community Watch to production`

As of 2026-05-14 after `matters-server` #4790:

- Build check: passed.
- Codecov checks: passed.
- PR state: draft.
- WIP check: blocked while draft.
- Review: required.

## Go / No-Go Gate

Proceed only when all items are true:

- Staging article comment E2E passed.
- Staging moment comment E2E passed.
- Admin can assign or remove `communityWatch` from the frontend.
- Community Watch member can remove only article and moment comments.
- Public record page shows reason, actor display name, source type, comment ID, appeal copy, review state, and blurred original content.
- Admin restore works and public record changes to restored/reversed.
- Existing Community Watch members have the `community_watch` badge after backfill.
- `hi@matters.town` is prepared to receive appeals.
- Human approval is given for production rollout.

## Production Rollout Steps

1. Mark `thematters/matters-server` #4772 ready for review.
2. Wait for required review approval and branch protection checks.
3. Merge #4772 into `master`.
4. Wait for production server migration and deployment to finish.
5. Verify production GraphQL exposes the public Community Watch fields:

```sh
curl -sS https://server.matters.town/graphql \
  -H 'content-type: application/json' \
  --data '{"query":"query { __type(name:\"Query\") { fields { name } } }"}' \
  | rg 'communityWatchAction|communityWatchActions'
```

6. In Cloudflare Pages, change the production runtime binding:

```txt
COMMUNITY_WATCH_API_URL=https://server.matters.town/graphql
```

7. Redeploy `community-watch` production Pages after the binding change.
8. Verify `https://community-watch.matters.town/` returns 200 and `Cache-Control: no-store`.
9. Verify the homepage reads production records or shows an empty live state, not staging records.
10. Verify `/records/{uuid}/` for a production record after the first real production action.
11. Run a production smoke test with a controlled test comment only after human approval.

## Production Smoke Test

Minimum smoke test:

- Assign one trusted account as Community Watch member on production.
- Create one clearly labeled test comment without real ad links, adult content, or personal data.
- Remove it with either `色情廣告` or `濫發廣告`.
- Confirm original place shows `本則貼文已由守望相助隊檢舉`.
- Open the public record on `community-watch.matters.town`.
- Confirm original content is blurred by default and can be revealed.
- Restore the comment as admin.
- Confirm public record changes to restored/reversed.
- Remove the test Community Watch permission if the account should not remain a member.

## Rollback

If server production rollout fails:

- Revert or roll forward server release according to the normal Matters production process.
- Remove the Pages binding or set it back to sample fallback only if production GraphQL is unavailable:

```txt
COMMUNITY_WATCH_API_URL=
```

If public site reads the wrong environment:

- Immediately set `COMMUNITY_WATCH_API_URL` to the intended endpoint.
- Redeploy Pages.
- Recheck root and record routes.

If a production Community Watch action is wrong:

- Restore the comment through staff review.
- Update review state and note.
- Clear `originalContent` if the record contains valid personal-data or privacy-risk content.
- Disable the member's `communityWatch` permission if misuse is suspected.

## Post-Launch Monitoring

For the first production day, check:

- Number of Community Watch records.
- Number of restored/reversed records.
- Any appeal email to `hi@matters.town`.
- Any unexpected `communityWatchRemoveComment` errors.
- Public page still returns `Cache-Control: no-store`.
- Public page still points to `https://server.matters.town/graphql`, not staging.
