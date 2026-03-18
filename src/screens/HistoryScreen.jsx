import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

// ── Simulated history data ──────────────────────────────────────────

export const HISTORY_DATA = [
    // Visits
    { id: 'v1', type: 'visit', shopName: 'Apple Store', address: 'Shay St 39, Tel Aviv', date: '2026-03-10', time: '14:05', category: 'Tech', matchingProduct: { name: 'iPhone 16 Pro', price: 4999, discount: '10%' } },
    { id: 'v2', type: 'visit', shopName: 'Mega Sport', address: 'Shay Agnon St, Ashkelon', date: '2026-03-10', time: '11:30', category: 'Shopping', matchingProduct: null },
    { id: 'v3', type: 'visit', shopName: 'Fox', address: 'Shay Agnon St, Ashkelon', date: '2026-03-09', time: '17:20', category: 'Shopping', matchingProduct: { name: 'Winter Jacket', price: 299, discount: '25%' } },
    { id: 'v4', type: 'visit', shopName: "Yitzhak's Grocery", address: 'Shay Agnon St 5, Ashkelon', date: '2026-03-08', time: '10:15', category: 'Restaurants', matchingProduct: null },
    { id: 'v5', type: 'visit', shopName: 'Studio Pasha', address: 'Shay Agnon St, Ashkelon', date: '2026-03-07', time: '09:00', category: 'Shopping', matchingProduct: null },
    { id: 'v6', type: 'visit', shopName: 'Lee Cooper Kids', address: 'Shay Agnon St, Ashkelon', date: '2026-03-05', time: '15:45', category: 'Shopping', matchingProduct: { name: 'Kids Sneakers', price: 189, discount: '15%' } },
    { id: 'v7', type: 'visit', shopName: 'Mania Jeans', address: 'Shay Agnon St, Ashkelon', date: '2026-03-03', time: '13:10', category: 'Shopping', matchingProduct: null },

    // Cashbacks (each linked to a payment)
    { id: 'c1', type: 'cashback', shopName: 'Apple Store', amount: 25.00, date: '2026-03-10', time: '14:10', payment: { amount: 4999, method: 'Credit Card', last4: '4821' } },
    { id: 'c2', type: 'cashback', shopName: 'Fox', amount: 8.50, date: '2026-03-09', time: '17:35', payment: { amount: 299, method: 'Credit Card', last4: '4821' } },
    { id: 'c3', type: 'cashback', shopName: 'Mega Sport', amount: 12.00, date: '2026-03-07', time: '12:00', payment: { amount: 480, method: 'Debit Card', last4: '7733' } },
    { id: 'c4', type: 'cashback', shopName: 'Lee Cooper Kids', amount: 5.60, date: '2026-03-05', time: '16:00', payment: { amount: 189, method: 'Credit Card', last4: '4821' } },
    { id: 'c5', type: 'cashback', shopName: "Yitzhak's Grocery", amount: 3.20, date: '2026-03-03', time: '10:30', payment: { amount: 64, method: 'Apple Pay', last4: '4821' } },
];

// ── Filters ─────────────────────────────────────────────────────────

const FILTERS = [
    { key: 'all', label: 'All', icon: 'list-outline' },
    { key: 'cashback', label: 'Cashbacks', icon: 'cash-outline' },
    { key: 'visit', label: 'Visits', icon: 'storefront-outline' },
];

// ── Helpers ─────────────────────────────────────────────────────────

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

function formatDayLabel(dateStr) {
    const today = new Date();
    const date = new Date(dateStr + 'T00:00:00');

    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function groupByDay(items) {
    const groups = {};
    items.forEach((item) => {
        if (!groups[item.date]) groups[item.date] = [];
        groups[item.date].push(item);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({
        date,
        label: formatDayLabel(date),
        items: groups[date].sort((a, b) => b.time.localeCompare(a.time)),
    }));
}

// ── Visit Card ──────────────────────────────────────────────────────

function VisitCard({ item }) {
    const navigation = useNavigation();
    const catIcon = CATEGORY_ICONS[item.category] || 'storefront-outline';
    const catColor = CATEGORY_COLORS[item.category] || '#888';

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ShopScreen', { shop: { name: item.shopName, adress: item.address } })}
            style={styles.card}
        >
            <View style={[styles.cardIconContainer, { backgroundColor: catColor + '15', borderColor: catColor + '30' }]}>
                <Ionicons name={catIcon} size={22} color={catColor} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.shopName}</Text>
                <View style={styles.cardAddressRow}>
                    <Ionicons name="location-outline" size={13} color="#aaa" />
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.address}</Text>
                </View>
                <View style={styles.cardMetaRow}>
                    <View style={[styles.typeBadge, { backgroundColor: catColor + '15' }]}>
                        <Text style={[styles.typeBadgeText, { color: catColor }]}>{item.category}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.cardRight}>
                <Text style={styles.cardTime}>{item.time}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
        </TouchableOpacity>
    );
}

// ── Matching Product sub-card ───────────────────────────────────────

function MatchingProductCard({ product }) {
    const { getCurrencySymbol } = useSettings();
    const currencySymbol = getCurrencySymbol();
    return (
        <View style={styles.subCard}>
            <View style={styles.subCardConnector}>
                <View style={styles.connectorLine} />
                <View style={styles.connectorDot} />
            </View>
            <View style={[styles.subCardIconContainer, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
                <Ionicons name="pricetag-outline" size={16} color="#F59E0B" />
            </View>
            <View style={styles.subCardInfo}>
                <Text style={styles.subCardTitle} numberOfLines={1}>Matching: {product.name}</Text>
                <Text style={styles.subCardDetail}>{product.price} {currencySymbol} · {product.discount} off</Text>
            </View>
        </View>
    );
}

// ── Cashback Card ───────────────────────────────────────────────────

function CashbackCard({ item }) {
    const { getCurrencySymbol } = useSettings();
    const currencySymbol = getCurrencySymbol();
    return (
        <View style={styles.card}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                <Ionicons name="cash-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.shopName}</Text>
                <Text style={[styles.cashbackAmount, { color: '#10B981' }]}>+{item.amount.toFixed(2)} {currencySymbol}</Text>
            </View>
            <View style={styles.cardRight}>
                <Text style={styles.cardTime}>{item.time}</Text>
            </View>
        </View>
    );
}

// ── Payment sub-card ────────────────────────────────────────────────

function PaymentSubCard({ payment }) {
    const { getCurrencySymbol } = useSettings();
    const currencySymbol = getCurrencySymbol();
    return (
        <View style={styles.subCard}>
            <View style={styles.subCardConnector}>
                <View style={styles.connectorLine} />
                <View style={styles.connectorDot} />
            </View>
            <View style={[styles.subCardIconContainer, { backgroundColor: '#6366F115', borderColor: '#6366F130' }]}>
                <Ionicons name="card-outline" size={16} color="#6366F1" />
            </View>
            <View style={styles.subCardInfo}>
                <Text style={styles.subCardTitle} numberOfLines={1}>{payment.method} ···{payment.last4}</Text>
                <Text style={styles.subCardDetail}>Paid {payment.amount.toFixed(2)} {currencySymbol}</Text>
            </View>
        </View>
    );
}

// ── Main Screen ─────────────────────────────────────────────────────

export default function HistoryScreen() {
    const navigation = useNavigation();
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredData = useMemo(() => {
        if (activeFilter === 'all') return HISTORY_DATA;
        return HISTORY_DATA.filter((item) => item.type === activeFilter);
    }, [activeFilter]);

    const grouped = useMemo(() => groupByDay(filteredData), [filteredData]);

    const totalCashback = HISTORY_DATA
        .filter((i) => i.type === 'cashback')
        .reduce((sum, i) => sum + i.amount, 0);

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
                <Text style={styles.headerTitle}>History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => {
                    const isActive = activeFilter === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            activeOpacity={0.7}
                            onPress={() => setActiveFilter(f.key)}
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                        >
                            <Ionicons
                                name={f.icon}
                                size={16}
                                color={isActive ? '#fff' : '#2d253b'}
                            />
                            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Summary bar */}
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <Ionicons name="storefront-outline" size={18} color="#2d253b" />
                    <Text style={styles.summaryValue}>{HISTORY_DATA.filter((i) => i.type === 'visit').length}</Text>
                    <Text style={styles.summaryLabel}>visits</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Ionicons name="cash-outline" size={18} color="#10B981" />
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>{totalCashback.toFixed(2)}</Text>
                    <Text style={styles.summaryLabel}>cashback</Text>
                </View>
            </View>

            {/* Grouped list */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {grouped.map((group) => (
                    <View key={group.date} style={styles.dayGroup}>
                        {/* Day separator */}
                        <View style={styles.daySeparator}>
                            <View style={styles.daySeparatorLine} />
                            <View style={styles.dayLabelContainer}>
                                <Ionicons name="calendar" size={14} color="#2d253b" />
                                <Text style={styles.dayLabel}>{group.label}</Text>
                                <View style={styles.dayCountBadge}>
                                    <Text style={styles.dayCountText}>{group.items.length}</Text>
                                </View>
                            </View>
                            <View style={styles.daySeparatorLine} />
                        </View>

                        {/* Cards */}
                        {group.items.map((item) => (
                            <View key={item.id}>
                                {item.type === 'visit' && (
                                    <>
                                        <VisitCard item={item} />
                                        {item.matchingProduct && (
                                            <MatchingProductCard product={item.matchingProduct} />
                                        )}
                                    </>
                                )}
                                {item.type === 'cashback' && (
                                    <>
                                        <CashbackCard item={item} />
                                        {item.payment && (
                                            <PaymentSubCard payment={item.payment} />
                                        )}
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

// ── Styles ───────────────────────────────────────────────────────────

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

    // Filters
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e8ebf0',
    },
    filterChipActive: {
        backgroundColor: '#2d253b',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2d253b',
    },
    filterChipTextActive: {
        color: '#fff',
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

    // Main Card
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
    },
    cardInfo: {
        flex: 1,
        gap: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cardAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#aaa',
        flex: 1,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cashbackAmount: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 2,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 6,
        marginLeft: 8,
    },
    cardTime: {
        fontSize: 13,
        fontWeight: '600',
        color: '#b0b0b0',
    },

    // Sub-card (payment / matching product)
    subCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        marginLeft: 24,
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#eef0f3',
    },
    subCardConnector: {
        position: 'absolute',
        left: -13,
        top: -4,
        bottom: '50%',
        width: 14,
        alignItems: 'center',
    },
    connectorLine: {
        width: 1.5,
        height: 14,
        backgroundColor: '#dde0e5',
    },
    connectorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    subCardIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
    },
    subCardInfo: {
        flex: 1,
    },
    subCardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
    },
    subCardDetail: {
        fontSize: 11,
        color: '#999',
        marginTop: 1,
    },
});
