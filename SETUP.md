# Setup

Everything here runs locally already. These are the steps that put it on GitHub.

## 1. Look at it first

```bash
npm run build     # regenerate SVGs + README.md
npm run dev       # http://localhost:4000, rebuilds on save
```

`npm run dev` renders `README.md` through GitHub's own Markdown API and wraps it
in GitHub's own stylesheet, so the preview is not an approximation. The theme
toggle in the top bar switches dark/light the way a visitor's setting would.

`/assets` in the same server shows every generated SVG on its own, which is the
faster loop when you are only adjusting an animation.

No `npm install` — there are no dependencies. Node 20+ is the only requirement.

## 2. Create the profile repository

A repository named exactly the same as your username is what GitHub turns into a
profile README. Create it on github.com:

- **Name:** `Esforper` (must match your username exactly)
- **Visibility:** Public — a private one will not render on your profile
- **Do not** add a README, .gitignore, or licence; this directory already has what it needs

## 3. Push

```bash
git add -A
git commit -m "Agent runtime profile"
git branch -M main
git remote add origin https://github.com/Esforper/Esforper.git
git push -u origin main
```

At this point the profile page will show **broken images**. That is expected:
`README.md` points at the `runtime` branch, which does not exist until the
workflow has run once. Step 4 fixes it.

## 4. Run the workflow once

GitHub → your repo → **Actions** → **runtime** → **Run workflow**.

It fetches your contribution data, builds the SVGs, draws the snake, and
force-pushes everything to a `runtime` branch. After that it runs daily at
05:17 UTC on its own.

Give it about five minutes after the run finishes before judging the result —
`raw.githubusercontent.com` serves branch-pinned files with a 5-minute cache.

### If the run fails at "Require live data"

GitHub's GraphQL API refused the workflow's built-in token for the contributions
query. Fix:

1. github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Generate a token with the **`read:user`** scope and nothing else
3. Your repo → Settings → Secrets and variables → Actions → **New repository secret**
4. Name it `CONTRIB_TOKEN`, paste the token
5. Re-run the workflow

A PAT also makes private contributions count, if you want them counted.

## 5. Fill in the TODOs

`data/profile.json` has four fields I could not derive from your public repos:

- `identity.location`
- `projects[AA-Next].blurb` — the only featured repo with no GitHub description
- `links[LinkedIn].url`

Anything still starting with `TODO` is skipped in the links row rather than
published, so nothing broken goes live if you leave one.

---

## Day-to-day

| I want to… | Do this |
| --- | --- |
| Change the prose, projects, or agents | Edit `data/profile.json`, `npm run build`, commit |
| Change the page layout or add a section | Edit `templates/README.tmpl.md`, `npm run build`, commit |
| Retheme everything | Edit `scripts/theme.mjs`, `npm run build`, commit |
| Change an animation | Edit the matching `scripts/build-*.mjs`, watch `/assets` |
| Refresh the live graph now | Actions → runtime → Run workflow |

**Never edit `README.md` directly** — it is generated, and the next build
overwrites it. `templates/README.tmpl.md` is the file you own.

## What runs where

```
main branch          you + the sources. No bot ever commits here.
runtime branch       generated SVGs only. One commit, force-pushed daily.
GitHub Actions       runtime.yml, once a day at 05:17 UTC.
```

The separation is the point: your commit history stays yours, and the profile
still updates on its own.
