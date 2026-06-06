import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import HapticPressable from '../../components/pressableCustomization';
import { apiFetch, ApiError } from '../../lib/api';
import { useRouter } from 'expo-router';

const JoinTrip = () => {
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const onSubmit = async () => {
        if (submitting) return;

        if (!code.trim()) {
            Alert.alert('Enter a code', 'Please enter an invite code.');
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch('/trips/join', {
                method: 'POST',
                body: { inviteCode: code.trim() },
            });
            router.push('/home');
        } catch (error) {
            let message = 'Could not join the trip. Please try again.';
            if (error instanceof ApiError) {
                if (error.status === 404) message = 'That invite code is invalid.';
                else if (error.status === 409) message = "You've already joined this trip.";
                else message = error.message;
            }
            Alert.alert('Could not join', message);
        } finally {
            setSubmitting(false);
        }
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
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={globalStyles.SubmitButtonText}>Join Trip</Text>}
                </HapticPressable>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
};

export default JoinTrip;
