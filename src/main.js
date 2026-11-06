import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/m-plus-rounded-1c/500.css';
import '@fontsource/m-plus-rounded-1c/700.css';
import '@fontsource/m-plus-rounded-1c/800.css';
import './styles.css';
import { fitStage } from './ui/dom.js';
import { sfx } from './audio/sfx.js';
import { save } from './progress/save.js';
import { titleScreen } from './screens/title.js';
import { worldsScreen } from './screens/worlds.js';
import { playScreen } from './screens/play.js';
import { studioScreen } from './screens/studio.js';
import { studioHomeScreen } from './screens/studioHome.js';
import { newProject, starterProject } from './studio/projects.js';

const SCREENS = { title: titleScreen, worlds: worldsScreen, play: playScreen, studio: studioScreen, studioHome: studioHomeScreen };
let cleanup = null;
export const app = {
  current: null,
  go(name, params = {}) {
    const holder = document.getElementById('screen');
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    document.getElementById('overlay').replaceChildren();
    holder.replaceChildren();
    const el = document.createElement('div');
    el.className = 'scr scr-' + name;
    holder.append(el);
    this.current = name;
    cleanup = SCREENS[name](el, params, app) || null;
    el.classList.add('enter'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('enter')));
  },
};
window.app = app;

fitStage();
window.addEventListener('resize', fitStage);
const s = save.get().settings;
sfx.apply(s);
document.getElementById('stage').classList.toggle('hints', s.hints !== false);
window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

// ?level=2-3 opens a level directly (handy for teachers and tests)
const q = new URLSearchParams(location.search);
document.fonts?.ready.then(() => {});
if (q.get('level')) app.go('play', { id: q.get('level') });
else if (q.has('make')) app.go('studioHome', {});
else if (q.get('starter')) app.go('studio', { project: starterProject(q.get('starter')) });
else if (q.has('new')) app.go('studio', { project: newProject() });
else if (q.has('levels')) app.go('worlds', {});
else app.go('title');
