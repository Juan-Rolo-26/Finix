import { usePreferencesStore } from '@/stores/preferencesStore';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';

const translations = {
    'es-AR': es,
    'en-US': en,
    'pt-BR': pt,
};

export type Translation = typeof es;

export const useTranslation = (): Translation & { lang: string } => {
    const { language } = usePreferencesStore();
    return { ...translations[language], lang: language } as Translation & { lang: string };
};
