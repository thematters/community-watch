# Staging Verification

Run this before production rollout.

## Required Flow

1. Assign a test account as Community Watch member.
2. Confirm the account sees the comment action in article comments.
3. Remove an article comment with reason `色情廣告`.
4. Confirm the original comment renders as `本則貼文已由守望相助隊檢舉`.
5. Open the public audit link.
6. Confirm the public page shows:
   - comment ID;
   - source type and source title or ID;
   - reason;
   - member display name;
   - removal time;
   - appeal instruction with `hi@matters.town`;
   - original content blurred by default.
7. Repeat for a moment comment with reason `濫發廣告`.
8. Confirm circle comments are rejected.
9. Confirm the member cannot remove article bodies, moment bodies, users, or any account state.
10. Remove the member's `communityWatch` flag.
11. Confirm the account no longer sees the action and server mutation rejects stale calls.
12. Restore a removed comment through staff tooling once Phase 5 exists.
13. Confirm the public record shows the review/restoration state.
14. Run the original-content cleanup job against expired test data.
15. Confirm `original_content` is cleared after 7 days while audit metadata remains.

## Production Approval Gate

Production rollout needs explicit human approval after staging passes.

Approval should confirm:

- Domain routing for `community-watch.matters.town`.
- Rollback path for DB migrations.
- Scheduled cleanup for `original_content`.
- Staff owner for `hi@matters.town` appeals.
- Staff owner for member assignment/removal.
- Monitoring for failed removals, duplicate removals, and permission errors.
- Public copy reviewed for privacy and appeal clarity.
