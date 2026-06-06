// Shared domain types mirroring the JSON the backend returns.
// Centralized here so screens don't each redefine the same shapes.

export type Role = 'owner' | 'member';

// A single entry in the trip list (GET /users/me/trips).
export type TripSummary = {
  id: number;
  name: string;
  inviteCode: string;
  estStart: string;
  status: string;
  role: Role;
};

export type TripLocation = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type TripMember = {
  userId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export type ItineraryStop = {
  id: number;
  stopOrder: number;
  eta: string;
  location: TripLocation;
};

// Full trip details (GET /trips/:tripId).
export type TripData = {
  id: number;
  name: string;
  estStart: string;
  inviteCode: string;
  members: TripMember[];
  startLocation?: TripLocation | null;
  itinerary?: { stops: ItineraryStop[] } | null;
};
