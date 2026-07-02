export interface NotaryUser {
  id: string;
  name: string;
  avatar: string | null;
  city: string | null;
  country: string | null;
  reputation: string | null;
}

export interface Notary {
  id: string;
  userId: string;
  name: string;
  license: string;
  zone: string;
  country: string;
  rating: number;
  missions: number;
  certificationLevel: string;
  avatar: string;
  available: boolean;
  specialities: string[];
  subscription: string;
  chamberName?: string;
  specialty?: string;
  subscriptionTier?: string;
  conventionSigned?: boolean;
  certified?: boolean;
  certifiedAt?: string;
  createdAt?: string;
  user?: NotaryUser;
}

export interface EscrowAccount {
  id: string;
  property: string;
  buyer: string;
  amount: number;
  status: string;
}

export interface ModuleProps {
  onNavigate?: (section: string) => void;
}

export interface ArchivedDoc {
  id: string;
  name: string;
  date: string;
  hash: string;
}

export type NotaryTabKey = 'notaries' | 'dashboard' | 'certification' | 'deeds' | 'esignature' | 'revenue';

export interface SubscriptionTier {
  name: string;
  planType: string;
  price: number;
  priceLabel: string;
  commission: string;
  features: string[];
}

export const easeOut = [0.16, 1, 0.3, 1] as const;
