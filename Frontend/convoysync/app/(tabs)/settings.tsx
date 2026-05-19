import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';

const settings = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>Settings</Text>
            <Link href="/" asChild>
                <HapticPressable style={globalStyles.logOutButton} hapticStyle="light" showVisualFeedback>
                    <Text style={globalStyles.logOutButtonText}>Log out</Text>
                </HapticPressable>
            </Link>
        </SafeAreaView>
    )
}

export default settings;