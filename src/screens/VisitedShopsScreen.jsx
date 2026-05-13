import React from 'react';
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchMyVisits } from '../api/visitsApi';

function formatDayLabel(dateStr) {
    const today = new Date();
    const date = new Date(dateStr + 'T00:00:00');

    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function groupByDay(visits) {
    const groups = {};
    visits.forEach((visit) => {
        if (!groups[visit.date]) {
            groups[visit.date] = [];
        }
        groups[visit.date].push(visit);
    });
    // Sort dates descending (most recent first)
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({
        date,
        label: formatDayLabel(date),
        visits: groups[date].sort((a, b) => b.time.localeCompare(a.time)),
    }));
}

const CATEGORY_ICONS = {
    'Tech': 'laptop-outline',
    'Shopping': 'bag-outline',
    'Restaurants': 'restaurant-outline',
    'Cafes': 'cafe-outline',
    'Services': 'construct-outline',
    'Health': 'fitness-outline',
    'Beauty': 'sparkles-outline',
    'Fun': 'game-controller-outline',
};

const CATEGORY_COLORS = {
    'Tech': '#6366F1',
    'Shopping': '#A78BFA',
    'Restaurants': '#FF6B6B',
    'Cafes': '#4ECDC4',
    'Services': '#3B82F6',
    'Health': '#EC4899',
    'Beauty': '#F472B6',
    'Fun': '#F59E0B',
};

function VisitCard({ visit }) {
    const navigation = useNavigation();
    const catIcon = CATEGORY_ICONS[visit.category] || 'storefront-outline';
    const catColor = CATEGORY_COLORS[visit.category] || '#888';

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ShopScreen', { shop: visit })}
            style={styles.visitCard}
        >
            {/* Left: Category Icon */}
            <View style={[styles.visitIconContainer, { backgroundColor: catColor + '15', borderColor: catColor + '30' }]}>
                <Ionicons name={catIcon} size={22} color={catColor} />
            </View>

            {/* Middle: Info */}
            <View style={styles.visitInfo}>
                <Text style={styles.visitName} numberOfLines={1}>{visit.name}</Text>
                <View style={styles.visitAddressRow}>
                    <Ionicons name="location-outline" size={13} color="#aaa" />
                    <Text style={styles.visitAddress} numberOfLines={1}>{visit.adress}</Text>
                </View>
                <View style={styles.visitMetaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
                        <Text style={[styles.categoryBadgeText, { color: catColor }]}>{visit.category}</Text>
                    </View>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{visit.rating}</Text>
                    </View>
                </View>
            </View>

            {/* Right: Time + Arrow */}
            <View style={styles.visitRight}>
                <Text style={styles.visitTime}>{visit.time}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
        </TouchableOpacity>
    );
}

export default function VisitedShopsScreen() {
    const navigation = useNavigation();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const grouped = groupByDay(visits);

    useEffect(() => {
        fetchMyVisits()
            .then((data) => {
                const mapped = data.map((v) => ({
                    id: v.id,
                    name: v.shop_name,
                    adress: v.shop_address,
                    category: v.shop_category,
                    date: v.entered_at.split('T')[0],
                    time: v.entered_at.split('T')[1]?.slice(0, 5) ?? '00:00',
                    rating: null,
                    phone: '',
                    hours: '',
                    isOpen: null,
                }));
                setVisits(mapped);
                console.log('[VisitedShopsScreen] Visites chargées :', mapped.length);
            })
            .catch((err) => console.error('[VisitedShopsScreen] Erreur :', err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#2d253b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Visited Shops</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary bar */}
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <Ionicons name="storefront-outline" size={18} color="#2d253b" />
                    <Text style={styles.summaryValue}>{visits.length}</Text>
                    <Text style={styles.summaryLabel}>visits</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Ionicons name="calendar-outline" size={18} color="#2d253b" />
                    <Text style={styles.summaryValue}>{grouped.length}</Text>
                    <Text style={styles.summaryLabel}>days</Text>
                </View>
            </View>

            {/* Grouped List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2d253b" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {grouped.map((group, groupIndex) => (
                        <View key={group.date} style={styles.dayGroup}>
                            {/* Day Separator */}
                            <View style={styles.daySeparator}>
                                <View style={styles.daySeparatorLine} />
                                <View style={styles.dayLabelContainer}>
                                    <Ionicons name="calendar" size={14} color="#2d253b" />
                                    <Text style={styles.dayLabel}>{group.label}</Text>
                                    <View style={styles.dayCountBadge}>
                                        <Text style={styles.dayCountText}>{group.visits.length}</Text>
                                    </View>
                                </View>
                                <View style={styles.daySeparatorLine} />
                            </View>

                            {/* Visit Cards for this day */}
                            {group.visits.map((visit) => (
                                <VisitCard key={visit.id} visit={visit} />
                            ))}
                        </View>
                    ))}
                    <View style={{ height: 30 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f4f7',
    },
    header: {
        backgroundColor: '#f2f4f7',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#e8ebf0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d253b',
    },

    // Summary
    summaryBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 20,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d253b',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
    summaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#ddd',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },

    // Day Group
    dayGroup: {
        marginBottom: 8,
    },
    daySeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 14,
        gap: 12,
    },
    daySeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dde0e5',
    },
    dayLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8ebf0',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 6,
    },
    dayLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2d253b',
    },
    dayCountBadge: {
        backgroundColor: '#2d253b',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    dayCountText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Visit Card
    visitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    visitIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
    },
    visitInfo: {
        flex: 1,
        gap: 3,
    },
    visitName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    visitAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    visitAddress: {
        fontSize: 12,
        color: '#aaa',
        flex: 1,
    },
    visitMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    visitRight: {
        alignItems: 'flex-end',
        gap: 6,
        marginLeft: 8,
    },
    visitTime: {
        fontSize: 13,
        fontWeight: '600',
        color: '#b0b0b0',
    },
});
