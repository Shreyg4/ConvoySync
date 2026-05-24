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
