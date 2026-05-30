import { useState } from 'react';
import { Text, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import HapticPressable from '../../components/pressableCustomization';

const JoinTrip = () => {
    const [code, setCode] = useState('');

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
                    onPress={() => console.log('join:', code)}
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
