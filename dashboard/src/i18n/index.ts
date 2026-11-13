import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import ar from './ar.json';

export type Lang = 'tr' | 'ar';
export const LANGS: Lang[] = ['tr', 'ar'];
const KEY = 'yh-lang';

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'tr' || saved === 'ar') return saved;
  } catch {
    /* storage can be blocked */
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'tr';
}

/** Keeps <html lang dir> in step with the language so RTL layout (logical CSS properties) follows. */
function applyDocument(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, ar: { translation: ar } },
  lng: initial(),
  fallbackLng: 'tr',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
applyDocument(i18n.language as Lang);
i18n.on('languageChanged', (l) => applyDocument(l as Lang));

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
  void i18n.changeLanguage(lang);
}

export default i18n;
