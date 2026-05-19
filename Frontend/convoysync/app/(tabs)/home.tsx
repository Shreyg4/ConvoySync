import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';

const home = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>My Journeys</Text>
            <Link href="/createTrip" asChild>
                <HapticPressable style={globalStyles.AddButton} hapticStyle="light" showVisualFeedback>
                    <Text style={globalStyles.AddButtonText}>+ Plan New Adventure</Text>
                </HapticPressable>
            </Link>
        </SafeAreaView>
    )
}

export default home;