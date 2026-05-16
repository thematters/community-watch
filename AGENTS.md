# Agent Rules

This repository is a Matters-related public property. Before an agent pushes any
change, it must run the repo's package-manager-specific lint-fix flow and report
the result.

## Pre-Push Requirement

Run these before every push:

```bash
pnpm lint:fix
pnpm lint
```

If the change affects runtime behavior or public UI, also run the smallest
relevant validation:

```bash
pnpm build
pnpm staging:check
```

For public-page layout or interaction changes, verify a local preview in a
browser before claiming readiness.

## Reporting

Every PR body or agent final note should include the exact commands run and
whether they passed. If a command cannot run, state the blocker plainly and do
not describe the push as format-compliant.
