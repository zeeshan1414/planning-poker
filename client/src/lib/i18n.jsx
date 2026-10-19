import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, detectLanguage, translate, translateError } from './messages.js';

const LANG_KEY = 'pp.lang';
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => detectLanguage(localStorage.getItem(LANG_KEY), navigator.languages ?? [navigator.language]));

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'app.title');
  }, [lang]);

  const setLang = useCallback((code) => {
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      tError: (message) => translateError(lang, message),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <select className="lang-select" aria-label={t('common.language')} value={lang} onChange={(e) => setLang(e.target.value)}>
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
