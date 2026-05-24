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
import { type RouteStop, getTripPlannerDraft } from './tripPlannerStore';
import {
    type Suggestion,
    getSuggestions,
    deleteSuggestion,
    getUserSuggestionCount,
    subscribeSuggestions,
    MAX_USER_SUGGESTIONS,
    CURRENT_USER,
} from './suggestionStore';

const STOP_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];
const getStopColor = (index: number) => STOP_COLORS[index % STOP_COLORS.length];

const PlannerSuggest = () => {
    const router = useRouter();
    const [originLabel, setOriginLabel] = useState('Your Location');
    const [destinationLabel, setDestinationLabel] = useState('No destination set');
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>(getSuggestions());

    const refreshDraft = useCallback(() => {
        const draft = getTripPlannerDraft();
        setOriginLabel(draft.originLabel);
        setDestinationLabel(draft.destinationLabel);
        setDestination(draft.destination);
        setStops(draft.stops);
    }, []);

    useEffect(() => {
        refreshDraft();
        return subscribeSuggestions(() => setSuggestions(getSuggestions()));
    }, [refreshDraft]);

    useFocusEffect(
        useCallback(() => {
            refreshDraft();
            setSuggestions(getSuggestions());
        }, [refreshDraft])
    );

    const hasRoute = Boolean(destination);
    const activeStops = stops.filter(s => s.latitude !== 0 || s.longitude !== 0);
    const atMax = getUserSuggestionCount(CURRENT_USER.id) >= MAX_USER_SUGGESTIONS;

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.safeArea}>
                <View style={mapStyles.plannerHeader}>
                    <BackHeader
                        title="Trip View"
                        icon="chevron-back"
                        color={THEME.COLOR.mint}
                    />
                </View>

                <View style={styles.panel}>
                    <ScrollView
                        style={mapStyles.routingScrollArea}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Origin — read only */}
                        <View style={styles.inputRow}>
                            <View style={[mapStyles.routingInputContainer, styles.inputFill]}>
                                <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, styles.inputText]}>
                                    {originLabel}
                                </Text>
                            </View>
                        </View>

                        {/* Destination — read only */}
                        <View style={styles.inputRow}>
                            <View style={[mapStyles.routingInputContainer, styles.inputFill]}>
                                <View style={styles.rowInner}>
                                    {activeStops.length > 0 && <View style={styles.destinationDot} />}
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
                        </View>

                        {/* Stops — read only */}
                        {stops.map((stop, index) => (
                            <View key={`${stop.label}-${index}`} style={styles.inputRow}>
                                <View style={[mapStyles.routingInputContainer, styles.inputFill]}>
                                    <View style={styles.rowInner}>
                                        <View style={[styles.stopDot, { backgroundColor: getStopColor(index) }]} />
                                        <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, styles.inputText]}>
                                            {stop.label}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {!hasRoute && (
                            <Text style={styles.emptyNote}>No trip planned yet. Check back later.</Text>
                        )}
                    </ScrollView>

                    <View style={styles.actionRow}>
                        <HapticPressable
                            hapticStyle="light"
                            onPress={() => router.push('/maps/mapSuggest')}
                            disabled={atMax}
                            style={styles.suggestPressable}
                        >
                            <View style={[mapStyles.addStopButton, { marginHorizontal: 0 }, atMax && styles.suggestDisabled]}>
                                <Text style={[mapStyles.addStopButtonText, atMax && styles.suggestDisabledText]}>
                                    {atMax ? 'Max suggestions reached' : '+ Suggest a stop'}
                                </Text>
                            </View>
                        </HapticPressable>

                        <HapticPressable
                            style={[styles.mapButton, hasRoute && styles.mapButtonActive]}
                            hapticStyle="medium"
                            disabled={!hasRoute}
                            onPress={() => router.push({ pathname: '/maps/mapDirections', params: { from: 'plannerSuggest' } })}
                        >
                            <Ionicons name="map" size={22} color={hasRoute ? THEME.COLOR.mint : THEME.COLOR.neutral500} />
                        </HapticPressable>
                    </View>
                </View>

                <View style={mapStyles.suggestionsContainer}>
                    <HapticPressable hapticStyle="light" onPress={() => setSuggestionsExpanded(prev => !prev)}>
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
                                        {s.userId === CURRENT_USER.id && (
                                            <HapticPressable
                                                hapticStyle="light"
                                                onPress={() => deleteSuggestion(s.id, CURRENT_USER.id, false)}
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
    inputFill: {
        flex: 1,
    },
    inputText: {
        color: THEME.COLOR.white,
        flex: 1,
    },
    placeholderText: {
        color: THEME.COLOR.neutral400,
    },
    rowInner: {
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
    emptyNote: {
        color: THEME.COLOR.neutral500,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 24,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
        gap: 10,
    },
    suggestPressable: {
        flex: 1,
    },
    suggestDisabled: {
        backgroundColor: 'rgba(100,100,100,0.1)',
        borderColor: THEME.COLOR.neutral500,
    },
    suggestDisabledText: {
        color: THEME.COLOR.neutral500,
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
});

export default PlannerSuggest;
