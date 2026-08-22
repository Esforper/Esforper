/**
 * The header: a terminal window that boots the "runtime", brings each agent
 * online, and settles into an idle state with a live mesh and a rotating role.
 *
 * Animation notes
 * ---------------
 * Everything is CSS. No SMIL, no JS, no external assets -- those are the three
 * things a GitHub README will not run.
 *
 * The typing effect clips text behind a rect whose `width` animates in
 * `steps(n)`. Character advance is *over*-estimated (see CH) so the reveal
 * finishes a hair early on narrow fonts rather than clipping the last glyph on
 * wide ones.
 *
 * Every animation sits inside a prefers-reduced-motion guard, and the base
 * (unanimated) state is the *finished* frame -- a reader who opts out of motion
 * gets a complete graphic, not an empty one.
 */

import { MONO } from './theme.mjs';
import { svgDoc, g, rect, circle, line, path, text, el, esc, motion, round } from './lib/svg.mjs';

const W = 880;
const H = 340;
const CHROME = 32;
const FOOTER_Y = 258;

// Monospace advance as a fraction of font-size. Real fonts land between .55
// (Consolas) and .602 (Menlo/DejaVu); over-estimating keeps the clip generous,
// so a reveal ends early rather than shearing the last character.
const CH = 0.625;
const width = (str, size) => str.length * size * CH + 3;

/** A run of text revealed character by character behind an animated clip rect. */
function typed({ id, content, x, y, size, fill, delay, duration }) {
  const w = width(content, size);
  return {
    clip: el('clipPath', { id }, rect({ x, y: y - size, width: round(w), height: round(size * 1.7) })),
    node: text(content, { x, y, 'font-size': size, fill, 'clip-path': `url(#${id})` }),
    css: `#${id} rect{width:${round(w)}px}`,
    motion: `#${id} rect{animation:type-${id} ${duration}s steps(${Math.max(content.length, 1)}) ${delay}s both}
@keyframes type-${id}{from{width:0}to{width:${round(w)}px}}`,
  };
}

export function bootSvg(theme, profile) {
  const { identity, agents } = profile;
  const defs = [];
  const css = [];
  const anim = [];
  const body = [];

  const accentOf = (a) => theme[a.accent] ?? theme.dim;

  // ---- window chrome -------------------------------------------------------
  defs.push(
    el('pattern', { id: 'grid', width: 22, height: 22, patternUnits: 'userSpaceOnUse' },
      circle({ cx: 1, cy: 1, r: 1, fill: theme.faint })),
  );

  body.push(rect({ x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 9, fill: theme.bg, stroke: theme.border }));
  body.push(rect({ x: 1, y: CHROME, width: W - 2, height: FOOTER_Y - CHROME, fill: 'url(#grid)' }));
  body.push(rect({ x: 0.5, y: 0.5, width: W - 1, height: CHROME, rx: 9, fill: theme.panel }));
  body.push(rect({ x: 0.5, y: CHROME - 10, width: W - 1, height: 10, fill: theme.panel }));
  body.push(line({ x1: 1, y1: CHROME, x2: W - 1, y2: CHROME, stroke: theme.border }));

  ['#ff5f57', theme.amber, theme.green].forEach((c, i) =>
    body.push(circle({ cx: 22 + i * 17, cy: CHROME / 2, r: 4.5, fill: c, opacity: 0.85 })));

  body.push(text('esforper.runtime — agent orchestration', {
    x: 88, y: CHROME / 2 + 4, 'font-size': 12, fill: theme.dim,
  }));
  body.push(circle({ cx: W - 100, cy: CHROME / 2, r: 3.5, fill: theme.green, class: 'live' }));
  body.push(text('RUNNING', { x: W - 89, y: CHROME / 2 + 4, 'font-size': 11, fill: theme.green, 'letter-spacing': 1 }));
  anim.push(`.live{animation:live-pulse 2s ease-in-out infinite}
@keyframes live-pulse{0%,100%{opacity:1}50%{opacity:.3}}`);

  // ---- left column: boot log ----------------------------------------------
  const LX = 26;
  const LS = 13;
  const BEAT = 0.3;
  const FIRST = 1.55;
  let ly = 62;

  const cmd = typed({
    id: 't-cmd', content: '$ ./boot --profile esforper', x: LX, y: ly,
    size: LS, fill: theme.cyan, delay: 0.25, duration: 1.1,
  });
  defs.push(cmd.clip); body.push(cmd.node); css.push(cmd.css); anim.push(cmd.motion);
  ly += 32;

  // Columns are placed by explicit tspan x, not by padding: SVG collapses
  // runs of whitespace unless xml:space is preserved, and fixed columns
  // survive any font substitution.
  agents.forEach((a, i) => {
    const rowY = ly + i * 22;
    const run =
      `[ <tspan fill="${theme.green}">ok</tspan> ]` +
      `<tspan x="${LX + 84}" fill="${theme.fg}">${esc(a.label)}</tspan>` +
      `<tspan x="${LX + 190}" fill="${theme.dim}">${esc(a.role)}</tspan>`;
    body.push(g({ class: `row r${i}` }, [
      text(run, { raw: true, x: LX, y: rowY, 'font-size': LS, fill: theme.dim }),
      circle({ cx: LX + 384, cy: rowY - 4, r: 3, fill: accentOf(a) }),
    ]));
    css.push(`.r${i}{opacity:1}`);
    anim.push(`.r${i}{animation:fade-in .35s ease-out ${round(FIRST + i * BEAT, 2)}s both}`);
  });
  ly += agents.length * 22 + 18;

  const done = typed({
    id: 't-done', content: `> ${agents.length} agents online · awaiting dispatch`,
    x: LX, y: ly, size: LS, fill: theme.green,
    delay: round(FIRST + agents.length * BEAT + 0.2, 2), duration: 0.9,
  });
  defs.push(done.clip); body.push(done.node); css.push(done.css); anim.push(done.motion);
  anim.push('@keyframes fade-in{from{opacity:0;transform:translateX(-7px)}to{opacity:1;transform:none}}');

  // ---- right column: agent mesh -------------------------------------------
  const MX = 452;
  body.push(line({
    x1: MX - 18, y1: CHROME + 16, x2: MX - 18, y2: FOOTER_Y - 16,
    stroke: theme.border, 'stroke-dasharray': '2 5',
  }));

  const hub = { x: MX + 10, y: 128, w: 118, h: 34 };
  const spineX = MX + 196;
  const hubOut = { x: hub.x + hub.w, y: hub.y + hub.h / 2 };
  const sats = [
    { x: MX + 236, y: 60 },
    { x: MX + 288, y: 112 },
    { x: MX + 288, y: 164 },
    { x: MX + 236, y: 216 },
  ];

  // Orthogonal routing out of the hub, along a shared spine, then into each
  // node -- it reads like a bus, which is what it is.
  agents.slice(1).forEach((a, i) => {
    const s = sats[i];
    const d = `M${hubOut.x},${hubOut.y} H${spineX} V${s.y + 11} H${s.x}`;
    body.push(path({ d, fill: 'none', stroke: theme.border, 'stroke-width': 1.2 }));
    body.push(path({
      d, fill: 'none', stroke: accentOf(a), 'stroke-width': 1.5, 'stroke-linecap': 'round',
      'stroke-dasharray': '3 14', class: `flow f${i}`, opacity: 0.9,
    }));
    css.push(`.f${i}{stroke-dashoffset:0}`);
    anim.push(`.f${i}{animation:flow 1.5s linear ${round(3.4 + i * 0.18, 2)}s infinite}`);
  });
  anim.push('@keyframes flow{to{stroke-dashoffset:-34}}');

  body.push(g({ class: 'row n0' }, [
    rect({ x: hub.x, y: hub.y, width: hub.w, height: hub.h, rx: 6, fill: theme.panelAlt, stroke: theme.cyan, 'stroke-width': 1.3 }),
    circle({ cx: hub.x + 14, cy: hub.y + hub.h / 2, r: 3.5, fill: theme.cyan, class: 'live' }),
    text(agents[0].label, { x: hub.x + 26, y: hub.y + hub.h / 2 + 4, 'font-size': 12, fill: theme.fg }),
  ]));
  css.push('.n0{opacity:1}');
  anim.push(`.n0{animation:fade-in .35s ease-out ${FIRST}s both}`);

  agents.slice(1).forEach((a, i) => {
    const s = sats[i];
    body.push(g({ class: `row n${i + 1}` }, [
      rect({ x: s.x, y: s.y, width: round(a.label.length * 11 * CH + 28), height: 22, rx: 5, fill: theme.panel, stroke: theme.border }),
      circle({ cx: s.x + 11, cy: s.y + 11, r: 3, fill: accentOf(a) }),
      text(a.label, { x: s.x + 20, y: s.y + 15, 'font-size': 11, fill: theme.dim }),
    ]));
    css.push(`.n${i + 1}{opacity:1}`);
    anim.push(`.n${i + 1}{animation:fade-in .35s ease-out ${round(FIRST + (i + 1) * BEAT, 2)}s both}`);
  });

  // ---- footer: identity + rotating role -----------------------------------
  body.push(rect({ x: 1, y: FOOTER_Y, width: W - 2, height: H - FOOTER_Y - 1, fill: theme.panel, opacity: 0.45 }));
  body.push(line({ x1: 1, y1: FOOTER_Y, x2: W - 1, y2: FOOTER_Y, stroke: theme.border }));

  body.push(text(identity.name, {
    x: 26, y: FOOTER_Y + 32, 'font-size': 21, fill: theme.fg, 'font-weight': 600, 'letter-spacing': -0.3,
  }));
  body.push(text(`@${identity.handle}`, {
    x: round(26 + width(identity.name, 21) + 14), y: FOOTER_Y + 32, 'font-size': 13, fill: theme.dim,
  }));

  const roles = identity.rotatingRoles;
  const SLOT = 4;
  const CYCLE = roles.length * SLOT;
  const RY = FOOTER_Y + 58;
  const RX = 46;

  body.push(text('>', { x: 26, y: RY, 'font-size': 14, fill: theme.green }));

  roles.forEach((r, i) => {
    const id = `t-role${i}`;
    const w = width(r, 14);
    defs.push(el('clipPath', { id }, rect({ x: RX, y: RY - 14, width: round(w), height: 22 })));
    body.push(text(r, { x: RX, y: RY, 'font-size': 14, fill: theme.cyan, 'clip-path': `url(#${id})` }));
    // Without motion only the first role shows: four strings stacked on the
    // same baseline would be unreadable.
    css.push(`#${id} rect{width:${i === 0 ? round(w) : 0}px}`);
    anim.push(`#${id} rect{animation:role${i} ${CYCLE}s steps(${r.length}) ${round(3.6 + i * SLOT, 2)}s infinite}
@keyframes role${i}{0%{width:0}${round((0.9 / CYCLE) * 100, 3)}%{width:${round(w)}px}${round((2.7 / CYCLE) * 100, 3)}%{width:${round(w)}px}${round((SLOT / CYCLE) * 100, 3)}%{width:0}100%{width:0}}`);
  });

  body.push(rect({ x: RX, y: RY - 12, width: 8, height: 15, fill: theme.green, class: 'caret' }));
  // Static frame: parked after the first role, the only one drawn without motion.
  css.push(`.caret{transform:translateX(${round(width(roles[0], 14) - 3)}px)}`);

  // The caret advances *with* the typing. Stepping straight to the finished
  // width leaves it hovering past the text while characters appear behind it.
  // Per-keyframe animation-timing-function lets one animation step forward
  // during the type, hold while the text sits, then step back on the delete --
  // on exactly the same beats as the role clip above.
  const pct = (seconds) => round((seconds / CYCLE) * 100, 3);
  const track = roles
    .map((r, i) => {
      const start = i * SLOT;
      const end = round(width(r, 14) - 3);
      return (
        `${pct(start)}%{transform:translateX(0);animation-timing-function:steps(${r.length})}` +
        `${pct(start + 0.9)}%{transform:translateX(${end}px);animation-timing-function:steps(1)}` +
        `${pct(start + 2.7)}%{transform:translateX(${end}px);animation-timing-function:steps(${r.length})}`
      );
    })
    .join('');

  anim.push(`.caret{animation:caret-blink 1.06s steps(1) infinite,caret-track ${CYCLE}s linear 3.6s infinite}
@keyframes caret-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes caret-track{${track}100%{transform:translateX(0)}}`);

  if (theme.glow) css.push('.live,.flow{filter:drop-shadow(0 0 3px currentColor)}');

  return svgDoc({
    width: W,
    height: H,
    title: `${identity.name} — agent runtime`,
    desc:
      `A terminal window titled esforper.runtime. It boots and brings ${agents.length} agents online: ` +
      `${agents.map((a) => a.label).join(', ')}. Beside the log, a mesh diagram shows the orchestrator ` +
      `connected to the other agents with data flowing along each link. Below the divider: ` +
      `${identity.name} (@${identity.handle}), working on ${roles.join(', ')}.`,
    css: [`text{font-family:${MONO}}`, ...css, motion(anim.join('\n'))].join('\n'),
    body: el('defs', {}, defs.join('')) + body.join(''),
  });
}
