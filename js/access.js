// QUDRA ACCESS – accessibility settings applied app-wide
import { hooks, h, st, tr, _, card, btn, pageHead, note, speak } from './core.js';
import * as S from './store.js';

export const DEFAULT = { big: 0, contrast: false, calm: false, dys: false, readAll: false };
export function applyA11y() {
  const a = Object.assign({}, DEFAULT, st().a11y || {}); const c = document.body.classList;
  c.toggle('a-contrast', !!a.contrast); c.toggle('a-calm', !!a.calm); c.toggle('a-dys', !!a.dys);
  document.documentElement.style.fontSize = [16, 19, 22][a.big || 0] + 'px';
}
export function viewAccess() {
  const s = st(); s.a11y = Object.assign({}, DEFAULT, s.a11y || {}); const a = s.a11y;
  const set = (patch) => { Object.assign(a, patch); S.save(); applyA11y(); if (patch.calm !== undefined) hooks.apply3d(); hooks.render(); };
  const tog = (key, label, desc) => h('label', { class: 'chk big' }, h('input', { type: 'checkbox', checked: !!a[key], onchange: (e) => set({ [key]: e.target.checked }) }), h('span', {}, h('b', {}, label), h('small', { class: 'muted', style: 'display:block' }, desc)));
  return h('div', { class: 'page' }, pageHead('♿', 'QUDRA ACCESS', _('التطبيق لكل الناس', 'Une appli pour tous', 'An app for everyone')),
    card(h('h3', {}, _('حجم الخط', 'Taille du texte', 'Text size')), h('div', { class: 'row wrap' }, [[0, 'A'], [1, 'A+'], [2, 'A++']].map(([v, l]) => h('button', { class: 'chip big' + ((a.big || 0) === v ? ' on' : ''), onclick: () => set({ big: v }) }, l)))),
    card(tog('contrast', _('تباين عالي', 'Contraste élevé', 'High contrast'), _('ألوان أوضح للقراءة', 'Couleurs plus lisibles', 'Clearer colours for reading')),
      tog('calm', _('وضع هادئ', 'Mode calme', 'Calm mode'), _('بلا حركة وبلا مشهد 3D', 'Sans animation ni scène 3D', 'No motion, no 3D scene')),
      tog('dys', _('خط سهل القراءة', 'Police lisible (dyslexie)', 'Easy-read font'), _('مسافات أكبر بين الحروف والأسطر', 'Plus d\'espace entre lettres et lignes', 'More spacing between letters and lines')),
      tog('readAll', _('زر القراءة بالصوت', 'Bouton « lire à voix haute »', 'Read-aloud button'), _('كيبان فالدروس', 'Affiché dans les leçons', 'Shown in lessons'))),
    card(btn('🔊 ' + _('جرب الصوت', 'Tester la voix', 'Test voice'), () => speak(tr('tagline')), 'ghost'), note(_('الصوت كيعتمد على المتصفح والجهاز.', 'La voix dépend du navigateur et de l\'appareil.', 'Voice depends on your browser and device.'))));
}
