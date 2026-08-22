/**
 * Single source of truth for the runtime's visual language.
 *
 * Every generated SVG reads its colors from here, so retheming the whole
 * profile means editing one file and re-running `npm run build`.
 *
 * Terminal / Agent Runtime: phosphor green + cyan on near-black, with the
 * contribution ramp borrowed from GitHub itself so the workload monitor reads
 * as familiar at a glance.
 */

// SVGs cannot load external fonts, so we lean on whatever monospace the
// viewer already has. Every entry here ships with some mainstream OS.
export const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const DARK = {
  name: 'dark',
  bg: '#0a0e0f',
  panel: '#0d1418',
  panelAlt: '#111b1f',
  grid: '#16232833',
  border: '#1e3238',
  borderBright: '#2b4a52',

  fg: '#c9e8e0',
  dim: '#5c8189',
  faint: '#33505699',

  green: '#39d353',
  greenDim: '#26a641',
  cyan: '#2dd4bf',
  cyanDim: '#14919b',
  amber: '#f0b429',
  magenta: '#c77dff',
  red: '#ff6b6b',

  // GitHub's own contribution ramp (level 0 -> 4)
  ramp: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  glow: 0.55,
};

const LIGHT = {
  name: 'light',
  bg: '#ffffff',
  panel: '#f6f8fa',
  panelAlt: '#eef2f5',
  grid: '#d8dee433',
  border: '#d0d7de',
  borderBright: '#8c959f',

  fg: '#1f2328',
  dim: '#656d76',
  faint: '#8c959f99',

  green: '#1a7f37',
  greenDim: '#2da44e',
  cyan: '#0969da',
  cyanDim: '#218bff',
  amber: '#9a6700',
  magenta: '#8250df',
  red: '#cf222e',

  ramp: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  glow: 0,
};

export const THEMES = { dark: DARK, light: LIGHT };

/** Both themes, for scripts that emit a dark + light pair. */
export const BOTH = [DARK, LIGHT];
