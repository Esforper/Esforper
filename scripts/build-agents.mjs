/**
 * The agent cards: five small SVGs that make up the clickable nav strip.
 *
 * Each card ships as its own file so the README can wrap it in an <a> -- the
 * only way to get a clickable region, since pointer events never reach an SVG
 * embedded via <img>. That constraint is also why nothing here has a hover
 * state: the card has to look alive on its own.
 *
 * Cards are deliberately desynchronised (see PHASE). Five LEDs blinking in
 * lockstep read as one decoration; five blinking independently read as five
 * processes.
 */

import { MONO } from './theme.mjs';
import { svgDoc, rect, circle, line, text, motion, round } from './lib/svg.mjs';

// Five cards plus inter-element spacing have to clear GitHub's ~980px content
// width on a single row; wrapping strands the fifth card alone and centred.
export const CARD_WIDTH = 156;
const W = CARD_WIDTH;
const H = 96;

// Per-card offsets, so the blink rates never line up.
const PHASE = [0, 0.62, 1.31, 0.24, 0.95];
const RATE = [2.1, 2.6, 1.85, 2.35, 2.9];

export function agentCardSvg(theme, agent, index) {
  const accent = theme[agent.accent] ?? theme.dim;
  const phase = PHASE[index % PHASE.length];
  const rate = RATE[index % RATE.length];

  const body = [
    rect({ x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 8, fill: theme.panel, stroke: theme.border }),
    // Left edge in the agent's colour: identity before you have read a word.
    rect({ x: 1, y: 1, width: 3, height: H - 2, fill: accent, opacity: 0.9 }),
    rect({ x: 4, y: 1, width: W - 5, height: H - 2, fill: theme.bg, opacity: 0.35 }),

    circle({ cx: 20, cy: 25, r: 3.6, fill: accent, class: 'led' }),
    text(agent.label, { x: 31, y: 29, 'font-size': 12.5, fill: theme.fg }),
    text(agent.role, { x: 14, y: 49, 'font-size': 9, fill: theme.dim, 'letter-spacing': 0.4 }),

    line({ x1: 14, y1: 60, x2: W - 14, y2: 60, stroke: theme.border }),

    text(agent.metric, { x: 14, y: 78, 'font-size': 10, fill: accent }),
    text('▸', { x: W - 20, y: 79, 'font-size': 12, fill: theme.dim, class: 'arrow' }),
  ];

  const css = [
    `text{font-family:${MONO}}`,
    '.arrow{transform-box:fill-box;transform-origin:50% 50%}',
    theme.glow ? '.led{filter:drop-shadow(0 0 3px currentColor)}' : '',
    motion(`.led{animation:led ${rate}s ease-in-out ${phase}s infinite}
@keyframes led{0%,100%{opacity:1}50%{opacity:.28}}
.arrow{animation:nudge ${round(rate * 1.4, 2)}s ease-in-out ${round(phase + 0.4, 2)}s infinite}
@keyframes nudge{0%,72%,100%{transform:translateX(0)}84%{transform:translateX(3px)}}`),
  ];

  return svgDoc({
    width: W,
    height: H,
    title: `${agent.label} — ${agent.role}`,
    desc: `Card for the ${agent.label} agent: ${agent.role}, ${agent.metric}. Opens the ${agent.summary} section.`,
    css: css.filter(Boolean).join('\n'),
    body: body.join(''),
  });
}
