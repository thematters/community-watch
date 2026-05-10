# Decisions

This file records product and architecture decisions that should guide implementation.

## Accepted Decisions

- Use a small permission scope. Community Watch members can handle only article and moment comments.
- Do not support circle comments in this project. Circle is being sunset.
- Members appear publicly by their Matters display name. The audit table still stores internal `actor_id` for staff review and future audit integrity.
- Do not add a warning confirmation before unblurring public content. Keep content blurred by default and add a warning note at the bottom of the public page.
- Do not run automatic `original_content` cleanup in the current plan. Keep content available for transparency review until the team makes a later retention decision; privacy/personal-data requests can still clear stored content directly.
- Comments are not covered by anti-censorship preservation requirements for this feature.
- Public display of removed spam content has secondary-spread risk, but transparency requires inspectability. Blur-by-default is the first mitigation.
- GDPR/privacy requests should not require preserving personal data in `original_content`. If removed content contains personal data and a valid request is made, clear the stored content directly while preserving non-personal audit evidence.
- Existing banned comments may be filtered out by comment lists, so UI placeholders need enough public audit data to render even when the banned comment content is hidden or omitted.
- `user_feature_flag` currently has no unique constraint. Add `unique(user_id, type)` before relying on it for Community Watch assignment.
- Existing S3 audit logging is not suitable as the data source for the public page. A queryable DB audit table is required.

## Needs Product Decision

- Whether the public page is built inside `matters-web` with host-based routing or as a separate app in this repository.
- Whether `original_content` later gets a timed retention policy, and whether old audit metadata also gets a retention policy.
- Whether staff review labels should be visible publicly in MVP or added in Phase 5.
- Whether a restored comment should keep a visible history link in the original location.

## Needs Legal / Privacy Decision

- Exact process for clearing `original_content` after personal-data requests.
- Whether `target_title` can be stored forever, or whether only `target_id` should be retained after a longer period.
- Whether external links inside `original_content` should be redacted before display or only visually blurred.
- Public copy for the appeal process and expected response handling by `hi@matters.town`.
