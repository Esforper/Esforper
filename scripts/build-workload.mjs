/**
 * Agent workload monitor: daily contributions as a telemetry strip.
 *
 * Scaling
 * -------
 * The y-axis tops out at the 95th percentile of active days, not the true
 * maximum. One 30-commit afternoon would otherwise flatten every ordinary day
 * into a stub and the chart would carry no information. Days above the ceiling
 * are drawn full height with a bright cap notch so they read as clipped rather
 * than merely tall, and the real peak is called out in the readouts below.
 */

import { MONO } from './theme.mjs';
import { svgDoc, g, rect, line, text, el, motion, round, clamp } from './lib/svg.mjs';

const W = 880;
const CHROME = 32;
const CHART_TOP = 62;
const CHART_H = 112;
const BASELINE = CHART_TOP + CHART_H;
const PAD = 26;
const AXIS_Y = BASELINE + 20;
const DIVIDER = BASELINE + 32;
const H = DIVIDER + 74;

const WINDOW_DAYS = 182;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const percentile = (sorted, p) => sorted[clamp(Math.floor(sorted.length * p), 0, sorted.length - 1)] ?? 0;

/**
 * Days since the last active day, walking backwards.
 *
 * A zero on the final day does not break the streak: the day is not over yet,
 * and a monitor that resets to 0 every midnight is just wrong.
 */
function streaks(days) {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i !== days.length - 1) break;
  }

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  return { current, longest };
}

export function workloadSvg(theme, profile, contributions) {
  const all = contributions.days;
  const shown = all.slice(-WINDOW_DAYS);
  const active = all.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);

  const ceiling = Math.max(percentile(active, 0.95), 1);
  const peak = all.reduce((best, d) => (d.count > best.count ? d : best), all[0]);
  const { current, longest } = streaks(all);
  const today = all.at(-1);

  const pitch = (W - PAD * 2) / shown.length;
  const barW = round(Math.max(1.6, pitch - 1.35));

  const defs = [];
  const css = [];
  const anim = [];
  const body = [];

  // ---- chrome --------------------------------------------------------------
  body.push(rect({ x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 9, fill: theme.bg, stroke: theme.border }));
  body.push(rect({ x: 0.5, y: 0.5, width: W - 1, height: CHROME, rx: 9, fill: theme.panel }));
  body.push(rect({ x: 0.5, y: CHROME - 10, width: W - 1, height: 10, fill: theme.panel }));
  body.push(line({ x1: 1, y1: CHROME, x2: W - 1, y2: CHROME, stroke: theme.border }));

  body.push(text('agent://analyst — workload monitor', { x: PAD, y: CHROME / 2 + 4, 'font-size': 12, fill: theme.dim }));
  const synced = contributions.fromSample
    ? 'SAMPLE DATA'
    : `SYNCED ${contributions.generatedAt.slice(0, 10)}`;
  body.push(text(synced, {
    x: W - PAD, y: CHROME / 2 + 4, 'font-size': 11, fill: contributions.fromSample ? theme.amber : theme.dim,
    'text-anchor': 'end', 'letter-spacing': 0.6,
  }));

  // ---- gridlines -----------------------------------------------------------
  for (let i = 1; i <= 4; i++) {
    const y = round(BASELINE - (CHART_H / 4) * i);
    body.push(line({ x1: PAD, y1: y, x2: W - PAD, y2: y, stroke: theme.border, 'stroke-dasharray': '1 6', opacity: 0.55 }));
  }
  body.push(text(String(ceiling), { x: PAD, y: CHART_TOP - 6, 'font-size': 9, fill: theme.dim, opacity: 0.8 }));
  body.push(text(`${WINDOW_DAYS}d · contributions/day`, {
    x: W - PAD, y: CHART_TOP - 6, 'font-size': 9, fill: theme.dim, 'text-anchor': 'end', opacity: 0.8,
  }));
  body.push(line({ x1: PAD, y1: BASELINE, x2: W - PAD, y2: BASELINE, stroke: theme.borderBright }));

  // ---- bars ----------------------------------------------------------------
  const bars = [];
  const caps = [];
  let peakX = null;

  shown.forEach((d, i) => {
    const x = round(PAD + i * pitch);
    const over = d.count > ceiling;
    const h = d.count === 0 ? 2 : round(clamp((d.count / ceiling) * CHART_H, 3, CHART_H));
    const fill = d.count === 0 ? theme.ramp[0] : theme.ramp[d.level || 1];

    bars.push(rect({
      x, y: round(BASELINE - h), width: barW, height: h, rx: barW > 2.4 ? 1 : 0,
      fill, class: 'bar', style: `--d:${round(i * 0.0055, 3)}s`,
    }));

    // A clipped day gets a bright notch, so "tall" and "off the chart" stay
    // visually distinct.
    if (over) caps.push(rect({ x, y: round(CHART_TOP - 3), width: barW, height: 2.4, fill: theme.amber }));
    if (d.date === peak.date) peakX = x + barW / 2;
  });

  body.push(g({}, bars));
  body.push(g({ class: 'caps' }, caps));

  css.push('.bar{transform-box:fill-box;transform-origin:50% 100%}');
  anim.push(`.bar{animation:grow .55s cubic-bezier(.2,.85,.25,1) var(--d,0s) both}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`);
  css.push('.caps{opacity:1}');
  anim.push(`.caps{animation:fade .5s ease-out 1.3s both}
@keyframes fade{from{opacity:0}to{opacity:1}}`);

  // Peak callout, only when the peak falls inside the visible window.
  if (peakX !== null) {
    const anchor = peakX > W - 120 ? 'end' : 'start';
    const lx = anchor === 'end' ? peakX - 6 : peakX + 6;
    body.push(g({ class: 'peak' }, [
      line({ x1: peakX, y1: CHART_TOP - 1, x2: peakX, y2: BASELINE, stroke: theme.amber, 'stroke-dasharray': '2 3', opacity: 0.6 }),
      text(`peak ${peak.count}`, { x: lx, y: CHART_TOP + 10, 'font-size': 10, fill: theme.amber, 'text-anchor': anchor }),
    ]));
    css.push('.peak{opacity:1}');
    anim.push('.peak{animation:fade .6s ease-out 1.45s both}');
  }

  // ---- month ticks ---------------------------------------------------------
  let lastLabelX = -Infinity;
  shown.forEach((d, i) => {
    const day = Number(d.date.slice(8, 10));
    if (day !== 1) return;
    const x = round(PAD + i * pitch);
    if (x - lastLabelX < 46) return;
    lastLabelX = x;
    body.push(line({ x1: x, y1: BASELINE, x2: x, y2: BASELINE + 4, stroke: theme.border }));
    body.push(text(MONTHS[Number(d.date.slice(5, 7)) - 1], { x, y: AXIS_Y, 'font-size': 9, fill: theme.dim, 'text-anchor': 'middle' }));
  });

  // A sweep that reads as an instrument refreshing, not as decoration.
  defs.push(el('linearGradient', { id: 'sweep', x1: 0, y1: 0, x2: 1, y2: 0 }, [
    el('stop', { offset: '0%', 'stop-color': theme.cyan, 'stop-opacity': 0 }),
    el('stop', { offset: '55%', 'stop-color': theme.cyan, 'stop-opacity': theme.glow ? 0.16 : 0.09 }),
    el('stop', { offset: '100%', 'stop-color': theme.cyan, 'stop-opacity': 0 }),
  ].join('')));
  body.push(rect({ x: PAD, y: CHART_TOP, width: 120, height: CHART_H, fill: 'url(#sweep)', class: 'sweep' }));
  css.push('.sweep{opacity:0}');
  anim.push(`.sweep{animation:sweep 5.5s linear 1.6s infinite}
@keyframes sweep{0%{opacity:0;transform:translateX(0)}8%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translateX(${W - PAD * 2 - 120}px)}}`);

  // ---- readouts ------------------------------------------------------------
  body.push(line({ x1: 1, y1: DIVIDER, x2: W - 1, y2: DIVIDER, stroke: theme.border }));
  body.push(rect({ x: 1, y: DIVIDER, width: W - 2, height: H - DIVIDER - 1, fill: theme.panel, opacity: 0.45 }));

  const readouts = [
    { label: 'TOTAL / 365d', value: contributions.totals.contributions.toLocaleString('en-US'), tint: theme.green },
    { label: 'CURRENT STREAK', value: `${current}d`, tint: current > 0 ? theme.green : theme.dim },
    { label: 'LONGEST STREAK', value: `${longest}d`, tint: theme.fg },
    { label: 'TODAY', value: String(today?.count ?? 0), tint: (today?.count ?? 0) > 0 ? theme.cyan : theme.dim },
    { label: 'BUSIEST DAY', value: `${peak.count}`, tint: theme.amber },
    { label: 'ACTIVE DAYS', value: `${active.length}/365`, tint: theme.fg },
  ];

  const colW = (W - PAD * 2) / readouts.length;
  readouts.forEach((r, i) => {
    const x = round(PAD + i * colW);
    body.push(g({ class: `stat s${i}` }, [
      text(r.label, { x, y: DIVIDER + 22, 'font-size': 9, fill: theme.dim, 'letter-spacing': 0.7 }),
      text(r.value, { x, y: DIVIDER + 48, 'font-size': 19, fill: r.tint, 'font-weight': 600 }),
    ]));
    if (i) body.push(line({ x1: round(x - 14), y1: DIVIDER + 12, x2: round(x - 14), y2: H - 13, stroke: theme.border, opacity: 0.7 }));
    css.push(`.s${i}{opacity:1}`);
    anim.push(`.s${i}{animation:rise .45s ease-out ${round(1.15 + i * 0.07, 2)}s both}`);
  });
  anim.push('@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}');

  const range = `${shown[0].date} → ${shown.at(-1).date}`;
  return svgDoc({
    width: W,
    height: H,
    title: `${profile.identity.name} — contribution workload`,
    desc:
      `Bar chart of daily GitHub contributions from ${range}. ` +
      `${contributions.totals.contributions} contributions over 365 days across ${active.length} active days. ` +
      `Current streak ${current} days, longest ${longest} days. Busiest day ${peak.date} with ${peak.count} contributions. ` +
      `Today: ${today?.count ?? 0}.` +
      (contributions.fromSample ? ' NOTE: rendered from sample data, not live.' : ''),
    css: [`text{font-family:${MONO}}`, ...css, motion(anim.join('\n'))].join('\n'),
    body: el('defs', {}, defs.join('')) + body.join(''),
  });
}
