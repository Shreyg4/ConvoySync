import { useState } from 'react';
import { Text, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import HapticPressable from '../../components/pressableCustomization';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';

const JoinTrip = () => {
    const [code, setCode] = useState('');
     const router = useRouter();

    const onSubmit = async () => {
        const userId = await AsyncStorage.getItem("userId");

        if (!userId) {
            console.log("No userId found");
            return;
        }

        const response = await fetch(`http://192.168.1.136:8080/trips/join`, {
            method: 'POST',
            headers: {
                    'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: Number(userId),
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
