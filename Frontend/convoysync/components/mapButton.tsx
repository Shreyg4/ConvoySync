import { usePathname } from 'expo-router';

export default function MapButton() {
    const pathname = usePathname();

    if (pathname !== '/createTrip') return null;

    return null;
}
