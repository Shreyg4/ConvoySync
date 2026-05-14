import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import BackHeader from '../components/BackHeader';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Text, Pressable, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import React, { useState } from 'react';
import HapticPressable from '../components/pressableCustomization';

const createTrip = () => {
    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            tripName: '',
            tripDate: '',
            tripTime: '',
        },
    });

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<Date>(new Date());

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const showTimePicker = () => {
        setTimePickerVisibility(true);
    };

    const hideTimePicker = () => {
        setTimePickerVisibility(false);
    };

    const handleDateConfirm = (date: Date) => {
        setSelectedDate(date);
        setValue('tripDate', date.toISOString());
        console.warn("A date has been picked: ", date);
        hideDatePicker();
    };

    const handleTimeConfirm = (time: Date) => {
        setSelectedTime(time);
        setValue('tripTime', time.toISOString());
        console.warn("A time has been picked: ", time);
        hideTimePicker();
    };
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={globalStyles.container}>
                <BackHeader title="Create Trip" icon="arrow-back" />
                <Text style={globalStyles.inputTitle}>Trip Name</Text>
            <Controller
                control={control}
                name="tripName"
                rules={{ required: 'Trip name is required' }}
                render={({ field: {onChange, value}, fieldState: { error } }) => (
                    <TextInput
                        style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }]}
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
                rules={{ required: 'Trip date is required' }}
                render={({ field: {onChange, value}, fieldState: { error } }) => 
                <>
                    <HapticPressable onPress={showDatePicker}>
                        <Text style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }]}>{selectedDate.toLocaleDateString()}</Text>
                    </HapticPressable>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        display="inline"
                        date={selectedDate}
                        onConfirm={handleDateConfirm}
                        onCancel={hideDatePicker}
                    />
                </>
                }
            />
            <Text style={globalStyles.inputTitle}>Trip Start Time</Text>
            <Controller
                control={control}
                name="tripTime"
                rules={{ required: 'Trip time is required' }}
                render={({ field: {onChange, value}, fieldState: { error } }) => (
                    <>
                        <HapticPressable onPress={showTimePicker}>
                            <Text style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }]}>{selectedTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
                        </HapticPressable>
                        <DateTimePickerModal
                            isVisible={isTimePickerVisible}
                            mode="time"
                            display="spinner"
                            date={selectedTime}
                            onConfirm={handleTimeConfirm}
                            onCancel={hideTimePicker}
                        />
                    </>
                )}
            />
                <HapticPressable onPress={handleSubmit((data) => console.log(data))} style={globalStyles.SubmitButton} hapticStyle="medium" showVisualFeedback>
                    <Text style={globalStyles.SubmitButtonText}>Create Trip</Text>
                </HapticPressable>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

export default createTrip;