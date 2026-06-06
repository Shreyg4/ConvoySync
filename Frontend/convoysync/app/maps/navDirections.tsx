import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from '@/components/pressableCustomization';
import BackHeader from '@/components/BackHeader';
import { THEME } from '../../theme';
import { getNavState } from './navigationStore';

/**
 * Converts Google Directions maneuver codes into Ionicons names for the
 * detailed navigation step list.
 */
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

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const formatDuration = (mins: number) =>
    mins >= 60 ? `${Math.floor(mins / 60)} hr ${Math.ceil(mins % 60)} min` : `${Math.ceil(mins)} min`;

/**
 * Read-only directions sheet for the currently active navigation route.
 */
const NavDirections = () => {
    const router = useRouter();
    const { legs, legLabels, remainingDuration, totalDistanceMi, activeLegIndex } = getNavState();
    const [legIndex, setLegIndex] = useState(activeLegIndex);

    const currentLeg = legs[legIndex];
    const eta = remainingDuration > 0
        ? new Date(Date.now() + remainingDuration * 60 * 1000).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
          })
        : '--:--';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <BackHeader
                    title="Directions"
                    icon="chevron-back"
                    color={THEME.COLOR.mint}
                    onPress={() => router.back()}
                />
            </View>

            <View style={styles.summary}>
                <Text style={styles.summaryTime}>{formatDuration(remainingDuration)}</Text>
                <Text style={styles.summaryDetail}>
                    {totalDistanceMi.toFixed(1)} mi · Arrives {eta}
                </Text>
            </View>

            {legs.length > 1 && (
                <View style={styles.legNav}>
                    <HapticPressable
                        hapticStyle="light"
                        style={styles.legNavBtn}
                        onPress={() => setLegIndex(i => Math.max(0, i - 1))}
                        disabled={legIndex === 0}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={legIndex === 0 ? THEME.COLOR.neutral500 : THEME.COLOR.mint}
                        />
                        <Text style={[styles.legNavText, legIndex === 0 && styles.legNavTextDisabled]}>
                            Prev
                        </Text>
                    </HapticPressable>

                    <Text style={styles.legLabel} numberOfLines={1}>
                        To: {legLabels[legIndex]}
                    </Text>

                    <HapticPressable
                        hapticStyle="light"
                        style={styles.legNavBtn}
                        onPress={() => setLegIndex(i => Math.min(legs.length - 1, i + 1))}
                        disabled={legIndex === legs.length - 1}
                    >
                        <Text style={[styles.legNavText, legIndex === legs.length - 1 && styles.legNavTextDisabled]}>
                            Next
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={legIndex === legs.length - 1 ? THEME.COLOR.neutral500 : THEME.COLOR.mint}
                        />
                    </HapticPressable>
                </View>
            )}

            <View style={styles.divider} />

            {!currentLeg ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No directions available</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepList}>
                    {currentLeg.steps.map((step: any, i: number) => (
                        <View key={i} style={styles.stepItem}>
                            <View style={styles.stepIcon}>
                                <Ionicons
                                    name={getManeuverIcon(step.maneuver)}
                                    size={20}
                                    color={THEME.COLOR.mint}
                                />
                            </View>
                            <Text style={styles.stepInstruction} numberOfLines={3}>
                                {stripHtml(step.html_instructions)}
                            </Text>
                            <Text style={styles.stepDistance}>{step.distance?.text}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.COLOR.black,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    summary: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    summaryTime: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.COLOR.mint,
    },
    summaryDetail: {
        fontSize: 14,
        color: THEME.COLOR.neutral500,
        marginTop: 2,
    },
    legNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    legNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 6,
    },
    legNavText: {
        color: THEME.COLOR.mint,
        fontSize: 14,
        fontWeight: '600',
    },
    legNavTextDisabled: {
        color: THEME.COLOR.neutral500,
    },
    legLabel: {
        flex: 1,
        textAlign: 'center',
        color: THEME.COLOR.white,
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 20,
        marginBottom: 8,
    },
    stepList: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
        gap: 12,
    },
    stepIcon: {
        width: 32,
        alignItems: 'center',
    },
    stepInstruction: {
        flex: 1,
        color: THEME.COLOR.white,
        fontSize: 14,
        lineHeight: 20,
    },
    stepDistance: {
        color: THEME.COLOR.neutral500,
        fontSize: 12,
        minWidth: 40,
        textAlign: 'right',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: THEME.COLOR.neutral500,
        fontSize: 16,
    },
});

export default NavDirections;
