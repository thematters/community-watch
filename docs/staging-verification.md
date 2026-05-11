# Staging Verification

Run this before production rollout.

## Preconditions

- Server migrations are applied on staging.
- Matters web points to the staging GraphQL endpoint that includes Community Watch mutations and public audit queries.
- `community-watch` staging build has `COMMUNITY_WATCH_API_URL` set to the staging GraphQL endpoint.
- Test accounts are prepared:
  - one admin/staff account;
  - one Community Watch member candidate;
  - one normal user;
  - one author/commenter account for creating test comments.
- Test content exists:
  - one article with at least two comments;
  - one moment with at least two comments;
  - one circle comment only if staging still has circle surfaces available, to confirm it is rejected.
- `hi@matters.town` appeal owner is identified for the rollout test.

## Required Flow

| Step | Actor | Expected Result | Evidence |
| --- | --- | --- | --- |
| 1 | Admin | Assign the candidate account the `communityWatch` feature flag. | Admin action time and target user. |
| 2 | Candidate | Reload Matters web and confirm article/moment comment menus show Community Watch actions. | Screenshot of menu. |
| 3 | Normal user | Confirm a normal account does not see the Community Watch actions. | Screenshot of menu. |
| 4 | Candidate | Remove an article comment with reason `色情廣告`. | Removed comment ID and public record link. |
| 5 | Everyone | Original article comment renders as `本則貼文已由守望相助隊檢舉`. | Screenshot of placeholder. |
| 6 | Everyone | Placeholder link opens the matching public record. | URL and screenshot. |
| 7 | Candidate | Remove a moment comment with reason `濫發廣告`. | Removed comment ID and public record link. |
| 8 | Everyone | Original moment comment renders the same placeholder and public record link. | Screenshot of placeholder. |
| 9 | Candidate | Attempt to remove a circle comment if available. | Server rejects it; no audit record is created. |
| 10 | Candidate | Confirm no UI/API path allows article deletion, moment body deletion, account suspension, or site-wide ban. | Notes from menu/API checks. |
| 11 | Admin | Remove the candidate account's `communityWatch` flag. | Admin action time. |
| 12 | Candidate | Reload and confirm actions disappear; stale mutation calls are rejected. | Screenshot plus API error. |
| 13 | Staff | Restore a removed comment through staff tooling once Phase 5 exists. | Review action record. |
| 14 | Everyone | Public record shows restoration/review state once Phase 5 exists. | Screenshot. |
| 15 | Staff | Confirm no automatic `original_content` cleanup job is enabled in the current rollout. | Job/config check. |
| 16 | Staff | Simulate a privacy/personal-data request by clearing `original_content` directly while preserving audit metadata. | Record before/after. |

## Public Record Checks

For every public record opened during staging, confirm it shows:

- comment ID;
- source type and source title or ID;
- reason;
- member display name;
- removal time;
- appeal instruction with `hi@matters.town`;
- original content blurred by default.

Then click `顯示全文` and confirm:

- content becomes readable only after the click;
- button text changes to `收起全文`;
- no extra confirmation dialog appears;
- bottom warning text remains visible somewhere near the page footer.

## Failure Handling

- If assignment does not take effect after reload, check the `user_feature_flag` row and GraphQL viewer feature flags.
- If removal succeeds but no public record appears, check `community_watch_action` insert and public query response.
- If the placeholder does not render, check whether banned comments are still included with enough `communityWatchAction` data for the UI.
- If a non-member can call the mutation, stop rollout.
- If a member can affect anything other than article/moment comments, stop rollout.
- If `originalContent` exposes internal user IDs or hidden account data, stop rollout and clear the affected content.

## Production Approval Gate

Production rollout needs explicit human approval after staging passes.

Approval should confirm:

- Domain routing for `community-watch.matters.town`.
- Rollback path for DB migrations.
- Current decision that no automatic `original_content` cleanup runs before a later retention decision.
- Staff owner for `hi@matters.town` appeals.
- Staff owner for member assignment/removal.
- Monitoring for failed removals, duplicate removals, and permission errors.
- Public copy reviewed for privacy and appeal clarity.
