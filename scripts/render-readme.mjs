/**
 * Renders README.md from templates/README.tmpl.md.
 *
 * Asset URLs point at the runtime branch rather than at paths in this branch,
 * which is what keeps main free of bot commits: the daily workflow pushes
 * regenerated SVGs to `runtime` and never touches README.md. raw.githubusercontent
 * serves branch-pinned files with Cache-Control: max-age=300, so an update is
 * visible within about five minutes.
 *
 * The preview server rewrites those URLs back to local paths, so `npm run dev`
 * shows the assets you just built rather than the ones already on GitHub.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, DATA, loadProfile } from './lib/paths.mjs';
import { CARD_WIDTH } from './build-agents.mjs';

/**
 * GitHub's heading-anchor algorithm (github-slugger): lowercase, strip a set of
 * punctuation, then spaces to hyphens. Nav links are built with this same
 * function as the headings, so a heading edit can never orphan a link.
 */
// Everything github-slugger strips: not a letter, number, combining mark,
// space, hyphen or underscore.
const SPECIALS = /[^\p{L}\p{N}\p{M}\p{Zs}\-_]/gu;

export const slug = (heading) =>
  heading.toLowerCase().trim().replace(SPECIALS, '').replace(/\p{Zs}/gu, '-');

/**
 * Section headings stay punctuation-free on purpose.
 *
 * GitHub adds heading anchors in its own rendering pipeline, not in the
 * Markdown API, so there is no way to verify a slug short of publishing. Every
 * slugger agrees on plain lowercase words joined by single spaces, so that is
 * what the headings use -- the decoration lives in the agent cards and the
 * summary line, where it cannot break a link. `assertLinkable` enforces it.
 */
const heading = (agent) => `agent ${agent.label}`;

function assertLinkable(text) {
  const anchor = slug(text);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor)) {
    throw new Error(
      `Heading "${text}" slugs to "${anchor}", which depends on how GitHub strips punctuation. ` +
      `Use lowercase words separated by single spaces so the anchor is unambiguous.`,
    );
  }
  return anchor;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes the characters that would break out of a markdown table cell. */
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function assetUrl(runtime, file) {
  return `https://raw.githubusercontent.com/${runtime.owner}/${runtime.repo}/${runtime.assetBranch}/${file}`;
}

function picture({ runtime, name, alt, width, align = 'center' }) {
  const dark = assetUrl(runtime, `${name}-dark.svg`);
  const light = assetUrl(runtime, `${name}-light.svg`);
  return `<p align="${align}">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${dark}">
    <source media="(prefers-color-scheme: light)" srcset="${light}">
    <img alt="${esc(alt)}" src="${light}"${width ? ` width="${width}"` : ''}>
  </picture>
</p>`;
}

function navStrip(profile) {
  const { runtime, agents } = profile;
  const cards = agents.map((a) => {
    const dark = assetUrl(runtime, `agent-${a.id}-dark.svg`);
    const light = assetUrl(runtime, `agent-${a.id}-light.svg`);
    return `  <a href="#${assertLinkable(heading(a))}"><picture>` +
      `<source media="(prefers-color-scheme: dark)" srcset="${dark}">` +
      `<source media="(prefers-color-scheme: light)" srcset="${light}">` +
      `<img alt="${esc(a.label)} — ${esc(a.summary)}" src="${light}" width="${CARD_WIDTH}"></picture></a>`;
  });
  return `<p align="center">\n${cards.join('\n')}\n</p>`;
}

function projectGrid(profile) {
  const featured = profile.projects.filter((p) => p.featured);
  const rows = [];

  for (let i = 0; i < featured.length; i += 2) {
    const pair = featured.slice(i, i + 2).map((p) => {
      const url = `https://github.com/${profile.runtime.owner}/${p.repo}`;
      const tags = p.tags.map((t) => `\`${t}\``).join(' ');
      return `<td width="50%" valign="top">

#### [${p.title}](${url})

${p.blurb}

${tags} · <sub>${esc(p.lang)}</sub>

</td>`;
    });
    if (pair.length === 1) pair.push('<td width="50%"></td>');
    rows.push(`<tr>\n${pair.join('\n')}\n</tr>`);
  }

  return `<table>\n${rows.join('\n')}\n</table>`;
}

const stackList = (profile) =>
  profile.stack
    .map((s) => `**${s.group}** &nbsp; ${s.items.map((i) => `\`${i}\``).join(' ')}`)
    .join('  \n');

async function archive(profile) {
  let repos;
  try {
    repos = JSON.parse(await readFile(join(DATA, 'repos.json'), 'utf8'));
  } catch {
    return '<!-- data/repos.json missing: run `node scripts/fetch-repos.mjs` -->';
  }

  const featured = new Set(profile.projects.map((p) => p.repo));
  const rest = repos.filter((r) => !featured.has(r.name));

  const rows = rest.map((r) => {
    const name = `[${cell(r.name)}](${r.url})`;
    const desc = cell(r.description ?? '—');
    const lang = r.language ? `\`${cell(r.language)}\`` : '—';
    const when = r.pushedAt.slice(0, 7);
    return `| ${name}${r.fork ? ' <sub>fork</sub>' : ''} | ${lang} | ${desc} | ${when} |`;
  });

  return `<details>
<summary><code>▸ ${rest.length} more repositories</code></summary>

<br>

| repository | language | description | last push |
| --- | --- | --- | --- |
${rows.join('\n')}

</details>`;
}

const linksLine = (profile) =>
  `<p align="center">\n  ${profile.links
    .filter((l) => !l.url.startsWith('TODO'))
    .map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`)
    .join('&nbsp; · &nbsp;')}\n</p>`;

export async function renderReadme({ now = new Date() } = {}) {
  const profile = await loadProfile();
  const { runtime, agents } = profile;
  const byId = Object.fromEntries(agents.map((a) => [a.id, a]));

  const blocks = {
    HEADER: picture({ runtime, name: 'boot', alt: `${profile.identity.name} — agent runtime`, width: 880 }),
    NAV: navStrip(profile),
    PROJECTS: projectGrid(profile),
    WORKLOAD: picture({ runtime, name: 'workload', alt: 'Daily contribution workload', width: 880 }),
    SNAKE: picture({ runtime, name: 'snake', alt: 'Contribution graph, being eaten', width: 880 }),
    STACK: stackList(profile),
    ARCHIVE: await archive(profile),
    TAGLINE: `<p align="center"><em>${esc(profile.identity.tagline)}</em></p>`,
    LINKS: linksLine(profile),
    UPDATED: `<p align="center"><sub>runtime rebuilt ${now.toISOString().slice(0, 10)} · generated by <code>scripts/render-readme.mjs</code></sub></p>`,
  };

  // The template opens with instructions for the author, and those instructions
  // name the placeholders. Strip that block first, or the documentation gets
  // treated as placeholders to resolve.
  const template = (await readFile(join(ROOT, 'templates', 'README.tmpl.md'), 'utf8'))
    .replace(/^<!--[\s\S]*?-->\n+/, '');
  const missing = [];

  const output = template.replace(/\{\{([A-Z_]+)(?::([a-z0-9-]+))?\}\}/g, (whole, key, id) => {
    if (key === 'AGENT' || key === 'BODY') {
      const agent = byId[id];
      if (!agent) {
        missing.push(whole);
        return whole;
      }
      if (key === 'AGENT') return `## ${heading(agent)}`;
      // Open prose, not a <details>. A heading over a one-line summary over a
      // collapsed toggle reads as three empty rows, and asks the reader to
      // click before they can tell whether clicking was worth it. Only the
      // repository index still collapses -- 21 table rows genuinely are worth
      // folding away.
      return agent.body.join('\n\n');
    }
    if (!(key in blocks)) {
      missing.push(whole);
      return whole;
    }
    return blocks[key];
  });

  if (missing.length) {
    throw new Error(`Unresolved placeholders in the template: ${[...new Set(missing)].join(', ')}`);
  }

  const readme =
    '<!-- Generated from templates/README.tmpl.md by scripts/render-readme.mjs. Do not edit directly. -->\n\n' +
    output.trimStart();

  await writeFile(join(ROOT, 'README.md'), readme, 'utf8');
  return readme;
}
