import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { consumeSelectedMapPlace } from './mapSearchSelectionStore';
import {
    type RouteSelectionTarget,
    type RouteStop,
    getTripPlannerDraft,
    setTripPlannerDraft,
} from './tripPlannerStore';
import {
    type Suggestion,
    getSuggestions,
    deleteSuggestion,
    subscribeSuggestions,
    CURRENT_USER,
} from './suggestionStore';
import { useLocalSearchParams } from 'expo-router';

// Replace with real role from auth/trip context once backend is wired up
const IS_PARTY_LEADER = false;

const STOP_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];
const MAX_STOPS = 5;

const getStopColor = (index: number) => STOP_COLORS[index % STOP_COLORS.length];

const Planner = () => {
    const router = useRouter();
    const [originLabel, setOriginLabel] = useState('Your Location');
    const [customOrigin, setCustomOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationLabel, setDestinationLabel] = useState('Choose destination');
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [selectionTarget, setSelectionTarget] = useState<RouteSelectionTarget | null>(null);
    const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>(getSuggestions());

    // my contributions: //
    // need an array for storing stops (stop order + eta?)
    // need to store location data in a stop

    const { tripId } = useLocalSearchParams();

    type Location = {
        name: string,
        address: string,
        lat: number,
        long: number,
    }

    type Stop = {
        order: number,
        location: Location,
        eta: string,
    }

    const [myStops, setMyStops] = useState<Stop[]>([]);

    // NOTE: DOES NOT PROTECT AGAINST DUPLICATE LOCATIONS CURRENTLY
    const onSubmit = async () => {
        try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_ADDRESS}/trips/${tripId}/itinerary/stops`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                startLocation: customOrigin ? {
                    name: originLabel,
                    address: originLabel,
                    lat: customOrigin.latitude,
                    long: customOrigin.longitude,
                } : null,
                    stops: myStops
                }),
        });

        const text = await response.json();

            if (!response.ok) {
                console.log('status:', response.status);
                console.log('body:', text);
                return;
            }

            // router.push({
            //     pathname: '/tripInfo',
            //     params: {
            //         tripId: data.trip.id,
            //     },
            // });
            console.log(myStops);

        } catch (error) {
            console.error('Network error:', error);
        }

    }

    // end my contributions // 

    useEffect(() => {
        return subscribeSuggestions(() => setSuggestions(getSuggestions()));
    }, []);

    useEffect(() => {
        const draft = getTripPlannerDraft();
        setOriginLabel(draft.originLabel);
        setCustomOrigin(draft.customOrigin);
        setDestinationLabel(draft.destinationLabel);
        setDestination(draft.destination);
        // setStops(draft.stops);
    }, []);

    useEffect(() => {
        setTripPlannerDraft({
            originLabel,
            customOrigin,
            destinationLabel,
            destination,
            stops,
        });
    }, [customOrigin, destination, destinationLabel, originLabel, stops]);

    useEffect(() => {
        if (!tripId) return;

        const loadItineraryStops = async () => {
            try {
                const response = await fetch(
                    `${process.env.EXPO_PUBLIC_ADDRESS}/trips/${tripId}/itinerary/stops`
                );

                const data = await response.json();

                if (!response.ok) {
                    console.log("status:", response.status);
                    console.log("body:", data);
                    return;
                }

                if (data.startLocation) {
                    setCustomOrigin({
                        latitude: data.startLocation.latitude,
                        longitude: data.startLocation.longitude,
                    });

                    setOriginLabel(data.startLocation.name);
                }

                const loadedMyStops: Stop[] = data.stops.map((stop: any) => ({
                    order: stop.stopOrder,
                    eta: stop.eta,
                    location: {
                        name: stop.location.name,
                        address: stop.location.address,
                        lat: stop.location.latitude,
                        long: stop.location.longitude,
                    },
                }));

                const loadedRouteStops: RouteStop[] = data.stops.map((stop: any) => ({
                    latitude: stop.location.latitude,
                    longitude: stop.location.longitude,
                    label: stop.location.name,
                }));

                setMyStops(loadedMyStops);

                const [loadedDestination, ...loadedExtraStops] = loadedRouteStops;

                if (loadedDestination) {
                    setDestination({
                        latitude: loadedDestination.latitude,
                        longitude: loadedDestination.longitude,
                    });
                    setDestinationLabel(loadedDestination.label);
                }

                setStops(loadedExtraStops);
            } catch (error) {
                console.error("Load itinerary stops error:", error);
            }
        };

        loadItineraryStops();
    }, [tripId]);

    useFocusEffect(
  useCallback(() => {
    const selectedPlace = consumeSelectedMapPlace();

    if (!selectedPlace || !selectionTarget) {
      return;
    }

    const nextLabel = selectedPlace.description || "";

    const newBackendStop = {
      location: {
        name: selectedPlace.description ?? "Unknown location",
        address: selectedPlace.description ?? "Unknown address",
        lat: selectedPlace.latitude,
        long: selectedPlace.longitude,
      },
      eta: new Date().toISOString(),
    };

    if (selectionTarget.kind === "origin") {
      setCustomOrigin({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      });

      setOriginLabel(nextLabel || "Your Location");
    }

    if (selectionTarget.kind === "destination") {
      setDestination({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      });

      setDestinationLabel(nextLabel || "Destination");

      setMyStops((prev) => {
        const withoutOldDestination = prev.filter((stop) => stop.order !== 1);

        return [
          {
            order: 1,
            ...newBackendStop,
          },
          ...withoutOldDestination.map((stop, index) => ({
            ...stop,
            order: index + 2,
          })),
        ];
      });
    }

    if (selectionTarget.kind === "stop") {
      setStops((currentStops) => {
        const nextStop = {
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          label: nextLabel || "Stop",
        };

        if (selectionTarget.stopIndex >= currentStops.length) {
          return [...currentStops, nextStop];
        }

        const updatedStops = [...currentStops];
        updatedStops[selectionTarget.stopIndex] = nextStop;
        return updatedStops;
      });

      setMyStops((prev) => {
        const next = [...prev];

        const backendIndex = selectionTarget.stopIndex + 1;

        next[backendIndex] = {
          order: backendIndex + 1,
          ...newBackendStop,
        };

        return next
          .filter(Boolean)
          .map((stop, index) => ({
            ...stop,
            order: index + 1,
          }));
      });
    }

    setSelectionTarget(null);
  }, [selectionTarget])
);

    const openSearchScreen = useCallback((target: RouteSelectionTarget) => {
        setSelectionTarget(target);

        const paramsObj: { placeholder: string; currentText?: string } = {
            placeholder: target.kind === 'origin'
                ? 'Your Location'
                : target.kind === 'destination'
                    ? 'Choose destination'
                    : 'Add stop',
        };

        if (target.kind === 'origin' && originLabel !== 'Your Location') {
            paramsObj.currentText = originLabel;
        }

        if (target.kind === 'destination' && destinationLabel !== 'Choose destination') {
            paramsObj.currentText = destinationLabel;
        }

        if (target.kind === 'stop' && stops[target.stopIndex]?.label) {
            paramsObj.currentText = stops[target.stopIndex].label;
        }

        router.push({
            pathname: '/maps/mapSearchScreen',
            params: paramsObj,
        });
    }, [destinationLabel, originLabel, router, stops]);

    const addStop = useCallback(() => {
        if (!destination || (destination ? 1 : 0) + stops.length >= MAX_STOPS) {
            return;
        }

        openSearchScreen({ kind: 'stop', stopIndex: stops.length });
    }, [destination, openSearchScreen, stops.length]);

    const deleteStop = useCallback((stopIndex: number) => {
        setStops((currentStops) =>
            currentStops.filter((_, index) => index !== stopIndex)
        );

        setMyStops((currentMyStops) =>
            currentMyStops
                .filter((stop) => stop.order !== stopIndex + 2)
                .map((stop, index) => ({
                    ...stop,
                    order: index + 1,
                }))
        );

        setSelectionTarget((currentTarget) =>
            currentTarget?.kind === 'stop' && currentTarget.stopIndex === stopIndex
                ? null
                : currentTarget
        );
    }, []);

    const deleteDestination = useCallback(() => {
        setStops((currentStops) => {
            const [nextDestination, ...remainingStops] = currentStops;

            if (nextDestination) {
                setDestination({
                    latitude: nextDestination.latitude,
                    longitude: nextDestination.longitude,
                });
                setDestinationLabel(nextDestination.label);
            } else {
                setDestination(null);
                setDestinationLabel('Choose destination');
            }

            return remainingStops;
        });

        setMyStops((currentMyStops) =>
            currentMyStops
                .slice(1)
                .map((stop, index) => ({
                    ...stop,
                    order: index + 1,
                }))
        );
    }, []);

    const hasRoute = Boolean(destination);
    const activeStops = stops.filter((stop) => stop.latitude !== 0 || stop.longitude !== 0);
    const addStopDisabled = !destination || (destination ? 1 : 0) + stops.length >= MAX_STOPS;

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safeArea}>
                <View style={mapStyles.plannerHeader}>
                    <BackHeader
                        title="Planner"
                        icon="chevron-back"
                        color={THEME.COLOR.mint}
                    />
                </View>

                <View style={styles.panel}>
                    <ScrollView
                        style={mapStyles.routingScrollArea}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputRow}>
                            <View style={styles.leadingSpacer} />
                            <HapticPressable
                                hapticStyle="light"
                                onPress={() => openSearchScreen({ kind: 'origin' })}
                                style={styles.inputPressable}
                            >
                                <View style={mapStyles.routingInputContainer}>
                                    <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, styles.inputText]}>
                                        {originLabel}
                                    </Text>
                                </View>
                            </HapticPressable>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={styles.leadingSpacer}>
                                {activeStops.length > 0 ? (
                                    <HapticPressable hapticStyle="light" onPress={deleteDestination}>
                                        <View style={mapStyles.stopDeleteButton}>
                                            <Ionicons name="close" size={20} color={THEME.COLOR.neutral500} />
                                        </View>
                                    </HapticPressable>
                                ) : null}
                            </View>

                            <HapticPressable
                                hapticStyle="light"
                                onPress={() => openSearchScreen({ kind: 'destination' })}
                                style={styles.inputPressable}
                            >
                                <View style={mapStyles.routingInputContainer}>
                                    <View style={styles.destinationRow}>
                                        {activeStops.length > 0 && (
                                            <View style={styles.destinationDot} />
                                        )}
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={[
                                                mapStyles.textInput2,
                                                styles.inputText,
                                                !destination && styles.placeholderText,
                                            ]}
                                        >
                                            {destinationLabel}
                                        </Text>
                                    </View>
                                </View>
                            </HapticPressable>
                        </View>

                        {stops.map((stop, index) => (
                            <View key={`${stop.label}-${index}`} style={styles.inputRow}>
                                <View style={styles.leadingSpacer}>
                                    <HapticPressable hapticStyle="light" onPress={() => deleteStop(index)}>
                                        <View style={mapStyles.stopDeleteButton}>
                                            <Ionicons name="close" size={20} color={THEME.COLOR.neutral500} />
                                        </View>
                                    </HapticPressable>
                                </View>

                                <HapticPressable
                                    hapticStyle="light"
                                    onPress={() => openSearchScreen({ kind: 'stop', stopIndex: index })}
                                    style={styles.inputPressable}
                                >
                                    <View style={mapStyles.routingInputContainer}>
                                        <View style={styles.destinationRow}>
                                            <View style={[styles.stopDot, { backgroundColor: getStopColor(index) }]} />
                                            <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, styles.inputText]}>
                                                {stop.label}
                                            </Text>
                                        </View>
                                    </View>
                                </HapticPressable>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.actionRow}>
                        <HapticPressable
                            hapticStyle="light"
                            onPress={addStop}
                            disabled={addStopDisabled}
                            style={styles.addStopPressable}
                        >
                            <View style={[mapStyles.addStopButton, { marginHorizontal: 0 }, addStopDisabled && styles.addStopButtonDisabled]}>
                                <Text style={[mapStyles.addStopButtonText, addStopDisabled && styles.addStopButtonTextDisabled]}>
                                    {(destination ? 1 : 0) + stops.length >= MAX_STOPS ? 'Max 5 stops reached' : '+ Add stop'}
                                </Text>
                            </View>
                        </HapticPressable>

                        <HapticPressable
                            style={[styles.mapButton, hasRoute && styles.mapButtonActive]}
                            hapticStyle="medium"
                            disabled={!hasRoute}
                            onPress={() => router.push('/maps/mapDirections')}
                        >
                            <Ionicons name="map" size={22} color={hasRoute ? THEME.COLOR.mint : THEME.COLOR.neutral500} />
                        </HapticPressable>
                    </View>
                </View>

                <View style={styles.saveTripRow}>
                    <HapticPressable
                        hapticStyle="medium"
                        disabled={!hasRoute}
                        onPress={onSubmit}
                        style={styles.saveTripPressable}
                    >
                        <View style={[styles.saveTripButton, !hasRoute && styles.saveTripButtonDisabled]}>
                            <Text style={[styles.saveTripButtonText, !hasRoute && styles.saveTripButtonTextDisabled]}>
                                Save Trip
                            </Text>
                        </View>
                    </HapticPressable>
                </View>

                <View style={mapStyles.suggestionsContainer}>
                    <HapticPressable
                        hapticStyle="light"
                        onPress={() => setSuggestionsExpanded(prev => !prev)}
                    >
                        <View style={mapStyles.suggestionsHeader}>
                            <Text style={mapStyles.suggestionsHeaderText}>Suggestions</Text>
                            <Ionicons
                                name={suggestionsExpanded ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={THEME.COLOR.mint}
                            />
                        </View>
                    </HapticPressable>

                    {suggestionsExpanded && (
                        <View style={mapStyles.suggestionsBody}>
                            {suggestions.length === 0 ? (
                                <Text style={mapStyles.suggestionsEmptyText}>No suggestions yet</Text>
                            ) : (
                                suggestions.map((s) => (
                                    <View key={s.id} style={styles.suggestionItem}>
                                        <Ionicons
                                            name="location"
                                            size={18}
                                            color={s.userId === CURRENT_USER.id ? THEME.COLOR.mint : '#3b82f6'}
                                        />
                                        <View style={styles.suggestionInfo}>
                                            <Text style={styles.suggestionLabel} numberOfLines={1}>{s.label}</Text>
                                            <Text style={styles.suggestionUser}>
                                                {s.userId === CURRENT_USER.id ? 'You' : s.userName}
                                            </Text>
                                        </View>
                                        {(s.userId === CURRENT_USER.id || IS_PARTY_LEADER) && (
                                            <HapticPressable
                                                hapticStyle="light"
                                                onPress={() => deleteSuggestion(s.id, CURRENT_USER.id, IS_PARTY_LEADER)}
                                            >
                                                <Ionicons name="trash-outline" size={18} color={THEME.COLOR.neutral500} />
                                            </HapticPressable>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    safeArea: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    panel: {
        flex: 1,
        paddingTop: 8,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 10,
    },
    leadingSpacer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputPressable: {
        flex: 1,
    },
    inputText: {
        color: THEME.COLOR.white,
        flex: 1,
    },
    placeholderText: {
        color: THEME.COLOR.neutral400,
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    destinationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        marginRight: 10,
    },
    stopDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
        gap: 10,
    },
    addStopPressable: {
        flex: 1,
    },
    mapButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: THEME.COLOR.neutral500,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapButtonActive: {
        borderColor: THEME.COLOR.mint,
    },
    addStopButtonDisabled: {
        backgroundColor: 'rgba(100,100,100,0.1)',
        borderColor: THEME.COLOR.neutral500,
    },
    addStopButtonTextDisabled: {
        color: THEME.COLOR.neutral500,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(118, 224, 187, 0.1)',
    },
    suggestionInfo: {
        flex: 1,
    },
    suggestionLabel: {
        color: THEME.COLOR.white,
        fontSize: 13,
        fontWeight: '500',
    },
    suggestionUser: {
        color: THEME.COLOR.neutral500,
        fontSize: 11,
        marginTop: 2,
    },
    suggestLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    suggestLocationText: {
        color: THEME.COLOR.mint,
        fontSize: 14,
        fontWeight: '600',
    },
    suggestLocationTextDisabled: {
        color: THEME.COLOR.neutral500,
    },
    saveTripRow: {
        marginHorizontal: 15,
        marginBottom: 10,
    },
    saveTripPressable: {},
    saveTripButton: {
        backgroundColor: THEME.COLOR.mint,
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveTripButtonDisabled: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: THEME.COLOR.neutral500,
    },
    saveTripButtonText: {
        color: THEME.COLOR.black,
        fontSize: 16,
        fontWeight: '700',
    },
    saveTripButtonTextDisabled: {
        color: THEME.COLOR.neutral500,
    },
});

export default Planner;
