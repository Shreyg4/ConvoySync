
import { globalStyles } from '../styles/globalStyles';
import HapticPressable from '../components/pressableCustomization';
import { useRouter, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/build/Ionicons';

export default function MapButton() {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname === '/maps/mapSearch' || pathname === '/maps/mapDirections' || pathname === '/login' || pathname === '/register' || pathname === '/') return null;

    return (
        <HapticPressable style={globalStyles.fab} hapticStyle="light" showVisualFeedback onPress={() => router.push('/maps/mapSearch')}>
            <Ionicons name="location" style={globalStyles.label} />
        </HapticPressable>
    );
}