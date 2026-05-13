import { Keyboard, Text, TouchableWithoutFeedback, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';

const home = () => {
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={[globalStyles.container, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }} />
                <View style={{ flex: 1, justifyContent: 'center' }}>
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
        </TouchableWithoutFeedback>
    )
}

export default home;

