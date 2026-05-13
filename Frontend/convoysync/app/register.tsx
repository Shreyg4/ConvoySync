import { Keyboard, Text, TextInput, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';

const home = () => {
    const { control, handleSubmit, setValue } = useForm({
            defaultValues: {
                email: '',
                username: '',
                password: '',
                confirmPassword: '',
            },
        });
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={[globalStyles.container, { justifyContent: 'center' }]}>
                <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Create Account</Text>
                <Controller
                    control={control}
                    name="email"
                    rules={{ required: 'Email is required' }}
                    render={({ field: {onChange, value}, fieldState: { error } }) => (
                    <TextInput
                        style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                        placeholder="Enter email"
                        placeholderTextColor={globalStyles.input.color}
                        onChangeText={onChange}
                        value={value}
                    />
                )}/>
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
                            style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                            placeholder="Enter password"
                            placeholderTextColor={globalStyles.input.color}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                        />
                )}/>
                <Controller
                    control={control}
                    name="confirmPassword"
                    rules={{ required: 'Please confirm your password' }}
                    render={({ field: {onChange, value}, fieldState: { error } }) => (
                        <TextInput
                            style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                            placeholder="Confirm password"
                            placeholderTextColor={globalStyles.input.color}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                        />
                )}/>
                <Link href="/home" asChild>
                    <HapticPressable style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Create Account</Text>
                    </HapticPressable>
                </Link>
                <Link href="/login" asChild>
                    <HapticPressable hapticStyle="light" showVisualFeedback>
                        <Text style={[globalStyles.SubmitButtonText, {color: 'white', marginTop: 40, textAlign: 'center'}]}>Already have an account? Login</Text>
                    </HapticPressable>
                </Link>
            </SafeAreaView> 
        </TouchableWithoutFeedback>
    )
}

export default home;

