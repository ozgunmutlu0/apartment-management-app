import trAnnouncements from './locales/tr/announcements.json';
import trAuth from './locales/tr/auth.json';
import trCommon from './locales/tr/common.json';
import trDues from './locales/tr/dues.json';
import trHome from './locales/tr/home.json';
import trManage from './locales/tr/manage.json';
import trNotifications from './locales/tr/notifications.json';
import trProfile from './locales/tr/profile.json';
import trReports from './locales/tr/reports.json';
import trReservations from './locales/tr/reservations.json';
import trTabs from './locales/tr/tabs.json';
import trTickets from './locales/tr/tickets.json';

import enAnnouncements from './locales/en/announcements.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enDues from './locales/en/dues.json';
import enHome from './locales/en/home.json';
import enManage from './locales/en/manage.json';
import enNotifications from './locales/en/notifications.json';
import enProfile from './locales/en/profile.json';
import enReports from './locales/en/reports.json';
import enReservations from './locales/en/reservations.json';
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
    reservations: trReservations,
    reports: trReports,
    manage: trManage,
    notifications: trNotifications,
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
    reservations: enReservations,
    reports: enReports,
    manage: enManage,
    notifications: enNotifications,
    auth: enAuth,
  },
} as const;

export const namespaces = Object.keys(resources.tr) as (keyof typeof resources.tr)[];
export const supportedLanguages = ['tr', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = 'tr';
