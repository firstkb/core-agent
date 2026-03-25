import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import Logger from './logger/Logger';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, //__APP_ENV__ === 'DEV',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage' ], //'navigator'
      caches: ['localStorage']
    }
  })
  .then(() => {
    Logger.debug('i18next is ready...');
  })
  .catch((error) => {
    Logger.error('Failed to initialize i18next:', error);
  });

export default i18n;
