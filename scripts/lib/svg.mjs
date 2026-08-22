/**
 * Minimal SVG builders.
 *
 * Deliberately tiny and dependency-free: these emit strings, not a DOM. The
 * only rules that matter for GitHub READMEs are baked in here --
 *   * the root always carries xmlns (GitHub renders via <img>, not inline)
 *   * styling lives in a <style> block inside the document, never outside it
 *   * nothing references an external URL, because <img>-embedded SVGs cannot
 *     load one
 */

import { MONO } from '../theme.mjs';

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);

/** Serializes an attribute object, skipping null/undefined so callers can pass conditionals. */
export function attrs(map = {}) {
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
}

/** Generic element. Pass children as a string or an array; omit for a self-closing tag. */
export function el(tag, map = {}, children = null) {
  const body = Array.isArray(children) ? children.filter(Boolean).join('') : children;
  return body === null || body === undefined
    ? `<${tag}${attrs(map)}/>`
    : `<${tag}${attrs(map)}>${body}</${tag}>`;
}

export const g = (map, children) => el('g', map, children);
export const rect = (map) => el('rect', map);
export const circle = (map) => el('circle', map);
export const line = (map) => el('line', map);
export const path = (map) => el('path', map);

/**
 * Monospace text. `text` is escaped; pass `raw` instead when the content is
 * already markup (e.g. a <tspan> run).
 */
export function text(content, map = {}) {
  const { raw = false, ...rest } = map;
  return el('text', { 'font-family': MONO, ...rest }, raw ? content : esc(content));
}

/** Rounded-rect path, for when a plain <rect rx> is not enough (e.g. one-sided rounding). */
export function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    'Z',
  ].join('');
}

/**
 * Root document.
 *
 * `title`/`desc` are not decoration -- they are what screen readers announce,
 * and the README's alt text alone is not enough for a graphic this dense.
 */
export function svgDoc({ width, height, css = '', body, title, desc }) {
  return [
    `<svg${attrs({
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-labelledby': title ? 'svg-title' : null,
    })}>`,
    title ? el('title', { id: 'svg-title' }, esc(title)) : '',
    desc ? el('desc', {}, esc(desc)) : '',
    css ? `<style>${css}</style>` : '',
    body,
    '</svg>',
  ].join('');
}

/**
 * Respect the viewer's reduced-motion setting.
 *
 * Wraps animation rules so they only apply when motion is welcome. The static
 * frame must therefore be the *finished* state, never a blank one -- readers
 * who opt out of motion should still see a complete graphic.
 */
export function motion(rules) {
  return `@media (prefers-reduced-motion: no-preference){${rules}}`;
}

export const round = (n, places = 2) => Number(n.toFixed(places));
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
