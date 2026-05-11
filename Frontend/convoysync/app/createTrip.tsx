import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import BackHeader from '../components/BackHeader';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Text} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import React, { useState } from 'react';
import { Button } from '@react-navigation/elements';

const createTrip = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            tripName: '',
            tripDate: '',
            tripTime: '',
        },
    });

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date: Date) => {
        console.warn("A date has been picked: ", date);
        hideDatePicker();
    };
    return (
        <SafeAreaView style={globalStyles.container}>
            <BackHeader title="Create Trip" />
            <Text style={globalStyles.inputTitle}>Trip Name</Text>
            <Controller
                control={control}
                name="tripName"
                render={({ field: {onChange, value}}) => (
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Enter trip name"
                        placeholderTextColor={globalStyles.input.color}
                        onChangeText={onChange}
                        value={value}
                    />
                )}
            />
            <Text style={globalStyles.inputTitle}>Trip Date</Text>
            <Controller
                control={control}
                name="tripDate"
                render={({ field: {onChange, value}}) => 
                <>
                    <Button onPress={showDatePicker}>Select Date</Button>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        display="inline"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                    />
                </>
                }
            />
            <Text style={globalStyles.inputTitle}>Trip Time</Text>
            <Controller
                control={control}
                name="tripTime"
                render={({ field: {onChange, value}}) => 
                <>
                    <Button onPress={showDatePicker}>Select Time</Button>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="time"
                        display="spinner"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                    />
                </>
                }
            />
        </SafeAreaView>
    )
}

export default createTrip;