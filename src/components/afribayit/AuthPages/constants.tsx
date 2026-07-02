// P3.7-2 — Shared constants for the AuthPages module.
// Static data (countries, cities, roles, register steps, OAuth error
// messages, easeOut animation curve) extracted from the original file.

import { Drama, Mail, User } from 'lucide-react';

export const easeOut = [0.16, 1, 0.3, 1] as const;

export const registerSteps = [
  { key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { key: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
  { key: 'role', label: 'Rôle', icon: <Drama className="w-4 h-4" /> },
];

export const COUNTRIES = [
  { value: 'BJ', label: 'Bénin' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'TG', label: 'Togo' },
  { value: 'SN', label: 'Sénégal' },
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  BJ: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon'],
  CI: ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro'],
  BF: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
  TG: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong'],
  SN: ['Dakar', 'Saint-Louis', 'Thiès', 'Kaolack', 'Ziguinchor'],
};

export const ROLES = [
  { value: 'buyer', label: 'Acheteur', desc: 'Je cherche un bien immobilier' },
  { value: 'seller', label: 'Vendeur', desc: 'Je veux vendre mon bien' },
  { value: 'agent', label: 'Agent immobilier', desc: 'Je suis agent immobilier certifié' },
  { value: 'investor', label: 'Investisseur', desc: 'Je souhaite investir' },
  { value: 'tourist', label: 'Touriste', desc: 'Je cherche un hébergement' },
  { value: 'artisan', label: 'Artisan BTP', desc: 'Je suis artisan du bâtiment' },
  { value: 'hotelier', label: 'Hôtelier / Guesthouse', desc: 'Je gère un hôtel ou une guesthouse' },
  { value: 'trainer', label: 'Formateur', desc: 'Je souhaite publier des cours' },
];

// OAuth error code → human message (matches NextAuth error names).
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    'Cet email est déjà associé à un compte avec un autre mode de connexion. Veuillez utiliser la même méthode que lors de votre inscription.',
  OAuthSignin: 'Erreur lors de la connexion via le fournisseur. Veuillez réessayer.',
  OAuthCallback: 'Erreur lors du traitement de la réponse du fournisseur. Veuillez réessayer.',
  OAuthCreateAccount: 'Impossible de créer votre compte. Veuillez réessayer.',
  AccessDenied:
    'Vous avez annulé la connexion via le fournisseur. Aucun compte n\'a été créé.',
  Callback: 'Erreur de connexion. Veuillez réessayer.',
  Configuration:
    'La configuration OAuth est incomplète côté serveur. Contactez l\'administrateur.',
  Default: 'Une erreur est survenue lors de la connexion.',
};
