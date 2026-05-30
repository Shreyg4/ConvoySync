
import { globalStyles } from '../styles/globalStyles';
import HapticPressable from '../components/pressableCustomization';
import { useRouter, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/build/Ionicons';

export default function MapButton() {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname !== '/createTrip') return null;

    return (
        <>
            {/*
            <HapticPressable style={globalStyles.fab} hapticStyle="light" showVisualFeedback onPress={() => router.push('/maps/planner')}>
                <Ionicons name="location" style={globalStyles.label} />
            </HapticPressable>

            <HapticPressable style={[globalStyles.fab, { right: 100 }]} hapticStyle="light" showVisualFeedback onPress={() => router.push('/maps/plannerSuggest')}>
                <Ionicons name="person" style={globalStyles.label} />
            </HapticPressable>
            */}
        </>
    );
}
