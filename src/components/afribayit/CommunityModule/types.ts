export interface PostAuthor {
  id: string;
  name: string;
  avatar?: string;
  reputation?: string;
}

export interface Post {
  id: string;
  title: string;
  author: string | PostAuthor;
  avatar: string;
  replies: number;
  views: number;
  category: string;
  lastActivity: string;
  createdAt?: string;
  city?: string;
  country?: string;
}

export interface Group {
  id: string;
  name: string;
  role: string;
  city: string;
  score: number;
  avatar: string;
  skills: string[];
  userId?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  attendees: number;
}

export type CommunityTabKey =
  | 'forum'
  | 'investor_groups'
  | 'news'
  | 'marketplace'
  | 'events'
  | 'points'
  | 'ambassador';

export interface CommunityTab {
  key: CommunityTabKey;
  label: string;
}

export interface ForumCategory {
  key: string;
  label: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  provider: string;
  city: string;
  price: number;
  rating: number;
  category: string;
  avatar: string;
}

export interface AfriPointLevel {
  name: string;
  min: number;
  icon: React.ReactNode;
  color: string;
}

export interface ReputationLevel {
  name: string;
  min: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}

export interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  earned: boolean;
}

export interface AmbassadorTier {
  tier: string;
  commission: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

export interface TrendingTopic {
  category: string;
  count: number;
}

export interface NewPostFormState {
  title: string;
  content: string;
  category: string;
  tags: string;
}

export interface NewGroupFormState {
  name: string;
  description: string;
  type: string;
  city: string;
}

export interface PollFormState {
  question: string;
  options: string[];
}
