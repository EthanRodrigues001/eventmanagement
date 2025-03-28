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
