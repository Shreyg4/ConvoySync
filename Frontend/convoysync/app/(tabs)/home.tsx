import { Text } from 'react-native'
import { useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';
import { apiFetch, ApiError } from '../../lib/api';
import { signOut } from '../../lib/oauth';
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';

type Trip = {
    id: number;
    name: string;
    inviteCode: string;
    estStart: string;
    status: string;
    role: "owner" | "member";
};

const Home = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const loadTrips = async () => {
                try {
                    setErrorMsg(null);
                    const data = await apiFetch('/users/me/trips');
                    setTrips(data);
                } catch (error) {
                    // Expired/missing session -> send the user back to log in.
                    if (error instanceof ApiError && error.status === 401) {
                        await signOut();
                        router.replace('/login');
                        return;
                    }
                    setErrorMsg('Could not load your trips. Please try again.');
                }
            };

            loadTrips();
        }, [router])
    );

    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>My Journeys</Text>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
            >
                {errorMsg ? (
                    <Text style={[globalStyles.title, { color: '#ef4444' }]}>{errorMsg}</Text>
                ) : trips.length > 0 ? (
                    trips.map((trip) => (
                        <HapticPressable
                            key={trip.id}
                            hapticStyle="light"
                            showVisualFeedback
                            style={globalStyles.TripButton}
                            onPress={() => {
                                router.push({
                                    pathname: trip.role === "member" ? "/tripInfoMember" : "/tripInfo",
                                    params: {
                                        tripId: trip.id,
                                    },
                                });
                            }}
                        >
                            <Text style={globalStyles.TripButtoneText}>
                                {trip.name}
                            </Text>
                        </HapticPressable>
                    ))
                ) : (
                    <Text style={globalStyles.title}>No trips found.</Text>
                )}
            </ScrollView>

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
        </SafeAreaView>
    );
}

export default Home;