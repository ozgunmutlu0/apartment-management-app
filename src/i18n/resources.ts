import trAnnouncements from './locales/tr/announcements.json';
import trAuth from './locales/tr/auth.json';
import trCommon from './locales/tr/common.json';
import trDues from './locales/tr/dues.json';
import trHome from './locales/tr/home.json';
import trManage from './locales/tr/manage.json';
import trProfile from './locales/tr/profile.json';
import trTabs from './locales/tr/tabs.json';
import trTickets from './locales/tr/tickets.json';

import enAnnouncements from './locales/en/announcements.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enDues from './locales/en/dues.json';
import enHome from './locales/en/home.json';
import enManage from './locales/en/manage.json';
import enProfile from './locales/en/profile.json';
import enTabs from './locales/en/tabs.json';
import enTickets from './locales/en/tickets.json';

export const resources = {
  tr: {
    common: trCommon,
    tabs: trTabs,
    tickets: trTickets,
    announcements: trAnnouncements,
    dues: trDues,
    profile: trProfile,
    home: trHome,
    manage: trManage,
    auth: trAuth,
  },
  en: {
    common: enCommon,
    tabs: enTabs,
    tickets: enTickets,
    announcements: enAnnouncements,
    dues: enDues,
    profile: enProfile,
    home: enHome,
    manage: enManage,
    auth: enAuth,
  },
} as const;

export const namespaces = Object.keys(resources.tr) as (keyof typeof resources.tr)[];
export const supportedLanguages = ['tr', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = 'tr';
