import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { getTripPlannerDraft } from './tripPlannerStore';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const STOP_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

const getStopColor = (index: number) => STOP_COLORS[index % STOP_COLORS.length];

const getManeuverIcon = (maneuver?: string) => {
    switch (maneuver) {
        case 'turn-left': case 'turn-sharp-left': case 'ramp-left': case 'fork-left': case 'keep-left': return 'arrow-back';
        case 'turn-right': case 'turn-sharp-right': case 'ramp-right': case 'fork-right': case 'keep-right': return 'arrow-forward';
        case 'turn-slight-left': return 'return-up-back';
        case 'turn-slight-right': return 'return-up-forward';
        case 'uturn-left': case 'uturn-right': return 'return-down-back';
        case 'roundabout-left': case 'roundabout-right': return 'refresh';
        case 'merge': return 'git-merge';
        case 'ferry': case 'ferry-train': return 'boat';
        default: return 'arrow-up';
    }
};

const MapDirections = () => {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationGranted, setLocationGranted] = useState(false);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [originLabel, setOriginLabel] = useState('Your Location');
    const [customOrigin, setCustomOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationLabel, setDestinationLabel] = useState('Choose destination');
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [stops, setStops] = useState<{ latitude: number; longitude: number; label: string }[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [legs, setLegs] = useState<any[]>([]);
    const [legIndex, setLegIndex] = useState(0);
    const [cardHeight, setCardHeight] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            const draft = getTripPlannerDraft();
            setOriginLabel(draft.originLabel);
            setCustomOrigin(draft.customOrigin);
            setDestinationLabel(draft.destinationLabel);
            setDestination(draft.destination);
            setStops(draft.stops);
        }, [])
    );

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
    const formatDuration = (mins: number) =>
        mins >= 60 ? `${Math.floor(mins / 60)} hr ${Math.ceil(mins % 60)} min` : `${Math.ceil(mins)} min`;
    const arrivalTime = duration > 0
        ? new Date(Date.now() + duration * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    const activeOrigin = customOrigin || origin;
    const activeStops = stops.filter((stop) => stop.latitude !== 0 || stop.longitude !== 0);
    const routePoints = destination
        ? [{ latitude: destination.latitude, longitude: destination.longitude }, ...activeStops]
        : activeStops;
    const routeDestination = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;
    const routeWaypoints = routePoints.slice(0, Math.max(routePoints.length - 1, 0)).map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
    }));
    const legLabels = destination
        ? [destinationLabel, ...activeStops.map(s => s.label)]
        : activeStops.map(s => s.label);
    const currentLeg = legs[legIndex];

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            setLocationGranted(true);

            const location = await Location.getCurrentPositionAsync({});
            const currentLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setOrigin(currentLoc);

            mapRef.current?.animateToRegion({
                ...currentLoc,
                latitudeDelta: 0.09,
                longitudeDelta: 0.04,
            }, 1000);
        })();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={StyleSheet.absoluteFillObject}
                showsUserLocation={locationGranted}
                showsMyLocationButton={false}
                followsUserLocation={true}
            >
                {destination && (
                    <Marker coordinate={destination} title={destinationLabel}>
                        <Ionicons name="location" size={36} color="#ef4444" />
                    </Marker>
                )}

                {customOrigin && (
                    <Marker coordinate={customOrigin} title={originLabel}>
                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: THEME.COLOR.mint, borderWidth: 2, borderColor: '#fff' }} />
                    </Marker>
                )}

                {activeStops.map((stop, index) => (
                    <Marker
                        key={`${stop.label}-${index}`}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        title={stop.label}
                    >
                        <Ionicons name="location" size={36} color={getStopColor(index)} />
                    </Marker>
                ))}

                {activeOrigin && routeDestination && (
                    <MapViewDirections
                        origin={activeOrigin}
                        destination={routeDestination}
                        waypoints={routeWaypoints}
                        apikey={GOOGLE_API_KEY}
                        strokeColor="blue"
                        strokeWidth={5}
                        onReady={(result) => {
                            setDistance(result.distance);
                            setDuration(result.duration);
                            setLegs((result as any).legs ?? []);
                            setLegIndex(0);
                            setExpanded(false);
                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 150, right: 80, bottom: 320, left: 80 },
                                animated: true,
                            });
                        }}
                    />
                )}
            </MapView>

            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
                <View style={styles.headerRow}>
                    <BackHeader
                        title=""
                        icon="chevron-back"
                        color={THEME.COLOR.mint}
                        onPress={() => router.replace('/maps/planner')}
                    />
                </View>

                {!routeDestination && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No route planned yet</Text>
                        <Text style={styles.emptySubtitle}>Add your trip stops in Planner to preview the route here.</Text>
                    </View>
                )}
            </SafeAreaView>

            {distance > 0 && duration > 0 && routeDestination && (
                <View
                    style={expanded ? mapStyles.tripInfoCardExpanded : mapStyles.tripInfoCard}
                    onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
                >
                    <HapticPressable hapticStyle="light" onPress={() => setExpanded(prev => !prev)}>
                        <View style={styles.handle} />
                        <View style={styles.summaryRow}>
                            <View>
                                <Text style={mapStyles.timeText}>{formatDuration(duration)}</Text>
                                <Text style={mapStyles.distanceText}>
                                    {(distance * 0.621371).toFixed(1)} mi · Arrives {arrivalTime}
                                </Text>
                            </View>
                            <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={22} color={THEME.COLOR.neutral500} />
                        </View>
                    </HapticPressable>

                    {expanded && currentLeg && (
                        <View style={{ flex: 1 }}>
                            <View style={styles.divider} />
                            <View style={styles.legHeader}>
                                <Text style={styles.legTitle} numberOfLines={1}>To: {legLabels[legIndex]}</Text>
                                {legs.length > 1 && (
                                    <Text style={styles.legCounter}>Stop {legIndex + 1}/{legs.length}</Text>
                                )}
                            </View>
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                {currentLeg.steps.map((step: any, i: number) => (
                                    <View key={i} style={styles.stepItem}>
                                        <Ionicons name={getManeuverIcon(step.maneuver) as any} size={20} color={THEME.COLOR.mint} />
                                        <Text style={styles.stepInstruction}>{stripHtml(step.html_instructions)}</Text>
                                        <Text style={styles.stepDistance}>{step.distance?.text}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                            {legs.length > 1 && (
                                <View style={styles.legNav}>
                                    <View style={{ flex: 1 }}>
                                        {legIndex > 0 && (
                                            <HapticPressable hapticStyle="light" onPress={() => setLegIndex(i => i - 1)}>
                                                <Text style={styles.legNavText}>← Prev</Text>
                                            </HapticPressable>
                                        )}
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        {legIndex < legs.length - 1 && (
                                            <HapticPressable hapticStyle="light" onPress={() => setLegIndex(i => i + 1)}>
                                                <Text style={styles.legNavText} numberOfLines={1}>{legLabels[legIndex + 1]} →</Text>
                                            </HapticPressable>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            {locationGranted && (
                <HapticPressable
                    style={[mapStyles.locationButton, { bottom: cardHeight + 12 }]}
                    hapticStyle="light"
                    onPress={() => {
                        if (origin) {
                            mapRef.current?.animateToRegion({
                                ...origin,
                                latitudeDelta: 0.09,
                                longitudeDelta: 0.04,
                            }, 800);
                        }
                    }}
                >
                    <Ionicons name="locate" size={22} color={THEME.COLOR.mint} />
                </HapticPressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        inset: 0,
    },
    headerRow: {
        marginTop: 8,
        marginLeft: 10,
    },
    emptyCard: {
        marginTop: 120,
        marginHorizontal: 24,
        padding: 18,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    emptyTitle: {
        color: THEME.COLOR.white,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        color: THEME.COLOR.neutral400,
        fontSize: 14,
        lineHeight: 20,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    legHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    legTitle: {
        color: THEME.COLOR.white,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    legCounter: {
        color: THEME.COLOR.neutral500,
        fontSize: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
        gap: 12,
    },
    stepInstruction: {
        flex: 1,
        color: THEME.COLOR.white,
        fontSize: 13,
        lineHeight: 18,
    },
    stepDistance: {
        color: THEME.COLOR.neutral500,
        fontSize: 12,
    },
    legNav: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    legNavText: {
        color: THEME.COLOR.mint,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default MapDirections;
