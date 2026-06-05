import { Alert, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { useRouter } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';
import { signOut } from '../../lib/oauth';

const settings = () => {
    const router = useRouter();

    // Clear the stored JWT (and userId) before leaving, otherwise the session
    // stays valid and authenticated requests keep working after "logging out".
    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Logout failed', 'Could not clear your session. Please try again.');
            return;
        }
        // replace (not push) so the back gesture can't return to the authed stack.
        router.replace('/');
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>Settings</Text>
            <HapticPressable
                style={globalStyles.logOutButton}
                hapticStyle="light"
                showVisualFeedback
                onPress={handleLogout}
            >
                <Text style={globalStyles.logOutButtonText}>Log out</Text>
            </HapticPressable>
        </SafeAreaView>
    )
}

export default settings;