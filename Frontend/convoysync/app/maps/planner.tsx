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
    resetTripPlannerDraft,
    setTripPlannerDraft,
} from './tripPlannerStore';

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

    useEffect(() => {
        const draft = getTripPlannerDraft();
        setOriginLabel(draft.originLabel);
        setCustomOrigin(draft.customOrigin);
        setDestinationLabel(draft.destinationLabel);
        setDestination(draft.destination);
        setStops(draft.stops);
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

    useFocusEffect(
        useCallback(() => {
            const selectedPlace = consumeSelectedMapPlace();
            if (!selectedPlace || !selectionTarget) {
                return;
            }

            const nextLabel = selectedPlace.description || '';

            if (selectionTarget.kind === 'origin') {
                setCustomOrigin({
                    latitude: selectedPlace.latitude,
                    longitude: selectedPlace.longitude,
                });
                setOriginLabel(nextLabel || 'Your Location');
            }

            if (selectionTarget.kind === 'destination') {
                setDestination({
                    latitude: selectedPlace.latitude,
                    longitude: selectedPlace.longitude,
                });
                setDestinationLabel(nextLabel || 'Destination');
            }

            if (selectionTarget.kind === 'stop') {
                setStops((currentStops) => {
                    const nextStop = {
                        latitude: selectedPlace.latitude,
                        longitude: selectedPlace.longitude,
                        label: nextLabel || 'Stop',
                    };

                    if (selectionTarget.stopIndex >= currentStops.length) {
                        return [...currentStops, nextStop];
                    }

                    const updatedStops = [...currentStops];
                    updatedStops[selectionTarget.stopIndex] = nextStop;
                    return updatedStops;
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
        setStops((currentStops) => currentStops.filter((_, index) => index !== stopIndex));
        setSelectionTarget((currentTarget) =>
            currentTarget?.kind === 'stop' && currentTarget.stopIndex === stopIndex ? null : currentTarget
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
                return remainingStops;
            }

            setDestination(null);
            setDestinationLabel('Choose destination');
            return currentStops;
        });
        setSelectionTarget((currentTarget) =>
            currentTarget?.kind === 'destination' ? null : currentTarget
        );
    }, []);

    const clearRoute = useCallback(() => {
        resetTripPlannerDraft();
        setOriginLabel('Your Location');
        setCustomOrigin(null);
        setDestinationLabel('Choose destination');
        setDestination(null);
        setStops([]);
        setSelectionTarget(null);
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
                        icon={hasRoute ? 'close' : 'chevron-back'}
                        color={THEME.COLOR.mint}
                        onPress={hasRoute ? clearRoute : undefined}
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
                            <Text style={mapStyles.suggestionsEmptyText}>No suggestions yet</Text>
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
});

export default Planner;
