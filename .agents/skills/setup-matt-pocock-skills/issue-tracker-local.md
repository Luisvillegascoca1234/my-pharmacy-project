# Issue Tracker: Local Markdown

The canonical spec and its execution tickets live as versionable Markdown files under `.scratch/`.

## Layout

```text
.scratch/
└── <feature-slug>/
    ├── spec.md
    └── tickets/
        ├── 01-tb-01-backend-<slug>.md
        ├── 02-tb-01-ui-<slug>.md
        ├── 03-tb-01-code-review-<slug>.md
        ├── ...
        ├── <NN>-qa-spec.md
        └── <NN>-docs-user-guide.md
```

## Conventions

- Keep one feature per `.scratch/<feature-slug>/` directory.
- Store the canonical spec at `.scratch/<feature-slug>/spec.md`.
- Store every ticket in its own file under `.scratch/<feature-slug>/tickets/`; never create a combined tickets file.
- Number tickets from `01` in their mandatory execution order.
- Link every ticket to `[the canonical spec](../spec.md)`.
- Use only `**Status:** TODO` and `**Status:** DONE`.
- Create every ticket as `TODO`; change it to `DONE` only after satisfying its acceptance criteria.
- Use exactly one objective: `BACKEND`, `UI`, `CODE REVIEW`, `QA`, or `DOCS`.
- Link `Blocked by` to the immediately preceding ticket. Only the first ticket has no blocker.
- Keep comments and execution notes under `## Comments`.

## Publishing

- When `/to-spec` publishes, create `.scratch/<feature-slug>/spec.md`.
- When `/to-tickets` publishes, create `.scratch/<feature-slug>/tickets/` and one numbered file per approved ticket.

## Fetching

- Fetch a spec from the supplied `.scratch/<feature-slug>/spec.md` path.
- Fetch a ticket from its supplied path or resolve a number within that feature's `tickets/` directory.

## Selecting the next ticket

Start with ticket `01`. After that, select the lowest-numbered `TODO` ticket only when its immediately preceding blocker is `DONE`. Never skip an earlier `TODO` ticket and never work tickets in parallel.

