import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '../../theme';
import { getTripPlannerDraft } from './tripPlannerStore';
import { setNavState } from './navigationStore';
import { mapStyles } from '@/styles/mapStyles';

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
    const [heading, setHeading] = useState(0);
    const [statsExpanded, setStatsExpanded] = useState(false);
    const [cardHeight, setCardHeight] = useState(0);
    const [legs, setLegs] = useState<any[]>([]);
    const [legIndex, setLegIndex] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);
    const [remainingDuration, setRemainingDuration] = useState(0);
    const [totalDistanceMi, setTotalDistanceMi] = useState(0);

    const legsRef = useRef<any[]>([]);
    const legIndexRef = useRef(0);
    const stepIndexRef = useRef(0);
    const isFollowingRef = useRef(true);
    const liveLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const headingRef = useRef(0);
    const [isFollowing, setIsFollowing] = useState(true);

    const setFollowing = (val: boolean) => {
        isFollowingRef.current = val;
        setIsFollowing(val);
    };

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
                    const { latitude, longitude, heading } = coords;
                    setLiveLocation({ latitude, longitude });
                    liveLocationRef.current = { latitude, longitude };
                    setHeading(heading ?? 0);
                    headingRef.current = heading ?? 0;
                    if (isFollowingRef.current) {
                        mapRef.current?.animateCamera(
                            { center: { latitude, longitude }, heading: heading ?? 0, pitch: 40, zoom: 17 },
                            { duration: 600 }
                        );
                    }

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
    const legLabels = destination
        ? [destinationLabel, ...activeStops.map(s => s.label)]
        : activeStops.map(s => s.label);
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

    const formatDuration = (mins: number) =>
        mins >= 60 ? `${Math.floor(mins / 60)} hr ${Math.ceil(mins % 60)} min` : `${Math.ceil(mins)} min`;

    const navTop = insets.top + 16;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={StyleSheet.absoluteFillObject}
                showsUserLocation={false}
                showsMyLocationButton={false}
                rotateEnabled={true}
                pitchEnabled={true}
                onPanDrag={() => setFollowing(false)}
            >
                {liveLocation && (
                    <Marker coordinate={liveLocation} anchor={{ x: 0.5, y: 0.5 }} flat>
                        <Ionicons
                            name="navigate"
                            size={28}
                            color={THEME.COLOR.mint}
                            style={{ transform: [{ rotate: `${heading}deg` }] }}
                        />
                    </Marker>
                )}
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
                            const distMi = result.distance * 0.621371;
                            setLegs(fetchedLegs);
                            legsRef.current = fetchedLegs;
                            setRemainingDuration(result.duration);
                            setTotalDistanceMi(distMi);
                            setLegIndex(0);
                            setStepIndex(0);
                            legIndexRef.current = 0;
                            stepIndexRef.current = 0;
                            setNavState({
                                legs: fetchedLegs,
                                legLabels,
                                remainingDuration: result.duration,
                                totalDistanceMi: distMi,
                                activeLegIndex: 0,
                            });
                        }}
                    />
                )}
            </MapView>

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

            {!isFollowing && (
                <HapticPressable
                    hapticStyle="medium"
                    style={[styles.recenterButton, { bottom: cardHeight + 16 }]}
                    onPress={() => {
                        setFollowing(true);
                        const loc = liveLocationRef.current;
                        if (loc) {
                            mapRef.current?.animateCamera(
                                { center: loc, heading: headingRef.current, pitch: 40, zoom: 17 },
                                { duration: 500 }
                            );
                        }
                    }}
                >
                    <Ionicons name="navigate" size={16} color={THEME.COLOR.black} />
                    <Text style={styles.recenterText}>Re-center</Text>
                </HapticPressable>
            )}

            {remainingDuration > 0 && (
                <View
                    style={statsExpanded ? mapStyles.tripInfoCardExpanded : mapStyles.tripInfoCard}
                    onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
                >
                    <View style={styles.handle} />
                    <View style={styles.summaryRow}>
                        <HapticPressable hapticStyle="light" onPress={() => setStatsExpanded(prev => !prev)} style={{ flex: 1 }}>
                            <Text style={mapStyles.timeText}>{formatDuration(remainingDuration)}</Text>
                            <Text style={mapStyles.distanceText}>
                                {totalDistanceMi.toFixed(1)} mi · Arrives {eta}
                            </Text>
                        </HapticPressable>
                        <HapticPressable hapticStyle="medium" onPress={() => router.replace('/maps/mapDirections')} style={styles.exitButton}>
                            <Text style={{ color: THEME.COLOR.white, fontWeight: '600' }}>Exit</Text>
                        </HapticPressable>
                    </View>

                    {statsExpanded && (
                        <View style={{ flex: 1 }}>
                            <View style={styles.divider} />
                            <View style={styles.expandedActions}>
                                <HapticPressable hapticStyle="light" style={styles.actionButton} onPress={() => router.push('/maps/navDirections')}>
                                    <Ionicons name="navigate" size={20} color={THEME.COLOR.mint} />
                                    <Text style={styles.actionButtonText}>Directions</Text>
                                </HapticPressable>
                                <View style={styles.actionDivider} />
                                <HapticPressable hapticStyle="light" style={styles.actionButton} onPress={() => {}}>
                                    <Ionicons name="git-branch" size={20} color="#3b82f6" />
                                    <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>Suggest Reroute</Text>
                                </HapticPressable>
                            </View>

                        </View>
                    )}
                </View>
            )}
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
        backgroundColor: THEME.COLOR.black,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        borderWidth: 1,
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
    recenterButton: {
        position: 'absolute',
        alignSelf: 'center',
        left: '50%',
        transform: [{ translateX: -60 }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: THEME.COLOR.mint,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
        zIndex: 20,
        elevation: 20,
    },
    recenterText: {
        color: THEME.COLOR.black,
        fontSize: 14,
        fontWeight: '700',
    },
    exitButton: {
        width: 70,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedActions: {
        flexDirection: 'column',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    actionButtonText: {
        color: THEME.COLOR.mint,
        fontSize: 14,
        fontWeight: '600',
    },
    actionDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
});

export default MapNavigation;
