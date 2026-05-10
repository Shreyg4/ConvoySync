import { Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';

const home = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>My Journeys</Text>
            <Link href="/createTrip" asChild>
                <HapticPressable style={globalStyles.Button2} hapticStyle="light" showVisualFeedback>
                    <Text style={globalStyles.ButtonText2}>+ Plan New Adventure</Text>
                </HapticPressable>
            </Link>
        </SafeAreaView>
    )
}

export default home;