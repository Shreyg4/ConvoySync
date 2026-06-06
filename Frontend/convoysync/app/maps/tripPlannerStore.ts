/**
 * In-memory draft store for the itinerary planner. It preserves route choices
 * while Expo Router moves between the planner and place-search screens.
 */
export type RouteSelectionTarget =
    | { kind: 'origin' }
    | { kind: 'destination' }
    | { kind: 'stop'; stopIndex: number };

export type RouteStop = {
    latitude: number;
    longitude: number;
    label: string;
};

export type TripPlannerDraft = {
    originLabel: string;
    customOrigin: { latitude: number; longitude: number } | null;
    destinationLabel: string;
    destination: { latitude: number; longitude: number } | null;
    stops: RouteStop[];
};

const defaultDraft: TripPlannerDraft = {
    originLabel: 'Your Location',
    customOrigin: null,
    destinationLabel: 'Choose destination',
    destination: null,
    stops: [],
};

let plannerDraft: TripPlannerDraft = defaultDraft;

export const getTripPlannerDraft = () => plannerDraft;

export const setTripPlannerDraft = (nextDraft: TripPlannerDraft) => {
    plannerDraft = nextDraft;
};

export const resetTripPlannerDraft = () => {
    plannerDraft = defaultDraft;
};
