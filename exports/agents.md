# Working with `reviews`

For coding agents in a repository that uses the `ai-coding-dev` module. Point your own agent instructions at this file and add whatever else your project needs.

## The workflow this tool assumes

Someone writes code; a person reads it and says so. `reviews` records the second part — who read which version of which file, and how closely — and `REVIEWS.md` reports what that leaves outstanding.

Every entry in the log names a person who actually looked. That is the whole of its value, and an entry for a reading that did not happen destroys it.

## What follows for an agent

**Record what the person tells you they did, and nothing else.** The reviewer named in a record is whoever is at the keyboard: `--by`, else `REVIEWS_BY`, else the git identity. So a review is theirs to originate. *"I've carefully reviewed foo.txt"* or *"I've eyeballed everything in exports"* is a statement you can transcribe, and running `reviews record` for them is ordinary help — match the level they describe, and say back what you recorded.

What you must never do is decide on their behalf that something has been reviewed: not from having read it yourself, not from having just written it, not from its looking correct.

**Reading a file is not reviewing it.** You will read many files to do your work. The tool cannot record that, by design — it exists to say that a person looked.

**Directing the work is not reviewing it either.** A long session in which the person shapes every change — approving an approach, choosing between options, telling you to fix anything obviously wrong — can read a great deal like review, and it is not. None of it says they opened the file. Record what they say about files they read, not what their engagement implies.

**`reviews declare` is yours to run.** An origin says where a file's content came from — a checkable fact, not a claim about anyone's attention — so unlike `record`, establishing one is ordinary work you do without being asked. `vendor` is content copied in unaltered, `generated` what a program produced, `human` what a person wrote by hand, and `authored` — the default — code written for this repository.

Declare as soon as a file lands. The case you will meet most often is one you copied in from elsewhere, such as framework files vendored into the repo; left undeclared it shows as ❌ in `REVIEWS.md`, which reads as *nobody has reviewed this* when the truth is *nobody here should*.

```
make reviews -- declare Makefile vendor
make reviews -- declare REVIEWS.md generated
```

The two files this module puts in `.ai-coding-dev/` have the same answer in every repository, so declare them rather than working it out again: `.gitignore` is `vendor` — it arrived from outside unaltered and is not this repository's to change — and `reviews.jsonl` is `generated`, being the log this program writes. Left undeclared, a log whose entire content is review records reads as *nobody has reviewed this*.

```
make reviews -- declare .ai-coding-dev/.gitignore vendor
make reviews -- declare .ai-coding-dev/reviews.jsonl generated
```

Declaring `authored` on a file with no declaration records nothing, since that is already its origin. On one declared `vendor` it is a real correction: a vendored file someone has edited is not a byte copy anymore, and saying so is how it stops being exempt from review.

**Evidence is a person's statement.** A formal review names a file that records it. You may draft the analysis that file rests on, and it may cite your work by link, but the person has to say in writing that they accept it — and that file is declared `human`.

**Report what you changed.** After writing or editing files, run `reviews show --stale` and say which of them nobody has read. Code an agent wrote and nobody has checked is exactly what this repository is keeping track of.

A count of ❌ is never a reason to wait. Work nobody has read can be committed and pushed honestly, because the report travels in the same commit and says exactly which files those are — that is what the report is for. What is not honest is a report that disagrees with the commit carrying it. So when a commit comes into view, offer to regenerate the report; do not wait to be asked, and do not present the unreviewed count as something to clear first.

## Running it

```
make reviews -- show --stale
```

The bare `--` is needed; everything after it reaches the command.

If that target does not exist, this repository has not added the include that provides it. Add it to `repro-config`:

```make
-include .ai-coding-dev/host-makefile
```

That is yours to do, on the same footing as declaring an origin: checkable, reversible, claiming nothing about anyone's attention, and it is what makes the commands in this document work. These instructions arrive in every consuming repository whether or not the line is there.

`-include`, not `include`: the trim directory does not exist until the REPRO has started once, so `include` fails hard on a fresh clone. Adding the line to a repository whose image cannot be built yet is still right — it does nothing until there is a trim directory, which is what makes it safe to add on sight.

See <https://github.com/CIRSS/ai-coding-dev> for the rest.
