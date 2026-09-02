# Working with `reviews`

For coding agents in a repository that uses the `ai-coding-dev` module. Point your own agent instructions at this file and add whatever else your project needs.

## The workflow this tool assumes

Someone writes code; a person reads it and says so. `reviews` records the second part — who read which version of which file, and how closely — and `REVIEW.md` reports what that leaves outstanding.

Every entry in the log names a person who actually looked. That is the whole of its value, and an entry for a reading that did not happen destroys it.

## What follows for an agent

**Record what the person tells you they did, and nothing else.** The reviewer named in a record is whoever is at the keyboard: `--by`, else `REVIEWS_BY`, else the git identity. So a review is theirs to originate. *"I've carefully reviewed foo.txt"* or *"I've eyeballed everything in exports"* is a statement you can transcribe, and running `reviews record` for them is ordinary help — match the level they describe, and say back what you recorded.

What you must never do is decide on their behalf that something has been reviewed: not from having read it yourself, not from having just written it, not from its looking correct.

**Reading a file is not reviewing it.** You will read many files to do your work. The tool cannot record that, by design — it exists to say that a person looked.

**`reviews declare` is different.** An origin says where a file came from: `vendor` for content copied in unaltered, `generated` for what a program produced, `human` for what a person wrote by hand, and `authored` — the default — for the ordinary case of code written for this repository. That is a checkable fact rather than a claim about anyone's attention, so establishing one is ordinary work. Declaring `authored` on a file that has no declaration records nothing, since that is already its origin. On one declared `vendor` it is a real correction: a vendored file someone has edited is not a byte copy any more, and saying so is how it stops being exempt from review.

**Evidence is a person's statement.** A formal review names a file that records it. You may draft the analysis that file rests on, and it may cite your work by link, but the person has to say in writing that they accept it — and that file is declared `human`.

**Report what you changed.** After writing or editing files, run `reviews show --stale` and say which of them nobody has read. Code an agent wrote and nobody has checked is exactly what this repository is keeping track of.

## Running it

```
make reviews -- show --stale
```

The bare `--` is needed; everything after it reaches the command. See
<https://github.com/CIRSS/ai-coding-dev> for the rest.
