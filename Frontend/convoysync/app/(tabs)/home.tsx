import { Text } from 'react-native'
import { useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { apiUrl } from '../../lib/api';

type Trip = {
    id: number;
    name: string;
    inviteCode: string;
    estStart: string;
    status: string;
    role: "owner" | "member";
};

const home = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const loadTrips = async () => {
                try {
                    const userId = await AsyncStorage.getItem("userId");

                    if (!userId) {
                        console.log("No userId found");
                        return;
                    }

                    const response = await fetch(
                        apiUrl(`/users/${userId}/trips`)
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        console.log("status:", response.status);
                        console.log("body:", data);
                        return;
                    }

                    setTrips(data);
                } catch (error) {
                    console.error("Load trips error:", error);
                }
            };

            loadTrips();
        }, [])
    );

    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>My Journeys</Text>

            <Link href="/createTrip" asChild>
                <HapticPressable
                    style={globalStyles.AddButton}
                    hapticStyle="light"
                    showVisualFeedback
                >
                    <Text style={globalStyles.AddButtonText}>
                        + Plan New Adventure
                    </Text>
                </HapticPressable>
            </Link>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
            >
                {trips.length > 0 ? (
                    trips.map((trip) => (
                        <HapticPressable
                            key={trip.id}
                            hapticStyle="light"
                            showVisualFeedback
                            style={globalStyles.AddButton}
                            onPress={() => {
                                router.push({
                                    pathname: trip.role === "member" ? "/tripInfoMember" : "/tripInfo",
                                    params: {
                                        tripId: trip.id,
                                    },
                                });
                            }}
                        >
                            <Text style={globalStyles.AddButtonText}>
                                {trip.name}
                            </Text>
                        </HapticPressable>
                    ))
                ) : (
                    <Text style={globalStyles.title}>No trips found.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

export default home;