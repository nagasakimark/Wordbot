// Small DOM helpers and the scaled game stage (same approach as Map Quest:
// one 900px-tall design stage, as wide as the screen shape allows, scaled to fit).
import { sfx } from '../audio/sfx.js';

export function h(tag, attrs = {}, ...children) {
  if (attrs == null || attrs instanceof Node || Array.isArray(attrs) || typeof attrs !== 'object') { if (attrs != null) children.unshift(attrs); attrs = {}; }
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const STAGE_H = 900, STAGE_MIN_W = 1440, STAGE_MAX_W = 2100;
let stageW = 1600, stageScale = 1;
export const getStageW = () => stageW;
export const getStageScale = () => stageScale;
export function fitStage() {
  const stage = document.getElementById('stage');
  const vw = window.innerWidth, vh = window.innerHeight;
  stageW = Math.round(Math.max(STAGE_MIN_W, Math.min(STAGE_MAX_W, STAGE_H * vw / vh)));
  stageScale = Math.min(vw / stageW, vh / STAGE_H);
  stage.style.width = stageW + 'px';
  stage.style.transform = `translate(-50%, -50%) scale(${stageScale})`;
}
export function toStage(cx, cy) {
  const r = document.getElementById('stage').getBoundingClientRect();
  return { x: (cx - r.left) / stageScale, y: (cy - r.top) / stageScale };
}
export function rectInStage(el) {
  const r = el.getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect();
  return { x: (r.left - s.left) / stageScale, y: (r.top - s.top) / stageScale, w: r.width / stageScale, h: r.height / stageScale };
}

// A glossy button that clicks and squishes.
export function btn(cls, content, onClick, attrs = {}) {
  const b = h('button.gbtn.' + cls.split(' ').join('.'), attrs, content);
  b.addEventListener('pointerdown', () => sfx.play('press'));
  b.addEventListener('click', (e) => { if (!b.disabled) onClick?.(e); });
  return b;
}

let toastTimer = 0;
export function toast(text, kind = 'info', ms = 2600) {
  const ov = document.getElementById('overlay');
  ov.querySelector('.toast')?.remove();
  const t = h('div.toast.' + kind, {}, text);
  ov.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

// A modal card. Returns { el, close }.
export function modal(content, { cls = '', onClose, dismiss = true } = {}) {
  const ov = document.getElementById('overlay');
  const back = h('div.modal-back');
  const card = h('div.modal.' + (cls || 'plain'), {}, content);
  back.append(card);
  const close = () => { back.classList.add('out'); setTimeout(() => back.remove(), 220); onClose?.(); };
  if (dismiss) back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  ov.append(back);
  return { el: card, close };
}

// Simple SVG icons (white glyphs) used on blocks and buttons.
const P = (d, extra = '') => `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${d}</g>${extra}</svg>`;
export const ICONS = {
  forward: P('<path d="M24 40V10"/><path d="M12 21 24 9l12 12"/>'),
  'turn-left': P('<path d="M34 40V25c0-7-4-11-11-11H11"/><path d="M18 6l-8 8 8 8"/>'),
  'turn-right': P('<path d="M14 40V25c0-7 4-11 11-11h12"/><path d="M30 6l8 8-8 8"/>'),
  pick: P('<path d="M14 18h20l5 7-15 16L9 25z"/><path d="M9 25h30"/>'),
  paint: P('<path d="M30 8l10 10-14 14-10-10z"/><path d="M16 22c-6 2-8 8-8 16 8 0 14-2 16-8"/>'),
  say: P('<path d="M8 12h32v20H22l-9 8v-8H8z"/>'),
  repeat: P('<path d="M36 18a13 13 0 0 0-23-4"/><path d="M10 7v8h8"/><path d="M12 30a13 13 0 0 0 23 4"/><path d="M38 41v-8h-8"/>'),
  until: P('<path d="M36 22a13 13 0 1 0-4 10"/><path d="M38 10v12H26"/>', '<circle cx="23" cy="25" r="4" fill="currentColor"/>'),
  if: P('<path d="M24 6 42 24 24 42 6 24z"/>', '<text x="24" y="31" text-anchor="middle" font-size="20" font-weight="700" fill="currentColor" font-family="Fredoka, sans-serif">?</text>'),
  word: P('<path d="M9 10h12c2 0 3 1 3 3v26c0-2-1-3-3-3H9z"/><path d="M39 10H27c-2 0-3 1-3 3v26c0-2 1-3 3-3h12z"/>'),
  book: P('<path d="M9 10h12c2 0 3 1 3 3v26c0-2-1-3-3-3H9z"/><path d="M39 10H27c-2 0-3 1-3 3v26c0-2 1-3 3-3h12z"/>'),
  num: P('<path d="M18 8l-4 32M34 8l-4 32M9 18h32M7 30h32"/>'),
  plus: P('<path d="M24 10v28M10 24h28"/>'),
  start: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 9 39 24 15 39z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
  step: P('<path d="M12 10l14 14-14 14"/><path d="M34 10v28"/>'),
  stop: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="11" width="26" height="26" rx="5" fill="currentColor"/></svg>`,
  back: P('<path d="M30 8 14 24l16 16"/>'),
  undo: P('<path d="M18 12 8 22l10 10"/><path d="M8 22h20c7 0 12 5 12 11v3"/>'),
  trash: P('<path d="M9 13h30M19 13V8h10v5M13 13l2 27h18l2-27"/>'),
  code: P('<path d="M16 12 6 24l10 12M32 12l10 12-10 12"/>'),
  blocks: P('<rect x="8" y="9" width="24" height="12" rx="3"/><rect x="16" y="27" width="24" height="12" rx="3"/>'),
  sound: P('<path d="M8 19h8l10-8v26l-10-8H8z"/><path d="M33 17c3 4 3 10 0 14"/><path d="M38 12c6 7 6 17 0 24"/>'),
  mute: P('<path d="M8 19h8l10-8v26l-10-8H8z"/><path d="M34 19l10 10M44 19 34 29"/>'),
  help: P('<path d="M17 17a7 7 0 1 1 10 6c-2 1-3 3-3 5"/>', '<circle cx="24" cy="38" r="3.4" fill="currentColor"/>'),
  next: P('<path d="M18 8l16 16-16 16"/>'),
  retry: P('<path d="M38 24a14 14 0 1 1-4-10"/><path d="M38 8v8h-8"/>'),
  home: P('<path d="M8 24 24 10l16 14"/><path d="M13 21v18h22V21"/>'),
  hint: P('<path d="M17 30c-4-3-6-7-5-12a12 12 0 0 1 24 0c1 5-1 9-5 12v4H17z"/><path d="M19 41h10"/>'),
  lock: P('<rect x="11" y="21" width="26" height="20" rx="4"/><path d="M16 21v-6a8 8 0 0 1 16 0v6"/>'),
  check: P('<path d="M10 25l9 9 19-19"/>'),
  cross: P('<path d="M13 13l22 22M35 13 13 35"/>'),
  ear: P('<path d="M14 20a10 10 0 1 1 20 0c0 7-7 8-7 15a5 5 0 0 1-10 0"/>'),
};
export const icon = (name, cls = '') => h('span.ico' + (cls ? '.' + cls : ''), { html: ICONS[name] || '' });
