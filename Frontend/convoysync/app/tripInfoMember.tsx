import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '@/theme';
import { getTripPlannerDraft } from './maps/tripPlannerStore';
import { globalStyles } from '@/styles/globalStyles';

type PartyMember = {
    id: string;
    name: string;
    accent: string;
};

type ItineraryItem = {
    id: string;
    title: string;
    detail: string;
};

const TEMP_MEMBERS: PartyMember[] = [
    { id: 'm1', name: 'Vincent', accent: '#76E0BB' },
    { id: 'm2', name: 'David', accent: '#7BACCD' },
    { id: 'm3', name: 'Alex', accent: '#F59E0B' },
    { id: 'm4', name: 'Sarah', accent: '#C977DB' },
];

const createMemberInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const TripInfo = () => {
    const router = useRouter();
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
    const [hasRoute, setHasRoute] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const draft = getTripPlannerDraft();
            const activeStops = draft.stops.filter((stop) => stop.latitude !== 0 || stop.longitude !== 0);
            const nextItinerary: ItineraryItem[] = [];

            if (draft.customOrigin && draft.originLabel && draft.originLabel !== 'Your Location') {
                nextItinerary.push({
                    id: 'origin',
                    title: draft.originLabel,
                    detail: 'Start Point',
                });
            }

            const totalStops = (draft.destination ? 1 : 0) + activeStops.length;

            if (draft.destination) {
                nextItinerary.push({
                    id: 'destination',
                    title: draft.destinationLabel,
                    detail: totalStops > 1 ? 'Stop 1' : 'Destination',
                });
            }

            activeStops.forEach((stop, index) => {
                nextItinerary.push({
                    id: `stop-${index}`,
                    title: stop.label,
                    detail: `Stop ${totalStops > 1 ? index + 2 : index + 1}`,
                });
            });

            setItinerary(nextItinerary);
            setHasRoute(draft.destination !== null || activeStops.length > 0);
        }, [])
    );

    const members = useMemo(() => TEMP_MEMBERS, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <HapticPressable hapticStyle="light" style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                    <Ionicons name="chevron-back" size={20} color={THEME.COLOR.mint} />
                </HapticPressable>

                <View style={styles.hero}>
                    <Text style={styles.tripTitle}>Weekend Convoy</Text>
                    <Text style={styles.tripMeta}>TEMP TITLE · MAY 12, 2026 · 09:30 AM</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="people-outline" size={15} color={THEME.COLOR.sky} />
                        <Text style={styles.sectionTitle}>Party Members</Text>
                    </View>
                    <Text style={styles.sectionMeta}>{members.length} total</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.memberRow}
                >
                    {members.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={[styles.memberAvatar, { borderColor: member.accent }]}>
                                <Text style={styles.memberAvatarText}>{createMemberInitials(member.name)}</Text>
                            </View>
                            <Text style={styles.memberName}>{member.name}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={[styles.sectionHeader, { marginTop: THEME.SPACING.lg }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="navigate-circle-outline" size={15} color={THEME.COLOR.purple} />
                        <Text style={styles.sectionTitle}>Itinerary</Text>
                    </View>
                    <Text style={styles.sectionMeta}>{itinerary.length > 0 ? `${itinerary.length} stops` : 'No stops yet'}</Text>
                </View>

                {itinerary.length > 0 ? (
                    <View style={styles.timeline}>
                        {itinerary.map((item, index) => {
                            const isLast = index === itinerary.length - 1;
                            return (
                                <View key={item.id} style={styles.timelineRow}>
                                    <View style={styles.timelineRail}>
                                        <View style={styles.timelineDotOuter}>
                                            <View style={styles.timelineDotInner} />
                                        </View>
                                        {!isLast && <View style={styles.timelineLine} />}
                                    </View>
                                    <View style={styles.timelineCard}>
                                        <Text style={styles.timelineTitle}>{item.title}</Text>
                                        <Text style={styles.timelineDetail}>{item.detail}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No itinerary yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add a destination or stops in Planner and they will show up here.
                        </Text>
                    </View>
                )}

                <HapticPressable
                    hapticStyle="light"
                    style={globalStyles.AddButton}
                    onPress={() => router.push('/maps/plannerSuggest')}
                >
                    <Text style={globalStyles.AddButtonText}><Ionicons name="add" size={15} color={THEME.COLOR.neutral500} /> Suggest Locations</Text>
                </HapticPressable>

                <HapticPressable
                    hapticStyle="medium"
                    style={[styles.startButton, !hasRoute && styles.startButtonDisabled]}
                    onPress={() => { if (hasRoute) router.replace('/maps/mapNavigation'); }}
                >
                    <Ionicons name="navigate" size={18} color={hasRoute ? THEME.COLOR.black : THEME.COLOR.neutral500} />
                    <Text style={[styles.startButtonText, !hasRoute && styles.startButtonTextDisabled]}>
                        Start Trip
                    </Text>
                </HapticPressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    container: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    content: {
        paddingHorizontal: THEME.SPACING.lg,
        paddingBottom: THEME.SPACING.huge,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: THEME.SPACING.sm,
        alignSelf: 'flex-start',
    },
    backText: {
        color: THEME.COLOR.mint,
        fontSize: THEME.FONT_SIZE.md,
        fontWeight: '600',
    },
    hero: {
        marginTop: THEME.SPACING.md,
        marginBottom: THEME.SPACING.lg,
        gap: 4,
    },
    tripTitle: {
        color: THEME.COLOR.white,
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    tripMeta: {
        color: THEME.COLOR.mint,
        fontSize: THEME.FONT_SIZE.sm,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        marginBottom: THEME.SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        color: THEME.COLOR.white,
        fontSize: THEME.FONT_SIZE.md,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionMeta: {
        color: THEME.COLOR.neutral500,
        fontSize: THEME.FONT_SIZE.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionAction: {
        backgroundColor: THEME.COLOR.mint,
        borderRadius: THEME.BORDER_RADIUS.lg,
        paddingVertical: THEME.SPACING.sm,
        paddingHorizontal: THEME.SPACING.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: THEME.SPACING.sm,
        marginBottom: THEME.SPACING.lg,
    },
    sectionActionText: {
        color: THEME.COLOR.black,
        fontSize: THEME.FONT_SIZE.sm,
        fontWeight: '800',
    },
    sectionActionOutline: {
        backgroundColor: THEME.COLOR.surface,
        borderWidth: 1,
        borderColor: THEME.COLOR.border,
        borderRadius: THEME.BORDER_RADIUS.lg,
        paddingVertical: THEME.SPACING.sm,
        paddingHorizontal: THEME.SPACING.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: THEME.SPACING.sm,
    },
    sectionActionOutlineText: {
        color: THEME.COLOR.mint,
        fontSize: THEME.FONT_SIZE.sm,
        fontWeight: '700',
    },
    memberRow: {
        gap: THEME.SPACING.sm,
        paddingBottom: THEME.SPACING.sm,
    },
    memberCard: {
        width: 56,
        alignItems: 'center',
        gap: 4,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#222126',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    memberAvatarText: {
        color: THEME.COLOR.white,
        fontSize: THEME.FONT_SIZE.sm,
        fontWeight: '800',
    },
    memberName: {
        color: THEME.COLOR.neutral400,
        fontSize: THEME.FONT_SIZE.xs,
        fontWeight: '600',
    },
    timeline: {
        gap: THEME.SPACING.sm,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: THEME.SPACING.sm,
        minHeight: 60,
    },
    timelineRail: {
        width: 20,
        alignItems: 'center',
    },
    timelineDotOuter: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: THEME.COLOR.mint,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.COLOR.black,
        marginTop: 16,
    },
    timelineDotInner: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: THEME.COLOR.mint,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 4,
    },
    timelineCard: {
        flex: 1,
        backgroundColor: '#232225',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: THEME.SPACING.md,
        paddingVertical: THEME.SPACING.sm,
        justifyContent: 'center',
        minHeight: 52,
    },
    timelineTitle: {
        color: THEME.COLOR.white,
        fontSize: THEME.FONT_SIZE.md,
        fontWeight: '800',
        marginBottom: 2,
    },
    timelineDetail: {
        color: THEME.COLOR.neutral500,
        fontSize: THEME.FONT_SIZE.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    emptyCard: {
        backgroundColor: THEME.COLOR.surface,
        borderRadius: THEME.BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: THEME.COLOR.border,
        padding: THEME.SPACING.md,
        gap: 4,
    },
    emptyTitle: {
        color: THEME.COLOR.white,
        fontSize: THEME.FONT_SIZE.md,
        fontWeight: '800',
    },
    emptySubtitle: {
        color: THEME.COLOR.neutral400,
        fontSize: THEME.FONT_SIZE.sm,
        lineHeight: 18,
    },
    startButton: {
        backgroundColor: THEME.COLOR.mint,
        borderRadius: THEME.BORDER_RADIUS.xl,
        paddingVertical: THEME.SPACING.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: THEME.SPACING.lg,
    },
    startButtonDisabled: {
        backgroundColor: THEME.COLOR.surface,
        borderWidth: 1,
        borderColor: THEME.COLOR.border,
    },
    startButtonText: {
        color: THEME.COLOR.black,
        fontSize: THEME.FONT_SIZE.md,
        fontWeight: '800',
    },
    startButtonTextDisabled: {
        color: THEME.COLOR.neutral500,
    },
});

export default TripInfo;
