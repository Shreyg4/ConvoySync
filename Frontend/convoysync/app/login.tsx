import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';

const home = () => {
    const { control, handleSubmit, setValue } = useForm({
            defaultValues: {
                username: '',
                password: '',
            },
        });
    const router = useRouter();

    const onSubmit = (data: any) => {
        // proceed to home only when form is valid
        router.push('/home');
    };
    return (
        <SafeAreaView style={[globalStyles.container, { justifyContent: 'center' }]}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
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
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Enter password"
                                placeholderTextColor={globalStyles.input.color}
                                onChangeText={onChange}
                                value={value}
                                secureTextEntry
                            />
                        )}/>
                    <HapticPressable onPress={handleSubmit(onSubmit)} style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Login</Text>
                    </HapticPressable>
                    <Link href="/register" asChild>
                        <HapticPressable hapticStyle="light" showVisualFeedback>
                            <Text style={[globalStyles.SubmitButtonText, {color: 'white', marginTop: 40, textAlign: 'center'}]}>Don't have an account? Register</Text>
                        </HapticPressable>
                    </Link>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView> 
    )
}

export default home;

