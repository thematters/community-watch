# Original Content Privacy Handling

Current decision: do not run automatic seven-day clearing. Keep `original_content` available for transparency and dispute review until the team makes a later retention decision.

This does not mean `original_content` must be retained after a valid privacy or personal-data request.

## Stored Fields

The audit row should keep these non-content fields for public accountability:

- public audit UUID;
- comment ID;
- source type;
- source title or source ID;
- reason;
- Community Watch member display name;
- action time;
- appeal state;
- review state;
- action state.

The risky field is:

- `original_content`

It may include personal data, scam links, contact handles, sexual content, or other harmful spam payloads.

## Public Display Policy

- `original_content` is blurred by default.
- Users can reveal it without a confirmation dialog.
- The page footer carries a warning not to redistribute spam, scam, or sexual advertising content.
- If `original_content` has been cleared, the public page should show a neutral cleared-content label instead of the original text.

Suggested public cleared label:

```text
原留言內容已因隱私或個資處理請求移除；公開紀錄仍保留非個資稽核資訊。
```

## Manual Clearing Process

Before Phase 5 tooling exists:

1. Staff confirms the request is about a specific Community Watch public record or comment ID.
2. Staff finds the matching `community_watch_action` row.
3. Staff sets `original_content = NULL`.
4. Staff sets or confirms `content_cleared = true` if the schema stores this as an explicit field.
5. Staff records the reason in internal support notes.
6. Staff verifies the public page no longer displays the original text after the next build/cache refresh.

After Phase 5 tooling exists, use `clearCommunityWatchOriginalContent(input:)` so the action leaves structured audit evidence.

## Data Export for AI Training

Do not export raw `original_content` directly into training files by default.

Recommended export fields:

- normalized reason label: `porn_ad` or `spam_ad`;
- source type;
- action time bucket;
- review state;
- appeal state;
- whether content was cleared;
- text with personal data and external dangerous links redacted, if text is needed.

Prefer reviewed/upheld rows for training and keep reversed rows for evaluation and false-positive analysis.

## Open Legal / Privacy Decisions

- Whether external URLs should be redacted before public reveal or only blurred by default.
- Whether source titles have their own long-term retention limit.
- Whether support mailbox notes should link back to public UUIDs or only internal IDs.
- Whether future automatic retention should clear only `original_content` or also reduce `source_title`.
