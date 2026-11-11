export interface AdminListing {
  id: number; title: string; name: string; age: number; city: string;
  category: string; contactEmail: string | null; published: boolean;
  emailVerified: boolean; contactEnabled: boolean; createdAt: string;
}
export interface AdminContact {
  email: string; name: string; age: number; city: string;
  listingCount: number; firstCreated: string; lastCreated: string;
}
export interface AdminPage<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface AdminDashboard {
  stored: number; published: number; pending: number; confirmedAddresses: number;
  publications30: number; contacts30: number; trackingSince: string;
  categories: { label: string; count: number }[];
  cities: { label: string; count: number }[];
  daily: { day: string; publications: number; contacts: number }[];
}
