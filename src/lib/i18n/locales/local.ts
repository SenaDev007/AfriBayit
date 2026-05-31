/**
 * AfriBayit — Local Languages Stub
 * Key phrases in local languages: Fon, Dioula, Moore
 * This is a stub with essential phrases only
 */

export const local = {
  // Fon (Bénin)
  fon: {
    welcome: 'Akwaba',
    search: 'Yìwàn',
    buy: 'Xò',
    rent: 'Sà xó mɛ',
    property: 'Xó ɖé',
    price: 'Axɔ́',
    location: 'Fi è xó ɖé tin te',
    contact: 'Kàn nú',
    login: 'Kɔnɛkti',
    register: 'Wlí nǔ',
    save: 'Wlí',
    cancel: 'Hwè',
    yes: 'Éé',
    no: 'Ahyì',
  },
  // Dioula (Côte d'Ivoire, Burkina Faso)
  dioula: {
    welcome: 'I ni cɛ',
    search: 'Ɲini',
    buy: 'San',
    rent: 'Sɛn',
    property: 'So',
    price: 'Sɔrɔ',
    location: 'Yɔrɔ',
    contact: 'Wale',
    login: 'Don',
    register: 'Sɛbɛn',
    save: 'Labɛn',
    cancel: 'Bɔ',
    yes: 'Awɔ',
    no: 'Ayɛ',
  },
  // Moore (Burkina Faso)
  moore: {
    welcome: 'Ne y yãmba',
    search: 'Sõosga',
    buy: 'Da',
    rent: 'Kõosgo',
    property: 'Yiri',
    price: 'Nedgre',
    location: 'Zaka',
    contact: 'Bãngre',
    login: 'Kẽ',
    register: 'Sɛbg',
    save: 'Lɛbge',
    cancel: 'Basi',
    yes: 'Yãmba',
    no: 'Ka',
  },
} as const;

export type LocalTranslations = typeof local;
