import { Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';

/**
 * Welcome screen that lets signed-out users choose email/OAuth login or create
 * a new ConvoySync account.
 */
const index = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={{ flex: 1, alignItems: 'center', gap: 20 }}>
                <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
                <Text style={[globalStyles.title, { textAlign: 'center' }]}>Welcome to ConvoySync!</Text>
            </View>
            <View style={{ gap: 2, flex: 1, justifyContent: 'flex-end' }}>
                <Link href="/login" asChild>
                    <HapticPressable style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Login</Text>
                    </HapticPressable>
                </Link>
                <Link href="/register" asChild>
                    <HapticPressable style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Create Account</Text>
                    </HapticPressable>
                </Link>
            </View>
        </SafeAreaView>

    )
}

export default index;
