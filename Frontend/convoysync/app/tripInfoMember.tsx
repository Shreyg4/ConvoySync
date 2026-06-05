import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '@/theme';
import { getTripPlannerDraft } from './maps/tripPlannerStore';
import { globalStyles } from '@/styles/globalStyles';
import { useLocalSearchParams } from 'expo-router';
import { apiUrl } from '@/lib/api';
import { authHeader } from '@/lib/oauth';

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

type TripMember = {
  userId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type TripData = {
  id: number;
  name: string;
  estStart: string;
  inviteCode: string;
  members: TripMember[];
  startLocation?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  itinerary?: {
    stops: {
      id: number;
      stopOrder: number;
      eta: string;
      location: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
      };
    }[];
  } | null;
};

const TripInfo = () => {
    const router = useRouter();
    const { tripId } = useLocalSearchParams();
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
    const [hasRoute, setHasRoute] = useState(false);
    const [trip, setTrip] = useState<TripData | null>(null);

    const loadTrip = useCallback(async () => {
        if (!tripId) return;
        try {
            const headers = await authHeader();
            const response = await fetch(apiUrl(`/trips/${tripId}`), { headers });
            const data = await response.json();
            if (!response.ok) {
                console.log("status:", response.status);
                console.log("body:", data);
                return;
            }
            setTrip(data);
            const nextItinerary: ItineraryItem[] = [];
            if (data.startLocation) {
                nextItinerary.push({
                    id: "origin",
                    title: data.startLocation.name,
                    detail: "Start Point",
                });
            }
            const stops = data.itinerary?.stops ?? [];
            stops.forEach((stop: any, index: number) => {
                nextItinerary.push({
                    id: String(stop.id),
                    title: stop.location.name,
                    detail:
                        index === stops.length - 1
                            ? "Destination"
                            : `Stop ${index + 1}`,
                });
            });
            setItinerary(nextItinerary);
            setHasRoute(stops.length > 0);
        } catch (error) {
            console.error("Load trip error:", error);
        }
    }, [tripId]);

    useFocusEffect(useCallback(() => { loadTrip(); }, [loadTrip]));

    //TODO: implement hook (useEffect) to getch trip from tripId
    //      display title, members, etc.

    const members = trip?.members ?? [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <HapticPressable hapticStyle="light" style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        <Ionicons name="chevron-back" size={20} color={THEME.COLOR.mint} />
                    </HapticPressable>
                    <HapticPressable hapticStyle="light" style={styles.reloadButton} onPress={loadTrip}>
                        <Ionicons name="refresh" size={20} color={THEME.COLOR.mint} />
                    </HapticPressable>
                </View>

                <View style={styles.hero}>
                    <Text style={styles.tripTitle}>{trip?.name ?? "Loading trip..."}</Text>
                        <Text style={styles.tripMeta}>
                            {trip
                                ? `${new Date(trip.estStart).toLocaleDateString()} · ${new Date(
                                    trip.estStart
                                ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                                : ""}
                        </Text>
                </View>

                <View style={styles.inviteCodeCard}>
                    <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                    <Text style={styles.inviteCodeValue}>
                        {trip?.inviteCode ?? "Loading..."}
                    </Text>
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
                        <View key={member.userId} style={styles.memberCard}>
                            <View style={[styles.memberAvatar, { borderColor: THEME.COLOR.mint  }]}>
                                <Text style={styles.memberAvatarText}>{createMemberInitials(member.user.name)}</Text>
                            </View>
                            <Text style={styles.memberName}>{member.user.name}</Text>
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
                    style={[globalStyles.TripButton, { alignItems: 'center'}, !hasRoute && styles.startButtonDisabled]}
                    disabled={!hasRoute}
                    onPress={() => router.push({ pathname: '/maps/mapDirections', params: { tripId, returnTo: 'tripInfoMember' } })}
                >
                    <Text style={[globalStyles.TripButtoneText, { color: THEME.COLOR.mint }]}><Ionicons name="map-outline" size={15} color={THEME.COLOR.mint} /> Directions</Text>
                </HapticPressable>

                <HapticPressable
                    hapticStyle="medium"
                    style={[styles.startButton, !hasRoute && styles.startButtonDisabled]}
                    onPress={() => { if (hasRoute) router.replace({ pathname: '/maps/mapNavigation', params: { tripId, returnTo: 'tripInfoMember' } }); }}
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: THEME.SPACING.sm,
        alignSelf: 'flex-start',
    },
    reloadButton: {
        padding: THEME.SPACING.sm,
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
    inviteCodeCard: {
        backgroundColor: '#232225',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingVertical: THEME.SPACING.md,
        paddingHorizontal: THEME.SPACING.lg,
        marginBottom: THEME.SPACING.lg,
        alignItems: 'center',
    },
    inviteCodeLabel: {
        color: THEME.COLOR.neutral500,
        fontSize: THEME.FONT_SIZE.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    inviteCodeValue: {
        color: THEME.COLOR.mint,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 3,
    },
});

export default TripInfo;
