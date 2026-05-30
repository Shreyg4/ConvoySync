import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { THEME } from '../../theme';

type MemberStatus = 'arrived' | 'en-route' | 'not-started';

type ConvoyMember = {
    name: string;
    initials: string;
    avatarColor: string;
    status: MemberStatus;
    etaMinutes: number | null;
    progress: number | null;
    isYou: boolean;
};

const STATUS = {
    'arrived':     { label: 'Arrived',     color: THEME.COLOR.success },
    'en-route':    { label: 'En Route',    color: THEME.COLOR.warning },
    'not-started': { label: 'Not Started', color: THEME.COLOR.error   },
};

const SAMPLE: ConvoyMember = {
    name: 'You',
    initials: 'Y',
    avatarColor: '#6366f1',
    status: 'arrived',
    etaMinutes: null,
    progress: null,
    isYou: true,
};

const MemberCard = ({ member }: { member: ConvoyMember }) => {
    const cfg = STATUS[member.status];
    const etaText = member.etaMinutes !== null ? `${member.etaMinutes} mins away` : '—';

    return (
        <View style={[styles.card, { borderLeftColor: cfg.color }]}>
            <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
                    <Text style={styles.avatarInitials}>{member.initials}</Text>
                </View>

                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                        {member.name}{member.isYou ? ' (You)' : ''}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: `${cfg.color}22` }]}>
                        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={styles.etaBlock}>
                    <View style={styles.etaLabelRow}>
                        <Ionicons name="time-outline" size={13} color={THEME.COLOR.neutral500} />
                        <Text style={styles.etaLabel}>ETA</Text>
                    </View>
                    <Text style={styles.etaValue}>{etaText}</Text>
                </View>
            </View>

            {member.status === 'en-route' && member.progress !== null && (
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${member.progress * 100}%` as any, backgroundColor: cfg.color }]} />
                </View>
            )}
        </View>
    );
};

const ConvoyEta = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <BackHeader
                    title=""
                    icon="chevron-back"
                    color={THEME.COLOR.mint}
                    onPress={() => router.back()}
                />
            </View>

            <View style={styles.tripHeader}>
                <Text style={styles.tripName}>Convoy</Text>
                <View style={styles.tripSub}>
                    <Ionicons name="location-outline" size={15} color={THEME.COLOR.neutral400} />
                    <Text style={styles.tripSubText}>Live member status</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <MemberCard member={SAMPLE} />

                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={36} color={THEME.COLOR.neutral500} />
                    <Text style={styles.emptyText}>
                        Other convoy members will appear here once the backend is connected.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    tripHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tripName: {
        color: THEME.COLOR.white,
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 6,
    },
    tripSub: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tripSubText: {
        color: THEME.COLOR.neutral400,
        fontSize: 14,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        backgroundColor: THEME.COLOR.surface,
        borderRadius: 16,
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: THEME.COLOR.white,
        fontSize: 20,
        fontWeight: '700',
    },
    memberInfo: {
        flex: 1,
        gap: 6,
    },
    memberName: {
        color: THEME.COLOR.white,
        fontSize: 17,
        fontWeight: '700',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 99,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    etaBlock: {
        alignItems: 'flex-end',
        gap: 4,
    },
    etaLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    etaLabel: {
        color: THEME.COLOR.neutral500,
        fontSize: 12,
    },
    etaValue: {
        color: THEME.COLOR.white,
        fontSize: 14,
        fontWeight: '700',
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 16,
        marginBottom: 14,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    emptyState: {
        marginTop: 32,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    emptyText: {
        color: THEME.COLOR.neutral500,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ConvoyEta;
