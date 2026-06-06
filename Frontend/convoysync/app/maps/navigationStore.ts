/**
 * In-memory navigation snapshot shared by the live map and the directions
 * detail sheet. It avoids serializing large Google Directions legs in routes.
 */
type NavState = {
    legs: any[];
    legLabels: string[];
    remainingDuration: number;
    totalDistanceMi: number;
    activeLegIndex: number;
};

const defaultState: NavState = {
    legs: [],
    legLabels: [],
    remainingDuration: 0,
    totalDistanceMi: 0,
    activeLegIndex: 0,
};

let navState: NavState = { ...defaultState };

export const getNavState = () => navState;

export const setNavState = (next: Partial<NavState>) => {
    navState = { ...navState, ...next };
};

export const resetNavState = () => {
    navState = { ...defaultState };
};
