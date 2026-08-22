/**
 * Pulls the public repository list into data/repos.json for the archive section.
 *
 * Unlike the contributions call this is the REST API, which serves public data
 * without a token (60 requests/hour) -- so it works locally and in CI alike. A
 * token, when present, just raises the ceiling.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, isEntry } from './lib/paths.mjs';

export async function fetchRepos({ login, token }) {
  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed`,
    {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': `${login}-profile-runtime`,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub REST returned HTTP ${res.status} for ${login}'s repos`);

  const repos = await res.json();
  return repos
    .filter((r) => !r.private && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      fork: r.fork,
      pushedAt: r.pushed_at,
      url: r.html_url,
    }));
}

if (isEntry(import.meta.url)) {
  const login = process.env.PROFILE_LOGIN ?? 'Esforper';
  const repos = await fetchRepos({ login, token: process.env.CONTRIB_TOKEN || process.env.GITHUB_TOKEN });
  await writeFile(join(DATA, 'repos.json'), `${JSON.stringify(repos, null, 1)}\n`, 'utf8');
  console.log(`repos: ${repos.length} public -> data/repos.json`);
}
