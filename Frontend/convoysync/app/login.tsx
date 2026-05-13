import { Keyboard, Text, TextInput, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';

const home = () => {
    const { control, handleSubmit, setValue } = useForm({
            defaultValues: {
                username: '',
                password: '',
            },
        });
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={[globalStyles.container, { justifyContent: 'center' }]}>
                <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Login</Text>
                <Controller
                    control={control}
                    name="username"
                    rules={{ required: 'Username is required' }}
                    render={({ field: {onChange, value}, fieldState: { error } }) => (
                    <TextInput
                        style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                        placeholder="Enter username"
                        placeholderTextColor={globalStyles.input.color}
                        onChangeText={onChange}
                        value={value}
                    />
                )}/>
                <Controller
                    control={control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field: {onChange, value}, fieldState: { error } }) => (
                        <TextInput
                            style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }]}
                            placeholder="Enter password"
                            placeholderTextColor={globalStyles.input.color}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                        />
                    )}/>
                <Link href="/home" asChild>
                    <HapticPressable style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Login</Text>
                    </HapticPressable>
                </Link>
                <Link href="/register" asChild>
                    <HapticPressable hapticStyle="light" showVisualFeedback>
                        <Text style={[globalStyles.SubmitButtonText, {color: 'white', marginTop: 40, textAlign: 'center'}]}>Don't have an account? Register</Text>
                    </HapticPressable>
                </Link>
            </SafeAreaView> 
        </TouchableWithoutFeedback>
    )
}

export default home;

