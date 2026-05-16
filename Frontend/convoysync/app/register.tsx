import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';

const Register = () => {
    const { control, handleSubmit, setError } = useForm({
            defaultValues: {
                email: '',
                username: '',
                password: '',
                confirmPassword: '',
            },
        });
    const router = useRouter();

    const onSubmit = (data: any) => {
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { type: 'validate', message: 'Passwords do not match' });
            return;
        }
        // all good
        router.push('/home');
    };
    return (
        <SafeAreaView style={globalStyles.container}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
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
                    <HapticPressable onPress={handleSubmit(onSubmit)} style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Create Account</Text>
                    </HapticPressable>
                    <Link href="/login" asChild>
                        <HapticPressable hapticStyle="light" showVisualFeedback>
                            <Text style={[globalStyles.SubmitButtonText, {color: 'white', marginTop: 40, textAlign: 'center'}]}>Already have an account? Login</Text>
                        </HapticPressable>
                    </Link>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Register;

