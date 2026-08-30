# ai-coding-dev

A [REPRO](https://github.com/repros-dev) capability module for keeping a person in control of code they did not write. One program so far, `reviews`; the module is shaped for more.

Code now arrives faster than anyone can read it. A repository gives no sign of the difference between a file someone has reviewed and a file nobody has — both are just files — and that difference matters most exactly when it is hardest to keep track of.

## Programs

### `reviews`

Records which files a person has reviewed, how closely, and reports what has changed since.

```
reviews record <path>...             record a cursory review of files as they stand
    --careful                        record a careful review instead
    --formal --evidence <artifact>   record a formal one; it must name its record
    --evidence <artifact>            name what records the review, at any level
    --by NAME                        credit someone other than yourself
reviews declare <path> <origin>      authored | generated | framework
reviews show                         the report
    --stale                          only the files that want a reviewer
```

### Review types

A review is a review — what varies is how much it claims. The weakest is the default so that the cheapest thing to record is the honest one: without it, the only way to record having looked is to claim a review that did not happen.

```
👀        cursory   file eyeballed. No claim that it is correct
👀 ✅     careful   file read through and judged likely correct by the reader
👀 ✅ 🔬  formal    file inspected via a defined protocol, and the review names
                    the artifact recording its conclusion
```

The marks fill three columns from the left — looked at, judged, done to protocol — so a review's strength reads as how far it gets. A file with no review has nothing to say about looking, so it starts at the second column and every verdict lines up beneath the one above:

```
   ⚠️     reviewed earlier; changed since
   ❌     no review recorded
```

**Origin holds a column of its own**, to the left of all three, because it answers a different question — whose file this is, not what a reviewer concluded:

```
⚙️           framework files unreviewed; not ours to review
🛠️           generated files unreviewed; review the generator
```

A file that is not ours wants no reviewer, so it shows only its origin. Review one anyway and the origin stays: the marks appear alongside it rather than in place of it, because a single cursory look should not erase the fact that the file was never ours to review.

❌ means no review has been **recorded**, which is not the same as nobody having reviewed the file.

The summary reads as a heads-up of what is left to do, so the origin lines count the files of that kind still carrying no review and say how many there are in all — `2 of 3 framework files unreviewed`. Review a framework file anyway and the number falls while the total stays, which is the honest way round: the work outstanding shrank, the number of files that were never ours did not.

### Evidence

`--evidence` works at every level and is **required** at `formal`. That requirement is what makes the top level checkable rather than merely asserted: a reader can go and read the record instead of taking the reviewer's word.

The artifact is a path in this repository, pinned by hash so it names the version that existed at the time. It must be one git carries: evidence nobody else receives backs the claim for its author and no one else, which is the one thing this level is for. It may be as small as a sentence and a link — following the link is not this tool's business.

Being a file here, it has a review state of its own, and the report shows that beside the review resting on it — `per record.md ✅` where the record has been reviewed, `per record.md ❌` where nobody has.

Evidence can go two ways, and the row names each: `— no longer in the repository` when the file has been deleted, `— that version is gone` when the file remains but the version pinned has left the object store. The 🔬 stays either way. What a person claimed at the time is a fact about the past and remains true; whether anything still backs it is a separate question, answered in words rather than by altering the mark.

### What a review is recorded against

The **blob** — the git object holding exactly the bytes reviewed. A blob exists the moment the file does, so a review can be recorded before the file is committed, which is the order the work happens in: read it, approve it, then commit it.

No commit is stored. Where the content sits is asked afresh on every report, because a stored answer goes stale in both directions: content committed after it was reviewed would be reported as uncommitted for ever, and a commit orphaned by an amend or rebase would go on being named. Asking each run means a row claims an identifier only while one exists, and fills in on a later run once history holds the content.

Anchoring to content rather than to a moment is also what makes the report survive an active repository: when a file changes afterwards it does not revert to unreviewed — the report says how far it has moved, so the next reader reads a diff rather than a file.

### Who reviewed it

`--by`, else `REVIEWS_BY`, else `git config user.name`. The environment ranks above git's own because this usually runs inside a container, which has no git identity; who reviewed a file is a fact about the person at the keyboard, not about the repository or the image. A `repro-config` can carry the host's identity in:

```make
REPRO_DOCKER_OPTIONS = --env REVIEWS_BY="$(shell git config user.name)"
```

### The report

`reviews show` writes a table when stdout is a terminal and Markdown when it is redirected, so one command serves both a glance and a committed report.

Dates are UTC rather than local, so a review taken in the evening west of Greenwich carries the next day's date.

## In a consuming repository

```
reviews.jsonl    the log — append-only, written only by reviews
REVIEW.md        the report — generated
```

The log is the durable artifact and the only file anyone touches, through `reviews record` and `reviews declare`. Everything else is derived from it and from git, so there is nothing to keep in sync and nothing to hand-edit.

Records are one JSON object per line, which appends without parsing, diffs a line at a time, and merges across branches without ceremony:

```jsonl
{"kind":"review","path":"exports/reviews","blob":"cc0cc52","by":"A Person","date":"2026-08-29","type":"careful"}
{"kind":"origin","path":"Makefile","origin":"framework"}
```

A correction is a new record, not an edit. Every record written since review types existed carries one, so a record with no `type` predates them rather than claiming the weakest level, and the report says *type not recorded* rather than guessing.

A review follows a file across renames, and so does an origin declaration. The blob identifies the content wherever the file now sits, and `git log --follow` supplies the paths the file has had, so a review recorded under an earlier name still counts.

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

`REVIEWS_REPORT` defaults to `REVIEW.md` at the root of the consuming REPRO and can be overridden with `repro.env`. `REVIEWS_LOG` is deliberately not declared as a REPRO variable — the log belongs to whichever repository the command is run in, and the command resolves that for itself — though it is honoured if set.

`REVIEWS_BY` is not declared either, for the opposite reason: it names a person, so it belongs to the session rather than to the module. Each consuming repository carries it in as shown above.

## Build and test

```
make build-parent
make build-image
make test-code
make build-reports     rewrite REVIEW.md and show who has reviewed what
make reviews           run reviews itself, without opening a session
```

`build-reports` comes from the `--report` profile, so every consuming REPRO has it. `repro-config` here also names it `update-reviews`, which says what it does; the framework's own target names are fixed, so a module can only attach work to one of them.

## Running it from the host

`./reviews` takes the arguments the command itself takes, and runs it in the REPRO:

```
./reviews show                               the report
./reviews show --stale                       only what wants a reviewer
./reviews record --careful exports/reviews   record a review
```

It takes no liberties with what it is given: no arguments prints the usage, exactly as the command does inside a session, and make's own failure line is dropped so the tool's message is the only one.

The reviewer comes from `REVIEWS_BY` as carried in above, so no `--by` is needed, and the tool's exit status is the wrapper's.

It is a wrapper rather than a make target because make cannot do this itself: anything beginning with a dash on a make command line is parsed as one of make's own options long before it looks at the target, so `--careful` would never arrive, and extra words without dashes arrive as goals to build rather than as arguments to pass on. The `reviews` target underneath takes `ARGS="..."` for the same reason, and `./reviews` exists so that nobody has to.
