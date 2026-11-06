// World and level select.
import { h, btn, icon } from '../ui/dom.js';
import { sfx, speak } from '../audio/sfx.js';
import { WORLDS, LEVELS } from '../content/levels.js';
import { save } from '../progress/save.js';
import { mapThumb, THEMES } from '../play/board.js';
import { bitPortrait } from '../art/bit.js';
import { worldColor } from './play.js';

const UNLOCK_ALL = /[?&]unlock/.test(location.search) || /unlock/.test(location.hash);
export const levelOpen = (lv) => UNLOCK_ALL || lv.index === 0 || save.stars(LEVELS[lv.index - 1].id) > 0;

export function worldsScreen(root, params, app) {
  const firstOpen = () => { const lv = LEVELS.find((l) => levelOpen(l) && !save.stars(l.id)) || LEVELS[0]; return lv.world.id; };
  let current = params.world || firstOpen();
  const total = save.totalStars();
  const worldRow = h('div.worldrow');
  const levelArea = h('div.levelarea');
  root.append(h('div.worlds',
    h('div.topbar', btn('icon.back', icon('back'), () => app.go('title')), h('div.lvtitle', {}, h('b', {}, 'Choose a level'), h('small', {}, 'レベルを えらぼう')), h('div.spacer'),
      h('div.starpill', {}, h('span.s', {}, '★'), ` ${total} / ${LEVELS.length * 3}`)),
    h('div.worldsbody', worldRow, levelArea)));

  function draw() {
    worldRow.replaceChildren(...WORLDS.map((w) => {
      const lv = w.levels;
      const got = lv.reduce((s, l) => s + save.stars(l.id), 0);
      const open = levelOpen(lv[0]);
      const th = THEMES[w.theme];
      const card = h('button.worldcard' + (w.id === current ? '.on' : '') + (open ? '' : '.locked'), {
        style: { '--c': worldColor(w.id), '--sky': th.sky[0], '--ground': th.top, '--cliff': th.cliff },
        onclick: () => { if (!open) { sfx.play('error'); return; } current = w.id; sfx.play('pick'); speak(w.en.replace('…', '')); draw(); },
      },
        h('div.wnum', {}, String(w.id)),
        h('div.wisland', h('i.top'), h('i.cliff')),
        h('div.wname', {}, w.en), h('div.wja', {}, w.ja),
        h('div.widea', {}, w.idea, h('small', {}, w.ideaJa)),
        h('div.wstars', {}, open ? `★ ${got}/${lv.length * 3}` : icon('lock')));
      return card;
    }), h('button.worldcard.makecard', { onclick: () => { sfx.play('pick'); app.go('studioHome', {}); } }, h('div.wnum', {}, '★'), h('div.wmake', icon('make')), h('div.wname', {}, 'Make'), h('div.wja', {}, 'じぶんで つくる'), h('div.widea', {}, 'Studio', h('small', {}, 'ゲーム・おはなし'))));
    const w = WORLDS.find((x) => x.id === current);
    levelArea.replaceChildren(
      h('div.worldhead', bitPortrait(84, { mood: 'happy' }), h('div', {}, h('h2', {}, w.en, h('span', {}, w.ja)), h('p', {}, 'Big idea: ', h('b', {}, w.idea), ' — ', w.ideaJa))),
      h('div.levelgrid', ...w.levels.map((lv, i) => {
        const open = levelOpen(lv), s = save.stars(lv.id);
        return h('button.lvcard' + (open ? '' : '.locked') + (s ? '.done' : ''), {
          style: { '--c': worldColor(w.id) },
          onclick: () => { if (!open) { sfx.play('error'); return; } app.go('play', { id: lv.id }); },
        },
          h('div.lvnum', {}, lv.id),
          h('div.lvthumb', open ? mapThumb(lv, 0, 96) : icon('lock')),
          h('div.lvname', {}, lv.title), h('div.lvja', {}, lv.ja),
          lv.maps.length > 1 ? h('div.lvtag', {}, `${lv.maps.length} maps`) : lv.start ? h('div.lvtag.bug', {}, 'bug!') : null,
          h('div.lvstars', ...[1, 2, 3].map((k) => h('span' + (k <= s ? '.on' : ''), {}, '★'))));
      })));
  }
  draw();
}
