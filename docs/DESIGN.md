# Design

Why this profile is built the way it is. Written down because most of the
decisions look arbitrary until you know which constraint forced them.

## The constraints

A GitHub README is not a web page. What it will and will not run decides
everything else:

| Works | Does not work |
| --- | --- |
| CSS `@keyframes` and SMIL **inside** an SVG file | JavaScript, including inside SVG |
| `<details>` / `<summary>` | `:hover` — pointer events never reach an `<img>` |
| `<a>` wrapping an image | `<style>` in the markdown itself |
| `<picture>` + `prefers-color-scheme` | `<iframe>`, `onclick`, any handler |
| Heading anchors (`#section`) | External fonts or images referenced from an SVG |

So "interactive" has to be assembled from three separate layers:

1. **Autonomous animation** — the SVG has to look alive with no input, because
   it cannot receive any.
2. **Clicking** — `<a>`-wrapped cards and `<details>` are the entire interaction
   vocabulary.
3. **Issue-driven Actions** — the only way a visitor can change what the page
   says. Deferred to phase 2 (see below).

## Decisions

### Assets live on a `runtime` branch, not `main`

The obvious build would commit regenerated SVGs to `main` daily. That fills the
history with bot commits, and — contrary to a common belief — those commits do
**not** green your contribution graph: commits authored as `github-actions[bot]`
are attributed to the bot, not to you.

Instead `README.md` references `raw.githubusercontent.com/.../runtime/...`, and
the workflow force-pushes an orphan `runtime` branch holding exactly one commit.
`main` never takes a bot commit; `runtime` never grows.

The cost is that `raw.githubusercontent` caches branch-pinned files for five
minutes (`Cache-Control: max-age=300`), so updates are near-live rather than
instant. That is a good trade for a graph that changes once a day.

### One palette, in `scripts/theme.mjs`

Every generated SVG reads its colours from there, including the snake — the
workflow feeds `assets/snk-outputs.txt` (generated from the theme) to
Platane/snk rather than hard-coding hex values in YAML. Retheming is a one-file
edit, with no graphic left behind in the old colours.

### Headings carry no punctuation

GitHub adds heading anchors in its own rendering pipeline, not in the Markdown
API, so a slug cannot be verified without publishing. Rather than guess how
`agent · builder` is slugged, headings are plain lowercase words — every
slugger agrees on those. `assertLinkable()` in `render-readme.mjs` fails the
build if a heading would produce anything ambiguous. The decoration lives in the
agent cards, where it cannot break a link.

### The workload chart clips at the 95th percentile

A single 30-contribution day would flatten every ordinary day into a stub. The
axis tops out at the 95th percentile of active days; days above it are drawn
full height with an amber cap notch so "tall" and "off the chart" stay
distinguishable, and the true peak is stated in the readouts.

### Reduced motion shows the finished frame

Every animation sits inside `@media (prefers-reduced-motion: no-preference)`,
and the base state of each graphic is the *end* of its animation. A reader who
opts out of motion gets a complete graphic, not an empty one. This is why, for
example, the rotating role list renders only its first entry statically —
four strings on one baseline would be unreadable.

### Sample data is labelled

Without a token the build falls back to `data/contributions.sample.json` and the
chart says `SAMPLE DATA` in amber. The workflow additionally refuses to publish
if no live data was fetched, so a placeholder graph cannot reach the profile by
accident.

## Phase 2: `agent: connect` (not built)

The design supports, but does not yet include, visitor-driven interaction: a
prefilled-issue link triggers `issues.opened`, an Action mutates `data/state.json`,
and the visitor's avatar joins the mesh graphic.

The safety model, decided up front, is that **no visitor-supplied free text is
ever rendered**. The handler matches issue titles against a strict allow-list
(`agent: connect`, `agent: vote <known-id>`) and silently drops anything else —
it never reads the title as content. Without that rule, a stranger controls text
on the front page of a personal profile. Supporting measures: per-user daily
rate limit, minimum account age, `concurrency` serialisation, a `dispatchEnabled`
kill switch, and a local blocklist.

## Layout

```
data/profile.json        all content: identity, agents, projects, stack, links
data/repos.json          fetched repo index (archive section)
data/contributions.json  fetched calendar; falls back to the .sample.json
scripts/theme.mjs        the palette
scripts/build-*.mjs      one generator per graphic
scripts/render-readme.mjs template -> README.md
scripts/preview.mjs      local server, GitHub's renderer + GitHub's CSS
templates/README.tmpl.md the file you actually edit
```
