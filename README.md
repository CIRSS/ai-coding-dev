# ai-coding-dev

A [REPRO](https://github.com/repros-dev) capability module for keeping a person in control of code they did not write. One program so far, `reviews`; the module is shaped for more.

## Programs

### `reviews`

Records which files a person has reviewed, how closely, and reports what has changed since.

```
reviews record <path>...             record a cursory review of files as they stand
    --careful                        record a careful review instead
    --formal --evidence <artifact>   record a formal one; it must name its record
    --evidence <artifact>            name what records the review
    --by NAME                        credit someone other than yourself
reviews declare <path> <origin>      authored | generated | vendor | human
reviews show                         the report
    --stale                          only the files that want a reviewer
```

### Review types

Reviews vary in degree of care and formality.  This tool distinguishes three successive levels of attention paid to the contents of each file.  The iconography employed in review reports indicates these levels:

```
👀        cursory   file eyeballed. No claim that it is correct
👀 ✅     careful   file read through and judged likely correct by the reader
👀 ✅ 🔬  formal    file inspected via a defined protocol, and the review names
                    the artifact recording its conclusion
```

Files that currently need at least a minimal review of their current contents are indicated by these icons:

```
   ⚠️     reviewed earlier; changed since
   ❌     no review recorded
```

Files not requiring review in a particular repository are indicated as follows:

```
⚙️           vendored files unreviewed; not ours to review
🛠️           generated files unreviewed; review the generator
✍️     🟢    written by a person; reviewed by definition
```

The first three columns record what somebody did. 🟢 is the exception: it says a file needs no attention because a person wrote it, not because anyone read it.

Reading one turns the circle into a check — 👀 ✅, with ✍️ still in front. A cursory review counts as careful here: the file was clear before anyone looked, so a glance is not what makes it so. Editing one puts the circle back; a file a person writes never wants re-reading, so it does not go ⚠️ and does not appear under `--stale`.

A report summary section serves as a heads-up of reviews currently needed.

### Evidence

`--evidence` names a file in this repository that records the review. It is optional at `cursory` and `careful`, and required at `formal`.

The artifact is a person's record of what they did. Evidence an agent wrote is not evidence: a formal review would then rest on the same thing it exists to check. Declaring it `human` says so.

It may still rest on an agent's work, as long as a person says so in it:

```
Reviewed and approved the agent-authored review in
[agent-reviews/review-2026-11-05.md](agent-reviews/review-2026-11-05.md).
```

That sentence is the point. An agent's review can be relied on; nobody's reliance on it should be silent.

The artifact is pinned by hash, so it names the version that existed when the review was recorded. It must be a file git carries. It can be as small as a sentence and a link; this tool does not follow links.

The report names the artifact at the end of the reviewing file's row:

```
👀 ✅ 🔬  exports/reviews  A Person  unchanged since a1b2c3d, per inspection.md
```

The artifact is not itself judged there — an inspection record is written by the person inspecting, so nobody having reviewed it is the ordinary case.

If the artifact is deleted, or the version pinned leaves the object store, the review falls back to `careful` and the row stops naming it. A formal review is one that names the record of itself, so a review whose record has gone no longer is one. The log still holds what was claimed at the time.

### What a review is recorded against

The git blob: the object holding exactly the bytes reviewed. A blob exists as soon as the file does, so a review can be recorded before the file is committed.

No commit is stored. The report resolves the blob to a commit each time it runs, so a review recorded before a commit starts naming that commit once it lands, and stops naming one an amend or rebase has orphaned.

A file edited after review is not reported as unreviewed. The report says how far it has moved.

### Who reviewed it

Taken from `--by`, else `REVIEWS_BY`, else `git config user.name`. A container has no git identity of its own, so a `repro-config` can carry the host's in:

```make
REPRO_DOCKER_OPTIONS = --env REVIEWS_BY="$(shell git config user.name)"
```

### The report

`reviews show` writes a table at a terminal and Markdown when redirected. Dates are UTC.

## In a consuming repository

```
reviews.jsonl    the log — append-only, written only by reviews
REVIEW.md        the report — generated
```

The log is the only file anyone touches, through `reviews record` and `reviews declare`. Everything else is derived from it and from git.

Records are one JSON object per line:

```jsonl
{"kind":"review","path":"exports/reviews","blob":"cc0cc52","by":"A Person","date":"2026-08-29","type":"careful"}
{"kind":"origin","path":"Makefile","origin":"framework"}
```

A correction is a new record, not an edit. A record with no `type` predates review types, and the report says *type not recorded* rather than assuming the weakest.

Reviews and origin declarations both follow a file across renames.

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

`REVIEWS_REPORT` defaults to `REVIEW.md` at the root of the consuming REPRO and can be overridden with `repro.env`. `REVIEWS_LOG` and `REVIEWS_BY` are not declared: the log belongs to whichever repository the command runs in, and the reviewer to the session.

## Build and test

```
make build-parent
make build-image
make test-code
make build-reports     rewrite REVIEW.md and show who has reviewed what
make reviews           run reviews itself, without opening a session
```

`build-reports` comes from the `--report` profile, so every consuming REPRO has it. `repro-config` here also names it `update-reviews`.

## Running it from the host

`./reviews` takes the arguments the command itself takes, and runs it in the REPRO:

```
./reviews show                               the report
./reviews show --stale                       only what wants a reviewer
./reviews record --careful exports/reviews   record a review
```

No arguments prints the usage. The reviewer comes from `REVIEWS_BY`, so no `--by` is needed, and the tool's exit status is the wrapper's.

It is a wrapper rather than a make target because make parses anything beginning with a dash as one of its own options, so `--careful` would never reach the tool. The `reviews` target underneath takes `ARGS="..."` instead.
