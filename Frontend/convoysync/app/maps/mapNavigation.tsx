import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '../../theme';
import { getTripPlannerDraft } from './tripPlannerStore';
import { setNavState } from './navigationStore';
import { globalStyles } from '@/styles/globalStyles';
import { apiFetch } from '@/lib/api';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const ADVANCE_THRESHOLD_METERS = 40;
const ARRIVAL_THRESHOLD_METERS = 250;
const HEADING_CAMERA_DELAY_MS = 450;

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

const placeTitle = (label: string): string => {
    const comma = label.indexOf(',');
    return comma > 0 ? label.substring(0, comma) : label;
};

const formatDistanceToTurn = (meters: number): string => {
    const feet = meters * 3.28084;
    if (feet < 1000) return `${Math.round(feet / 10) * 10} ft`;
    return `${(meters * 0.000621371).toFixed(1)} mi`;
};

const MapNavigation = () => {
    const router = useRouter();
    const { tripId, returnTo } = useLocalSearchParams<{ tripId?: string; returnTo?: string }>();
    const backRoute = tripId
        ? { pathname: returnTo === 'tripInfoMember' ? '/tripInfoMember' : '/tripInfo' as const, params: { tripId } }
        : '/maps/mapDirections';
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const mapReadyRef = useRef(false);
    const headingCameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingCameraRef = useRef<{
        center: { latitude: number; longitude: number };
        heading: number;
        pitch: number;
        zoom: number;
        duration?: number;
    } | null>(null);

    const [customOrigin, setCustomOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationLabel, setDestinationLabel] = useState('');
    const [stops, setStops] = useState<{ latitude: number; longitude: number; label: string }[]>([]);

    const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [initialLocationReady, setInitialLocationReady] = useState(false);
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
    const [arrived, setArrived] = useState(false);
    const arrivedRef = useRef(false);
    const [currentDestIndex, setCurrentDestIndex] = useState(0);
    const currentDestIndexRef = useRef(0);
    const routeDestinationRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const [routeStartOrigin, setRouteStartOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const routeStartOriginSetRef = useRef(false);
    const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null);

    const setFollowing = (val: boolean) => {
        isFollowingRef.current = val;
        setIsFollowing(val);

        if (!val && headingCameraTimeoutRef.current) {
            clearTimeout(headingCameraTimeoutRef.current);
            headingCameraTimeoutRef.current = null;
        }
    };

    const focusCamera = (
        center: { latitude: number; longitude: number },
        nextHeading: number,
        duration?: number
    ) => {
        const camera = {
            center,
            heading: nextHeading,
            pitch: 40,
            zoom: 17,
        };

        if (!mapReadyRef.current) {
            pendingCameraRef.current = { ...camera, duration };
            return;
        }

        mapRef.current?.animateCamera(camera, duration ? { duration } : undefined);
    };

    const scheduleHeadingCameraUpdate = (nextHeading: number) => {
        if (headingCameraTimeoutRef.current) {
            clearTimeout(headingCameraTimeoutRef.current);
        }

        headingCameraTimeoutRef.current = setTimeout(() => {
            headingCameraTimeoutRef.current = null;
            const loc = liveLocationRef.current;

            if (!isFollowingRef.current || !mapReadyRef.current || !loc) return;

            focusCamera(loc, nextHeading, 250);
        }, HEADING_CAMERA_DELAY_MS);
    };

    useEffect(() => {
        if (tripId) {
            const loadItinerary = async () => {
                try {
                    const data = await apiFetch(`/trips/${tripId}/itinerary/stops`);

                    if (data.startLocation) {
                        setCustomOrigin({
                            latitude: data.startLocation.latitude,
                            longitude: data.startLocation.longitude,
                        });
                    }

                    const loadedStops: { latitude: number; longitude: number; label: string }[] =
                        data.stops.map((stop: any) => ({
                            latitude: stop.location.latitude,
                            longitude: stop.location.longitude,
                            label: stop.location.name,
                        }));

                    const [first, ...rest] = loadedStops;
                    if (first) {
                        setDestination({ latitude: first.latitude, longitude: first.longitude });
                        setDestinationLabel(first.label);
                    }
                    setStops(rest);
                } catch (error) {
                    console.error('Load itinerary error:', error);
                }
            };
            loadItinerary();
        } else {
            const draft = getTripPlannerDraft();
            setCustomOrigin(draft.customOrigin);
            setDestination(draft.destination);
            setDestinationLabel(draft.destinationLabel);
            setStops(draft.stops);
            if (draft.customOrigin) {
                setRouteStartOrigin(draft.customOrigin);
                routeStartOriginSetRef.current = true;
            }
        }
    }, [tripId]);

    useEffect(() => { legsRef.current = legs; }, [legs]);
    useEffect(() => { legIndexRef.current = legIndex; }, [legIndex]);
    useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);

    useEffect(() => {
        const activeStops = stops.filter(s => s.latitude !== 0 || s.longitude !== 0);
        const pts = destination ? [destination, ...activeStops] : activeStops;
        routeDestinationRef.current = pts[currentDestIndex] ?? null;
    }, [destination, stops, currentDestIndex]);

    // Arrival check on every liveLocation commit — guards against iOS timing gaps.
    useEffect(() => {
        if (!liveLocation || arrivedRef.current || !routeDestinationRef.current) return;
        const dist = haversine(
            liveLocation.latitude, liveLocation.longitude,
            routeDestinationRef.current.latitude, routeDestinationRef.current.longitude
        );
        if (dist < ARRIVAL_THRESHOLD_METERS) {
            arrivedRef.current = true;
            setArrived(true);
        }
    }, [liveLocation]);

    // Interval-based fallback: polls refs every 2 s regardless of GPS update cadence.
    useEffect(() => {
        const id = setInterval(() => {
            if (arrivedRef.current || !liveLocationRef.current || !routeDestinationRef.current) return;
            const dist = haversine(
                liveLocationRef.current.latitude, liveLocationRef.current.longitude,
                routeDestinationRef.current.latitude, routeDestinationRef.current.longitude
            );
            if (dist < ARRIVAL_THRESHOLD_METERS) {
                arrivedRef.current = true;
                setArrived(true);
            }
        }, 2000);
        return () => clearInterval(id);
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setFollowing(true);

            const recenterToLiveLocation = async () => {
                const currentLoc = liveLocationRef.current;
                if (currentLoc) {
                    focusCamera(currentLoc, headingRef.current, 500);
                }
            };

            void recenterToLiveLocation();

            return () => {
                if (headingCameraTimeoutRef.current) {
                    clearTimeout(headingCameraTimeoutRef.current);
                    headingCameraTimeoutRef.current = null;
                }
            };
        }, [])
    );

    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;
        let headingSub: Location.LocationSubscription | null = null;

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
            liveLocationRef.current = initLoc;
            setHeading(initial.coords.heading ?? 0);
            headingRef.current = initial.coords.heading ?? 0;
            setInitialLocationReady(true);
            focusCamera(initLoc, initial.coords.heading ?? 0);
            if (!routeStartOriginSetRef.current) {
                setRouteStartOrigin(initLoc);
                routeStartOriginSetRef.current = true;
            }

            headingSub = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
                const h = trueHeading >= 0 ? trueHeading : magHeading;
                setHeading(h);
                headingRef.current = h;
                if (isFollowingRef.current) {
                    scheduleHeadingCameraUpdate(h);
                }
            });

            sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500,
                    distanceInterval: 1,
                },
                ({ coords }) => {
                    const { latitude, longitude } = coords;
                    setLiveLocation({ latitude, longitude });
                    liveLocationRef.current = { latitude, longitude };
                    if (isFollowingRef.current) {
                        focusCamera({ latitude, longitude }, headingRef.current, 600);
                    }

                    const li = legIndexRef.current;
                    const si = stepIndexRef.current;
                    const step = legsRef.current[li]?.steps?.[si];
                    if (step?.end_location) {
                        const dist = haversine(
                            latitude, longitude,
                            step.end_location.lat, step.end_location.lng
                        );
                        setDistanceToNextTurn(dist);
                        if (dist < ADVANCE_THRESHOLD_METERS) {
                            const stepDurationMin = (step.duration?.value ?? 0) / 60;
                            setRemainingDuration(prev => Math.max(0, prev - stepDurationMin));
                            const nextSi = si + 1;
                            if (nextSi < legsRef.current[li].steps.length) {
                                setStepIndex(nextSi);
                                stepIndexRef.current = nextSi;
                            } else {
                                if (!arrivedRef.current) {
                                    arrivedRef.current = true;
                                    setArrived(true);
                                }
                            }
                        }
                    }

                    if (!arrivedRef.current && routeDestinationRef.current) {
                        const distToFinal = haversine(latitude, longitude, routeDestinationRef.current.latitude, routeDestinationRef.current.longitude);
                        if (distToFinal < ARRIVAL_THRESHOLD_METERS) {
                            arrivedRef.current = true;
                            setArrived(true);
                        }
                    }
                }
            );
        })();

        return () => {
            if (headingCameraTimeoutRef.current) {
                clearTimeout(headingCameraTimeoutRef.current);
                headingCameraTimeoutRef.current = null;
            }

            sub?.remove();
            headingSub?.remove();
        };
    }, []);

    const activeStops = stops.filter(s => s.latitude !== 0 || s.longitude !== 0);
    const legLabels = destination
        ? [destinationLabel, ...activeStops.map(s => s.label)]
        : activeStops.map(s => s.label);
    const routePoints = destination ? [destination, ...activeStops] : activeStops;
    const currentStep = legs[legIndex]?.steps?.[stepIndex];
    const displayStep = legs[legIndex]?.steps?.[stepIndex + 1] ?? currentStep;
    const instruction = displayStep
        ? stripHtml(displayStep.html_instructions)
        : routePoints[currentDestIndex] ? 'Follow the route' : 'No route set';
    const distanceToTurn = distanceToNextTurn !== null ? formatDistanceToTurn(distanceToNextTurn) : '';
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
            {initialLocationReady && liveLocation ? (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    mapType="standard"
                    style={StyleSheet.absoluteFillObject}
                    initialCamera={{
                        center: liveLocation,
                        heading: headingRef.current,
                        pitch: 40,
                        zoom: 17,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    rotateEnabled={true}
                    pitchEnabled={true}
                    onPanDrag={() => setFollowing(false)}
                    onMapReady={() => {
                        mapReadyRef.current = true;

                        if (pendingCameraRef.current) {
                            const pendingCamera = pendingCameraRef.current;
                            pendingCameraRef.current = null;
                            mapRef.current?.animateCamera(
                                {
                                    center: pendingCamera.center,
                                    heading: pendingCamera.heading,
                                    pitch: pendingCamera.pitch,
                                    zoom: pendingCamera.zoom,
                                },
                                pendingCamera.duration ? { duration: pendingCamera.duration } : undefined
                            );
                        } else if (liveLocationRef.current) {
                            focusCamera(liveLocationRef.current, headingRef.current);
                        }
                    }}
                >
                    <Marker coordinate={liveLocation} anchor={{ x: 0.5, y: 0.5 }} flat>
                        <Ionicons
                            name="arrow-up-circle"
                            size={28}
                            color={THEME.COLOR.mint}
                            style={{ transform: [{ rotate: `${heading}deg` }] }}
                        />
                    </Marker>
                    {routeStartOrigin && routePoints[currentDestIndex] && (
                        <MapViewDirections
                            key={`route-${currentDestIndex}-${routeStartOrigin.latitude.toFixed(4)}-${routePoints[currentDestIndex]!.latitude.toFixed(4)}`}
                            origin={routeStartOrigin}
                            destination={routePoints[currentDestIndex]!}
                            apikey={GOOGLE_API_KEY}
                            mode="DRIVING"
                            strokeColor="#0d00ff"
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
                            onError={(err) => console.error('MapViewDirections error:', err)}
                        />
                    )}
                </MapView>
            ) : (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={THEME.COLOR.mint} />
                    <Text style={styles.loadingTitle}>Finding your location...</Text>
                    <Text style={styles.loadingSubtitle}>Navigation will start as soon as GPS locks in.</Text>
                </View>
            )}

            {/* Top navigation card */}
            {!arrived && <View style={[styles.navCard, { top: navTop }]}>
                <View style={styles.maneuverBox}>
                    <Ionicons
                        name={getManeuverIcon(displayStep?.maneuver)}
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
            </View>}

            {!isFollowing && (
                <HapticPressable
                    hapticStyle="medium"
                    style={[styles.recenterButton, { bottom: cardHeight + 16 }]}
                    onPress={() => {
                        setFollowing(true);
                        const loc = liveLocationRef.current;
                        if (loc) {
                            focusCamera(loc, headingRef.current, 500);
                        }
                    }}
                >
                    <Ionicons name="navigate" size={16} color={THEME.COLOR.black} />
                    <Text style={styles.recenterText}>Re-center</Text>
                </HapticPressable>
            )}

            {remainingDuration > 0 && (
                <View
                    style={statsExpanded ? globalStyles.tripInfoCardExpanded : globalStyles.tripInfoCard}
                    onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
                >
                    <View style={styles.handle} />
                    <View style={styles.summaryRow}>
                        <HapticPressable hapticStyle="light" onPress={() => setStatsExpanded(prev => !prev)} style={{ flex: 1 }}>
                            <Text style={globalStyles.timeText}>{formatDuration(remainingDuration)}</Text>
                            <Text style={globalStyles.distanceText}>
                                {totalDistanceMi.toFixed(1)} mi · Arrives {eta}
                            </Text>
                        </HapticPressable>
                        <HapticPressable hapticStyle="medium" onPress={() => router.replace(backRoute as any)} style={styles.exitButton}>
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
                            </View>

                        </View>
                    )}
                </View>
            )}

            {arrived && (() => {
                const isLastStop = currentDestIndex === routePoints.length - 1;
                const arrivedLabel = placeTitle(legLabels[currentDestIndex] ?? 'Destination');
                const nextLabel = !isLastStop ? placeTitle(legLabels[currentDestIndex + 1] ?? 'Next stop') : '';
                return (
                    <>
                        {/* Top arrived banner */}
                        <View style={[styles.arrivedBanner, { top: navTop }]}>
                            <View style={styles.arrivedBannerIcon}>
                                <Ionicons name="checkmark" size={18} color={THEME.COLOR.black} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.arrivedBannerTitle}>Arrived!</Text>
                                <Text style={styles.arrivedBannerSub} numberOfLines={1} ellipsizeMode="tail">{arrivedLabel}</Text>
                            </View>
                        </View>

                        {/* Bottom card */}
                        <View style={styles.arrivedBottomCard}>
                            {isLastStop ? (
                                <>
                                    <Text style={styles.nextDestLabel}>TRIP COMPLETE</Text>
                                    <Text style={styles.nextDestName} numberOfLines={1} ellipsizeMode="tail">{arrivedLabel}</Text>
                                    <HapticPressable
                                        hapticStyle="medium"
                                        style={styles.startButton}
                                        onPress={() => router.replace(backRoute as any)}
                                    >
                                        <Text style={styles.startButtonText}>Done</Text>
                                    </HapticPressable>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.nextDestLabel}>NEXT DESTINATION</Text>
                                    <Text style={styles.nextDestName} numberOfLines={1} ellipsizeMode="tail">{nextLabel}</Text>

                                    <HapticPressable
                                        hapticStyle="medium"
                                        style={styles.startButton}
                                        onPress={() => {
                                            const nextIdx = currentDestIndex + 1;
                                            setCurrentDestIndex(nextIdx);
                                            currentDestIndexRef.current = nextIdx;
                                            setRouteStartOrigin(liveLocationRef.current);
                                            routeStartOriginSetRef.current = true;
                                            setArrived(false);
                                            arrivedRef.current = false;
                                            setDistanceToNextTurn(null);
                                            setLegs([]);
                                            legsRef.current = [];
                                            setLegIndex(0);
                                            legIndexRef.current = 0;
                                            setStepIndex(0);
                                            stepIndexRef.current = 0;
                                            setRemainingDuration(0);
                                            setTotalDistanceMi(0);
                                            setFollowing(true);
                                            const loc = liveLocationRef.current;
                                            if (loc) focusCamera(loc, headingRef.current, 500);
                                        }}
                                    >
                                        <Text style={styles.startButtonText}>Start</Text>
                                        <Ionicons name="chevron-forward" size={18} color={THEME.COLOR.black} />
                                    </HapticPressable>
                                </>
                            )}
                        </View>
                    </>
                );
            })()}
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
        left: 15,
        right: 15,
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
        backgroundColor: THEME.COLOR.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedActions: {
        flexDirection: 'column',
    },
    loadingState: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.COLOR.black,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    loadingTitle: {
        color: THEME.COLOR.white,
        fontSize: 20,
        fontWeight: '700',
    },
    loadingSubtitle: {
        color: THEME.COLOR.neutral400,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
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
    arrivedBanner: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: THEME.COLOR.black,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(118,224,187,0.3)',
        zIndex: 30,
        elevation: 30,
    },
    arrivedBannerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: THEME.COLOR.mint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrivedBannerTitle: {
        color: THEME.COLOR.white,
        fontSize: 16,
        fontWeight: '700',
    },
    arrivedBannerSub: {
        color: THEME.COLOR.neutral400,
        fontSize: 13,
        marginTop: 1,
    },
    arrivedBottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 56 : 36,
        gap: 10,
        zIndex: 30,
        elevation: 30,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    nextDestLabel: {
        color: THEME.COLOR.mint,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    nextDestName: {
        color: THEME.COLOR.white,
        fontSize: 26,
        fontWeight: '800',
        lineHeight: 32,
    },
    startButton: {
        marginTop: 4,
        backgroundColor: THEME.COLOR.mint,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    startButtonText: {
        color: THEME.COLOR.black,
        fontSize: 17,
        fontWeight: '700',
    },
});

export default MapNavigation;
