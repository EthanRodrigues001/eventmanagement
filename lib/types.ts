export interface Event {
  id: string;
  title: string;
  description: string;
  logoURL: string | null;
  bannerURL: string | null;
  category: string;
  price: number;
  registrations: boolean;
  eligibility: string;
  location: string;
  startDate: string;
  endDate: string;
  sponsorshipGoal: number;
  currentSponsorship: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Speaker {
  id: string;
  eventId: string;
  name: string;
  profession: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  eventId: string;
  role: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

export interface EventFilters {
  price: number[];
  categories: string[];
  startDate: Date | null;
}

export type EventCategory =
  | "technical"
  | "cultural"
  | "social"
  | "academic"
  | "sports"
  | "other";

export const EVENT_CATEGORIES: EventCategory[] = [
  "technical",
  "cultural",
  "social",
  "academic",
  "sports",
  "other",
];

export interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  phoneNo: string;
  logoURL: string | null;
  amount: number;
  addedAt: string;
}

export interface Winner {
  id: string;
  eventId: string;
  userId: string;
  position: string;
  displayName?: string;
  photoURL?: string | null;
  addedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  receiverId?: string;
  eventId?: string;
  message: string;
  sentAt: string;
  isRead?: boolean;
}

export interface Connection {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  earnedAt: string;
}

export interface Certificate {
  id: string;
  name: string;
  eventId: string;
  userId: string;
  position: string;
  imageUrl: string;
  earnedAt: string;
}

export const WINNER_POSITIONS = [
  "First Place",
  "Second Place",
  "Third Place",
  "Honorable Mention",
  "Participation",
];
