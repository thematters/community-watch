# Staging Verification

Run this full checklist on `matters.icu` before marking `thematters/matters-server` #4772 ready for production.

Production release rule:

- Keep #4772 as draft until every required item below passes.
- Do not merge #4772 to `master` from CI success alone.
- If any stop condition is hit, pause production rollout and fix the issue on `develop` first.

## Environments

| Surface | URL | Expected State |
| --- | --- | --- |
| Matters staging web | `https://matters.icu` | Includes `thematters/matters-web` #5881 Community Watch UI. |
| Matters staging GraphQL | `https://server.matters.icu/graphql` | Exposes Community Watch public queries and member/staff mutations. |
| Community Watch public page | `https://community-watch.matters.town` or a staging Pages deployment | Can show audit records from the target GraphQL endpoint. |
| Production release PR | https://github.com/thematters/matters-server/pull/4772 | Must remain draft until this checklist passes. |

If the public page is being tested against staging data, use a staging Pages deployment or local Cloudflare preview with:

```bash
COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql pnpm preview
```

Do not point the production custom domain at staging data.

## Test Accounts

Fill this before starting.

| Role | Matters Account | Email/Login Owner | Notes |
| --- | --- | --- | --- |
| Admin/staff |  |  | Can assign feature flags and run staff review actions. |
| Community Watch candidate |  |  | Will receive and later lose `communityWatch`. |
| Normal user |  |  | Must never see Community Watch actions. |
| Article author/commenter |  |  | Creates article comments to remove. |
| Moment author/commenter |  |  | Creates moment comments to remove. |

## Test Content

Create fresh staging content so the audit records are easy to identify.

| Content | URL | Source ID | Comment ID | Comment Text Summary |
| --- | --- | --- | --- | --- |
| Article comment for `色情廣告` |  |  |  |  |
| Article comment for `濫發廣告` |  |  |  |  |
| Moment comment for `色情廣告` |  |  |  |  |
| Moment comment for `濫發廣告` |  |  |  |  |
| Circle comment, only if still available |  |  |  |  |

Use obvious test spam text, but avoid real malicious links, real personal data, or real adult content.

## Preflight

| Check | Expected Result | Pass/Fail | Evidence |
| --- | --- | --- | --- |
| Staging server schema | `server.matters.icu` exposes `communityWatchActions`, `communityWatchAction`, `communityWatchRemoveComment`, `updateCommunityWatchActionState`, `restoreCommunityWatchComment`, and `clearCommunityWatchOriginalContent`. |  |  |
| Staging web deployment | `matters.icu` includes Community Watch comment-menu UI from #5881. |  |  |
| Public page data source | The test public page points at `server.matters.icu` when verifying staging records. |  |  |
| Appeal owner | `hi@matters.town` owner knows this test is happening. |  |  |
| Release PR state | #4772 is draft before staging verification starts. |  |  |

## Required Flow

| Step | Actor | Action | Expected Result | Evidence | Pass/Fail |
| --- | --- | --- | --- | --- | --- |
| 1 | Admin | Assign candidate the `communityWatch` feature flag. | Candidate has Community Watch permission after reload. | Admin action time, target account, screenshot or API result. |  |
| 2 | Candidate | Open article comment menu. | `色情廣告` and `濫發廣告` actions are visible. | Screenshot. |  |
| 3 | Candidate | Open moment comment menu. | `色情廣告` and `濫發廣告` actions are visible. | Screenshot. |  |
| 4 | Normal user | Open the same article and moment comment menus. | Community Watch actions are not visible. | Screenshot. |  |
| 5 | Candidate | Remove article comment with `色情廣告`. | Comment is removed; audit row is created. | Comment ID, audit UUID, mutation result or screenshot. |  |
| 6 | Everyone | Reload original article. | Removed comment renders `本則貼文已由守望相助隊檢舉`. | Screenshot of placeholder. |  |
| 7 | Everyone | Open placeholder link. | Public record opens for the same audit UUID. | Public record URL and screenshot. |  |
| 8 | Candidate | Remove moment comment with `濫發廣告`. | Comment is removed; audit row is created. | Comment ID, audit UUID, mutation result or screenshot. |  |
| 9 | Everyone | Reload original moment. | Removed comment renders the same placeholder and links to its public record. | Screenshot. |  |
| 10 | Candidate | Try circle comment if the surface still exists. | Removal is rejected; no audit row is created. | Error result or screenshot. |  |
| 11 | Candidate | Check available UI actions. | No path allows article deletion, moment body deletion, account suspension, or site-wide ban. | Notes and screenshots. |  |
| 12 | Admin | Remove candidate's `communityWatch` feature flag. | Candidate loses permission after reload. | Admin action time and target account. |  |
| 13 | Candidate | Retry comment menu and stale mutation after permission removal. | UI actions disappear; stale mutation is rejected. | Screenshot plus API error. |  |
| 14 | Staff | Restore one removed comment. | Comment state is restored and audit review state becomes reversed. | Audit UUID, screenshot/API result. |  |
| 15 | Staff | Adjust reason on one record. | Public record shows updated reason/review state. | Before/after screenshot. |  |
| 16 | Staff | Mark appeal state on one record. | Public record shows appeal status change. | Before/after screenshot. |  |
| 17 | Staff | Clear `originalContent` on one record. | Public record preserves metadata and shows cleared-content text. | Before/after screenshot. |  |

## Public Record Checks

Run these for every audit UUID created during the test.

| Field/Behavior | Expected Result | Pass/Fail | Evidence |
| --- | --- | --- | --- |
| Public record URL | URL is `/records/{uuid}/` and matches the placeholder link. |  |  |
| Comment ID | Shows the removed comment ID. |  |  |
| Source | Shows article/moment source type and source title or ID. |  |  |
| Reason | Shows only `色情廣告` or `濫發廣告`. |  |  |
| Actor | Shows the Community Watch member's Matters display name, not internal user ID. |  |  |
| Time | Shows removal time. |  |  |
| Appeal | Shows `hi@matters.town` appeal instruction. |  |  |
| Review state | Shows pending/upheld/reversed/reason-adjusted as staff actions change it. |  |  |
| Original content default | Content is blurred by default. |  |  |
| Reveal interaction | Clicking `顯示全文` reveals text and changes button to `收起全文`. |  |  |
| No dialog | No extra warning confirmation appears before reveal. |  |  |
| Footer warning | Bottom warning text remains visible on the page. |  |  |
| Cleared content | After staff clearing, original content is not displayed, but audit metadata remains. |  |  |

## Stop Conditions

Stop and do not mark #4772 ready if any of these happen:

- A non-member can see or call Community Watch removal.
- A member can affect anything other than article or moment comments.
- Circle comments can be removed.
- Removed comments disappear entirely instead of showing the placeholder.
- Placeholder links do not resolve to a matching public record.
- Public records expose internal user IDs, emails, IP addresses, staff notes, or hidden account data.
- Staff restore does not restore the comment while marking the audit state consistently.
- Clearing `originalContent` deletes the whole audit record instead of preserving metadata.
- The public page turns into a spam-content display wall without blur by default.

## Failure Handling

| Symptom | First Check |
| --- | --- |
| Feature flag assignment does not take effect | Check `user_feature_flag` row and viewer `oss.featureFlags`. |
| Candidate sees no menu actions | Confirm `matters.icu` web deployment includes #5881 and viewer feature flags are fresh after reload. |
| Removal mutation fails for candidate | Check viewer permission and target comment source type. |
| Removal succeeds but no public record appears | Check `community_watch_action` insert and public `communityWatchAction` query. |
| Placeholder does not render | Check whether banned comments are included with `Comment.communityWatchAction` data. |
| Public page has sample records only | Confirm the test page is using `COMMUNITY_WATCH_API_URL=https://server.matters.icu/graphql` and staging has at least one audit row. |
| Restore/reason/appeal changes do not show | Check `community_watch_review_event` insert and public record query response. |

## Release Decision

When every required item passes:

1. Save the evidence links/screenshots in the project tracker or rollout notes.
2. Add a comment on #4772 summarizing the passed `matters.icu` verification.
3. Mark #4772 ready for review.
4. After approval, merge #4772 to `master`.
5. Watch production `Push Schema to Apollo` and `Deploy` workflows.
6. Verify `server.matters.town/graphql` exposes Community Watch queries/mutations.
7. Verify `community-watch.matters.town` reads live production audit records once a production record exists.
