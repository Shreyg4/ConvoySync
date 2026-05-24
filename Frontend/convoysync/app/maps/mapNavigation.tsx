import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '../../theme';
import { getTripPlannerDraft } from './tripPlannerStore';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const ADVANCE_THRESHOLD_METERS = 30;

const getManeuverIcon = (maneuver?: string): any => {
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

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const MapNavigation = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [customOrigin, setCustomOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationLabel, setDestinationLabel] = useState('');
    const [stops, setStops] = useState<{ latitude: number; longitude: number; label: string }[]>([]);

    const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [speed, setSpeed] = useState(0);
    const [legs, setLegs] = useState<any[]>([]);
    const [legIndex, setLegIndex] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);
    const [remainingDuration, setRemainingDuration] = useState(0);
    const [totalDistanceMi, setTotalDistanceMi] = useState(0);

    const legsRef = useRef<any[]>([]);
    const legIndexRef = useRef(0);
    const stepIndexRef = useRef(0);

    useEffect(() => {
        const draft = getTripPlannerDraft();
        setCustomOrigin(draft.customOrigin);
        setDestination(draft.destination);
        setDestinationLabel(draft.destinationLabel);
        setStops(draft.stops);
    }, []);

    useEffect(() => { legsRef.current = legs; }, [legs]);
    useEffect(() => { legIndexRef.current = legIndex; }, [legIndex]);
    useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);

    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const initial = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });
            const initLoc = {
                latitude: initial.coords.latitude,
                longitude: initial.coords.longitude,
            };
            setLiveLocation(initLoc);
            mapRef.current?.animateCamera({
                center: initLoc,
                heading: initial.coords.heading ?? 0,
                pitch: 40,
                zoom: 17,
            });

            sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 2,
                },
                ({ coords }) => {
                    const { latitude, longitude, speed: rawSpeed, heading } = coords;
                    setLiveLocation({ latitude, longitude });
                    setSpeed(rawSpeed != null && rawSpeed > 0.5 ? Math.round(rawSpeed * 2.237) : 0);
                    mapRef.current?.animateCamera(
                        { center: { latitude, longitude }, heading: heading ?? 0, pitch: 40, zoom: 17 },
                        { duration: 600 }
                    );

                    const li = legIndexRef.current;
                    const si = stepIndexRef.current;
                    const step = legsRef.current[li]?.steps?.[si];
                    if (step?.end_location) {
                        const dist = haversine(
                            latitude, longitude,
                            step.end_location.lat, step.end_location.lng
                        );
                        if (dist < ADVANCE_THRESHOLD_METERS) {
                            const stepDurationMin = (step.duration?.value ?? 0) / 60;
                            setRemainingDuration(prev => Math.max(0, prev - stepDurationMin));
                            const nextSi = si + 1;
                            if (nextSi < legsRef.current[li].steps.length) {
                                setStepIndex(nextSi);
                                stepIndexRef.current = nextSi;
                            } else {
                                const nextLi = li + 1;
                                if (nextLi < legsRef.current.length) {
                                    setLegIndex(nextLi);
                                    setStepIndex(0);
                                    legIndexRef.current = nextLi;
                                    stepIndexRef.current = 0;
                                }
                            }
                        }
                    }
                }
            );
        })();

        return () => { sub?.remove(); };
    }, []);

    const activeStops = stops.filter(s => s.latitude !== 0 || s.longitude !== 0);
    const routePoints = destination ? [destination, ...activeStops] : activeStops;
    const routeDestination = routePoints[routePoints.length - 1] ?? null;
    const routeWaypoints = routePoints.slice(0, routePoints.length - 1);
    const routeOrigin = customOrigin || liveLocation;

    const currentStep = legs[legIndex]?.steps?.[stepIndex];
    const instruction = currentStep
        ? stripHtml(currentStep.html_instructions)
        : routeDestination ? 'Follow the route' : 'No route set';
    const distanceToTurn = currentStep?.distance?.text ?? '';
    const eta = remainingDuration > 0
        ? new Date(Date.now() + remainingDuration * 60 * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '--:--';

    const navTop = insets.top + 16;
    const statsBarHeight = 70 + insets.bottom;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={StyleSheet.absoluteFillObject}
                showsUserLocation={true}
                showsMyLocationButton={false}
                rotateEnabled={true}
                pitchEnabled={true}
            >
                {routeOrigin && routeDestination && (
                    <MapViewDirections
                        origin={routeOrigin}
                        destination={routeDestination}
                        waypoints={routeWaypoints}
                        apikey={GOOGLE_API_KEY}
                        strokeColor={THEME.COLOR.mint}
                        strokeWidth={5}
                        onReady={(result) => {
                            const fetchedLegs = (result as any).legs ?? [];
                            setLegs(fetchedLegs);
                            legsRef.current = fetchedLegs;
                            setRemainingDuration(result.duration);
                            setTotalDistanceMi(result.distance * 0.621371);
                            setLegIndex(0);
                            setStepIndex(0);
                            legIndexRef.current = 0;
                            stepIndexRef.current = 0;
                        }}
                    />
                )}
            </MapView>

            {/* Back button */}
            <HapticPressable
                hapticStyle="light"
                onPress={() => router.back()}
                style={[styles.backButton, { top: navTop }]}
            >
                <Ionicons name="chevron-back" size={28} color={THEME.COLOR.mint} />
            </HapticPressable>

            {/* Top navigation card */}
            <View style={[styles.navCard, { top: navTop }]}>
                <View style={styles.maneuverBox}>
                    <Ionicons
                        name={getManeuverIcon(currentStep?.maneuver)}
                        size={26}
                        color={THEME.COLOR.mint}
                    />
                </View>
                <View style={styles.instructionBlock}>
                    <Text style={styles.instructionText} numberOfLines={2}>
                        {instruction}
                    </Text>
                    {distanceToTurn ? (
                        <Text style={styles.distanceToTurn}>{distanceToTurn}</Text>
                    ) : null}
                </View>
                <HapticPressable hapticStyle="light" style={styles.groupBox} onPress={() => {}}>
                    <Ionicons name="people" size={20} color="#3b82f6" />
                </HapticPressable>
            </View>

            {/* Return to location button — bottom right, replaces warning icon */}
            <HapticPressable
                hapticStyle="light"
                style={[styles.locateButton, { bottom: statsBarHeight + 12 }]}
                onPress={() => {
                    if (liveLocation) {
                        mapRef.current?.animateCamera(
                            { center: liveLocation, pitch: 40, zoom: 17 },
                            { duration: 500 }
                        );
                    }
                }}
            >
                <Ionicons name="locate" size={22} color={THEME.COLOR.mint} />
            </HapticPressable>

            {/* Bottom stats bar */}
            <View style={[styles.statsBar, { height: statsBarHeight, paddingBottom: insets.bottom || 12 }]}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>SPEED</Text>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statBig}>{speed}</Text>
                        <Text style={styles.statUnit}> MPH</Text>
                    </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>DIST</Text>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statBig}>{totalDistanceMi.toFixed(1)}</Text>
                        <Text style={styles.statUnit}> mi</Text>
                    </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>ETA</Text>
                    <Text style={styles.statBig}>{eta}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        left: 12,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    },
    navCard: {
        position: 'absolute',
        left: 60,
        right: 16,
        backgroundColor: 'rgba(8, 8, 8, 0.92)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(118, 224, 187, 0.2)',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    maneuverBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(118, 224, 187, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(118, 224, 187, 0.25)',
    },
    instructionBlock: {
        flex: 1,
    },
    instructionText: {
        color: THEME.COLOR.white,
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    distanceToTurn: {
        color: THEME.COLOR.mint,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 3,
    },
    groupBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
    },
    locateButton: {
        position: 'absolute',
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: THEME.COLOR.mint,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    },
    statsBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(8, 8, 8, 0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        zIndex: 10,
        elevation: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        color: THEME.COLOR.neutral500,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statBig: {
        color: THEME.COLOR.white,
        fontSize: 30,
        fontWeight: '200',
        letterSpacing: -0.5,
    },
    statUnit: {
        color: THEME.COLOR.neutral500,
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

export default MapNavigation;
