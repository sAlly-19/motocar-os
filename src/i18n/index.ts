import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ptBR } from './pt-BR';
import { en } from './en';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': ptBR,
    'en': en,
  },
  lng: 'pt-BR',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
