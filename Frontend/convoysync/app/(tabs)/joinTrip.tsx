import { useState } from 'react';
import { Text, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import HapticPressable from '../../components/pressableCustomization';
import { apiUrl } from '../../lib/api';
import { authHeader } from '../../lib/oauth';
import { useRouter } from 'expo-router';

const JoinTrip = () => {
    const [code, setCode] = useState('');
     const router = useRouter();

    const onSubmit = async () => {
        const headers = await authHeader();
        if (!headers.Authorization) {
            console.log("Not signed in");
            return;
        }

        const response = await fetch(apiUrl(`/trips/join`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify({
                inviteCode: code,
            })
        });

        const text = await response.json();

        if (!response.ok) {
            // handle
            console.log('status:', response.status);
            console.log('body:', text);
            return;
        }

        router.push('/home');
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={globalStyles.container}>
                <Text style={globalStyles.title}>Join Trip</Text>
                <Text style={globalStyles.inputTitle}>Trip Code</Text>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Enter code"
                    placeholderTextColor={globalStyles.input.color}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                <HapticPressable
                    onPress={onSubmit}
                    style={globalStyles.SubmitButton}
                    hapticStyle="medium"
                    showVisualFeedback
                >
                    <Text style={globalStyles.SubmitButtonText}>Join Trip</Text>
                </HapticPressable>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default JoinTrip;
