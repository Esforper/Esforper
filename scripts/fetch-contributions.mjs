/**
 * Pulls the contribution calendar from GitHub's GraphQL API and normalises it
 * into data/contributions.json.
 *
 * Auth: GitHub's GraphQL API requires a token even for public data. In Actions
 * the workflow's GITHUB_TOKEN is tried first; set CONTRIB_TOKEN to a PAT with
 * `read:user` if that is refused, or to include private contributions.
 *
 * Locally, without a token, nothing here runs -- the build falls back to
 * data/contributions.sample.json so you can iterate on the visuals offline.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, isEntry } from './lib/paths.mjs';

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `query($login:String!,$from:DateTime!,$to:DateTime!){
  user(login:$login){
    contributionsCollection(from:$from,to:$to){
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount contributionLevel } }
      }
    }
  }
}`;

export async function fetchContributions({ login, token, days = 365, now = new Date() }) {
  const to = new Date(now);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': `${login}-profile-runtime`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `GitHub GraphQL returned HTTP ${res.status}. If this is 401/403 with GITHUB_TOKEN, ` +
      `create a PAT with the read:user scope and add it as the CONTRIB_TOKEN secret.`,
    );
  }

  const payload = await res.json();
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL: ${payload.errors.map((e) => e.message).join('; ')}`);
  }

  const collection = payload.data?.user?.contributionsCollection;
  if (!collection) throw new Error(`No contributionsCollection for user "${login}" -- is the login correct?`);

  const calendar = collection.contributionCalendar;
  const dayList = calendar.weeks.flatMap((w) => w.contributionDays);

  return {
    login,
    generatedAt: now.toISOString(),
    range: { from: dayList.at(0)?.date ?? null, to: dayList.at(-1)?.date ?? null },
    totals: {
      contributions: calendar.totalContributions,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      reviews: collection.totalPullRequestReviewContributions,
      repositories: collection.totalRepositoriesWithContributedCommits,
    },
    days: dayList.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVELS[d.contributionLevel] ?? 0,
    })),
  };
}

if (isEntry(import.meta.url)) {
  const login = process.env.PROFILE_LOGIN ?? 'Esforper';
  const token = process.env.CONTRIB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('No CONTRIB_TOKEN or GITHUB_TOKEN set -- skipping fetch, the build will use the sample data.');
    process.exit(0);
  }
  const data = await fetchContributions({ login, token });
  const out = join(ROOT, 'data', 'contributions.json');
  await writeFile(out, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`contributions: ${data.days.length} days, ${data.totals.contributions} total -> data/contributions.json`);
}
