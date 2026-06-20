# Community Watch Signals API

The signals API exposes defensive spam-detection signals derived from public
Community Watch actions. It is designed for audit, matching, and model
improvement workflows without redistributing removed spam content.

## Data Export

`GET /signals.json`

The export returns a de-identified dataset:

- `normalizationVersion`
- `generatedAt`
- `usageNotice`
- `total`
- `records`

Each record includes the public action UUID, comment ID, reason, action state,
review state, appeal state, creation time, and hashed signal fields.

The export intentionally excludes:

- raw removed comment content
- full contact handles
- full URL paths
- author profile data

Contact values and URL domains are normalized and hashed. URL paths are never
included.

## Check API

`POST /signals/check`

Request body:

```json
{
  "text": "sample text to inspect",
  "contacts": [{ "kind": "telegram", "value": "sample_handle" }],
  "urls": ["https://example.com/path"]
}
```

All fields are optional, but callers should send at least one of `text`,
`contacts`, or `urls`.

Response body:

```json
{
  "normalizationVersion": "community-watch-signals-v1",
  "checkedAt": "2026-05-28T00:00:00.000Z",
  "verdict": "none",
  "confidence": 0,
  "matchedSignals": []
}
```

`verdict` can be:

- `match`: content or contact signals matched
- `possible_match`: URL domain signals matched
- `none`: no known signal matched

`matchedSignals` is aggregated by signal hash. It includes the signal type,
hash, count, reasons, action states, and review states. It does not include raw
source content, contact values, URL paths, or original action rows.

## Abuse Limits

The check endpoint applies request-size limits:

- `text` max length: 5000 characters
- `contacts` max count: 20
- `urls` max count: 20
- each contact field or URL max length: 500 characters

These limits are a baseline guard. Production deployment should add edge rate
limits and request logging before opening the endpoint to untrusted bulk use.

## Use Restrictions

The API is for defensive spam detection, platform integrity, and audit only.
Do not use it to reconstruct, republish, index, or amplify removed spam content.

Downstream systems should store only the minimum fields required for matching
and should keep any raw candidate text on their own side of the check flow.
