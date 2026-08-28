# ai-coding-dev

A [REPRO](https://github.com/repros-dev) capability module of programs for keeping a person in control of code they did not write.

Code now arrives faster than anyone can read it. A repository gives no sign of the difference between a file someone has read and a file nobody has — both are just files — and that difference matters most exactly when it is hardest to keep track of.

## Programs

### `reviews`

Records which files a person has read, and reports what has changed since.

```
reviews record <path>... [--by NAME]     stamp files as read, as of HEAD
reviews declare <path> <origin>          authored | generated | framework
reviews show [--stale]                   the report
```

A reading is recorded against a **commit**, not against the file's bytes. That is what makes the report survive an active repository: when a file changes afterwards it does not revert to unread — the report says how far it has moved, so the next reader reads a diff rather than a file.

```
✅  read, and unchanged since
⚠️  read at 5f61055, +12 −3 since
❌  no reading recorded
⚙️  framework; not ours to read
🛠️  generated; read its generator instead
```

❌ means no reading has been **recorded**, which is not the same as nobody having read the file.

`--by` defaults to `git config user.name`. A file must be committed and unmodified before a reading of it can be recorded: a reading names a commit, so what was read has to be in one.

`reviews show` writes a table when stdout is a terminal and Markdown when it is redirected, so one command serves both a glance and a committed report.

## In a consuming repository

```
reviews.jsonl    the log — append-only, written only by reviews
REVIEW.md        the report — generated
```

The log is the durable artifact and the only file anyone touches, through `reviews record` and `reviews declare`. Everything else is derived from it and from git, so there is nothing to keep in sync and nothing to hand-edit.

Records are one JSON object per line, which appends without parsing, diffs a line at a time, and merges across branches without ceremony:

```jsonl
{"kind":"review","path":"exports/reviews","commit":"5f61055","by":"A Person","date":"2026-08-28"}
{"kind":"origin","path":"Makefile","origin":"framework"}
```

A reading follows a file across renames: it names the commit and the path the file had when it was read, and those two identify the content regardless of where the file sits now.

## Requiring the module

```
repro.require ai-coding-dev main ${CIRSS}
```

**The consuming REPRO must provide Node.** `repro.require` copies programs, not runtimes, and the REPRO base image has none. Any repository with a JavaScript test suite already satisfies this.

Two profiles beyond the base:

```
--report    adds make build-reports, writing the report to ${REVIEWS_REPORT}
--code      adds make test-code, for a repository running Mocha
```

`REVIEWS_REPORT` defaults to `REVIEW.md` at the root of the consuming REPRO and can be overridden with `repro.env`. `REVIEWS_LOG` is deliberately not declared: the log belongs to whichever repository the command is run in, and the command resolves that for itself.

## Build and test

```
make build-parent
make build-image
make test-code
```
