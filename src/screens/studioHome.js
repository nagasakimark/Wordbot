// "Make" home: start a new project, remix a starter game, or open your own.
import { h, btn, icon, toast } from '../ui/dom.js';
import { sfx, speak } from '../audio/sfx.js';
import { STARTERS, starterProject, newProject, projectsStore, importProject } from '../studio/projects.js';
import { spriteThumb, backdropThumb } from '../studio/art.js';
import { bitPortrait } from '../art/bit.js';
import { TUTORIALS } from '../studio/tutorials.js';

export function studioHomeScreen(root, _params, app) {
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
  fileIn.addEventListener('change', () => {
    const f = fileIn.files[0]; if (!f) return;
    importProject(f).then((p) => { projectsStore.save(p); app.go('studio', { project: p }); }).catch(() => toast('この ファイルは ひらけません', 'warn'));
  });
  const open = (p, tutorial) => { sfx.unlock(); app.go('studio', { project: p, tutorial }); };
  const mine = projectsStore.list();

  const starterCards = STARTERS.map((s) => {
    const p = starterProject(s.id);
    return h('button.startercard', { onclick: () => { speak(s.name); open(starterProject(s.id)); } },
      h('div.sthumb', backdropThumb(s.bg, 230), h('div.sprites', ...p.sprites.slice(0, 3).map((sp) => spriteThumb(sp.kind, 58)))),
      h('div.sname', {}, s.name), h('div.sja', {}, s.ja),
      h('div.slearn', ...s.learn.map((t) => h('span', {}, t))));
  });
  const myCards = mine.map((m) => h('div.mycard', {},
    h('button.myopen', { onclick: () => { const p = projectsStore.get(m.id); if (p) open(p); } },
      h('div.mythumb', backdropThumb(m.bg || 'sky', 150), h('div.sprites', ...(m.kinds || []).slice(0, 3).map((k) => spriteThumb(k, 40)))),
      h('div.myname', {}, m.name), h('div.mydate', {}, new Date(m.updated).toLocaleDateString('ja-JP'))),
    h('button.mydel', { title: 'delete', onclick: (e) => { e.stopPropagation(); if (confirmDelete(e.currentTarget)) { projectsStore.remove(m.id); app.go('studioHome'); } } }, '×')));

  root.append(h('div.studiohome',
    h('div.topbar', btn('icon.back', icon('back'), () => app.go('title')),
      h('div.lvtitle', {}, h('b', {}, 'Make'), h('small', {}, 'じぶんの ゲームや おはなしを つくろう')), h('div.spacer'),
      btn('ghost', [icon('folder'), h('span', {}, 'Open a file'), h('small', {}, 'ファイルを ひらく')], () => fileIn.click()), fileIn),
    h('div.homebody',
      h('div.homesec', h('h2', {}, 'Learn to make', h('small', {}, 'ステップに そって つくってみよう。チェックは ビットが するよ')),
        h('div.tutrow', ...TUTORIALS.map((t, i) => h('button.tutpick', { onclick: () => { speak(t.en); open({ ...newProject(), name: t.en }, t.id); } },
          h('span.tutn', {}, String(i + 1)), h('div', {}, h('b', {}, t.en), h('small', {}, t.ja), h('span', {}, t.aboutJa)), h('span.tutsteps', {}, t.steps.length + ' steps'))))),
      h('div.homerow',
        h('button.newcard', { onclick: () => { speak("Let's make something!"); open(newProject()); } },
          bitPortrait(120, { mood: 'happy' }), h('div', {}, h('b', {}, 'New project'), h('small', {}, 'あたらしく つくる'))),
        h('div.homesec', h('h2', {}, 'Remix a game', h('small', {}, 'ゲームを あけて、なかみを かえてみよう')), h('div.starters', ...starterCards))),
      h('div.homesec', h('h2', {}, 'My projects', h('small', {}, 'じぶんの さくひん（この Chromebook に ほぞん）')),
        mine.length ? h('div.mygrid', ...myCards) : h('div.empty-my', {}, 'まだ ないよ。New project か Remix で はじめよう！')))));
}

// a two-tap delete so nothing disappears by accident
function confirmDelete(el) {
  if (el.classList.contains('sure')) return true;
  el.classList.add('sure'); el.textContent = 'けす？';
  setTimeout(() => { el.classList.remove('sure'); el.textContent = '×'; }, 2500);
  return false;
}
