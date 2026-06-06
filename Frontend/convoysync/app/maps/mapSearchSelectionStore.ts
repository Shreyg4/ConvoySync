/**
 * One-shot handoff for place-search results. The search screen sets a selected
 * place, and the caller consumes it on focus so stale picks are cleared.
 */
export type SelectedMapPlace = {
    latitude: number;
    longitude: number;
    description?: string;
};

let selectedMapPlace: SelectedMapPlace | null = null;

export const setSelectedMapPlace = (place: SelectedMapPlace) => {
    selectedMapPlace = place;
};

export const consumeSelectedMapPlace = () => {
    const place = selectedMapPlace;
    selectedMapPlace = null;
    return place;
};
