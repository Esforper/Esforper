/**
 * Shared paths and data loading.
 *
 * Lives apart from build.mjs so that importing a path does not execute a build:
 * build.mjs runs its work at module top level, which makes it unsafe to import.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
export const ASSETS = join(ROOT, 'assets');
export const DATA = join(ROOT, 'data');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export const loadProfile = () => readJson(join(DATA, 'profile.json'));

/**
 * Live contribution data when a fetch has produced it, the committed sample
 * otherwise. The sample is what makes the visuals workable offline and without
 * a token; `fromSample` lets callers label it so nobody mistakes it for real.
 */
export async function loadContributions() {
  try {
    return { ...(await readJson(join(DATA, 'contributions.json'))), fromSample: false };
  } catch {
    return { ...(await readJson(join(DATA, 'contributions.sample.json'))), fromSample: true };
  }
}

/** True when this module's importer was run directly, rather than imported. */
export const isEntry = (importMetaUrl) =>
  process.argv[1] && resolve(fileURLToPath(importMetaUrl)) === resolve(process.argv[1]);
