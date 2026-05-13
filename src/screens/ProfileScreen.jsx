import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { useGeofencing } from '../hooks/useGeofencing';
import { HISTORY_DATA } from './HistoryScreen';
import { getDeviceUUID } from '../utils/deviceUUID';

// Simulated wallet balance
const WALLET_BALANCE = 50;

// Simulated user shops
const MY_SHOPS = [
    { id: '1', name: 'Apple Store', address: 'Shay St 39, Tel Aviv' },
];

// Category colors for visit items in preview
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

function formatShortDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { getCurrencySymbol } = useSettings();
    const { status, requestPermissionsAndStart, stop } = useGeofencing();
    const currencySymbol = getCurrencySymbol();
    const [deviceUUID, setDeviceUUID] = React.useState('Chargement...');

    React.useEffect(() => {
        getDeviceUUID().then(setDeviceUUID);
    }, []);

    // Sort all history items by date+time descending, take first 4
    const sortedHistory = [...HISTORY_DATA]
        .sort((a, b) => {
            const dateComp = b.date.localeCompare(a.date);
            if (dateComp !== 0) return dateComp;
            return b.time.localeCompare(a.time);
        })
        .slice(0, 4);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('SettingsScreen')}
                    activeOpacity={0.7}
                    style={styles.settingsBtn}
                >
                    <Ionicons name="settings-outline" size={24} color="#2d253b" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Wallet Card */}
                <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <Ionicons name="wallet-outline" size={24} color="#2d253b" />
                        <Text style={styles.walletLabel}>E-Wallet</Text>
                    </View>
                    <Text style={styles.walletBalance}>
                        {WALLET_BALANCE.toFixed(2)} {currencySymbol}
                    </Text>
                </View>

                {/* Geofencing Section */}
                <View style={styles.geofencingSection}>
                  {/* Header */}
                  <View style={styles.geofencingHeader}>
                    <Ionicons name="location-outline" size={22} color="#2d253b" />
                    <Text style={styles.geofencingSectionTitle}>Store Detection</Text>
                  </View>

                  {/* Status badge */}
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        status === 'active'     ? '#10B98115' :
                        status === 'denied'     ? '#EF444415' :
                        status === 'error'      ? '#F5974015' :
                        status === 'requesting' ? '#3B82F615' :
                                                  '#64748B15',
                    }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          status === 'active'     ? '#10B981' :
                          status === 'denied'     ? '#EF4444' :
                          status === 'error'      ? '#F59E0B' :
                          status === 'requesting' ? '#3B82F6' :
                                                    '#64748B',
                      }
                    ]} />
                    <Text style={styles.statusText}>
                      {status === 'active'     && 'Active — detecting nearby shops'}
                      {status === 'denied'     && 'Location permission denied'}
                      {status === 'error'      && 'Service error'}
                      {status === 'idle'       && 'Inactive'}
                      {status === 'requesting' && 'Requesting permissions...'}
                    </Text>
                  </View>

                  {/* Control button */}
                  {status === 'active' ? (
                    <TouchableOpacity
                      style={[styles.controlBtn, { backgroundColor: '#EF4444' }]}
                      onPress={stop}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="stop-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.controlBtnText}>Stop Detection</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.controlBtn,
                        { backgroundColor: status === 'requesting' ? '#94a3b8' : '#2d253b' }
                      ]}
                      onPress={requestPermissionsAndStart}
                      disabled={status === 'requesting'}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="location-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.controlBtnText}>
                        {status === 'requesting' ? 'Requesting...' : 'Start Detection'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* History Preview */}
                <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                        <Ionicons name="time-outline" size={22} color="#2d253b" />
                        <Text style={styles.historySectionTitle}>History</Text>
                    </View>
                    {sortedHistory.map((item) => {
                        if (item.type === 'visit') {
                            const catColor = CATEGORY_COLORS[item.category] || '#888';
                            const catIcon = CATEGORY_ICONS[item.category] || 'storefront-outline';
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.historyItem}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('ShopScreen', { shop: { name: item.shopName, adress: item.address } })}
                                >
                                    <View style={[styles.historyIcon, { backgroundColor: catColor + '15' }]}>
                                        <Ionicons name={catIcon} size={20} color={catColor} />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyName}>{item.shopName}</Text>
                                        <Text style={styles.historyAddress}>{item.address}</Text>
                                    </View>
                                    <View style={styles.historyRight}>
                                        <Text style={styles.historyDate}>{formatShortDate(item.date)}</Text>
                                        <Text style={styles.historyTime}>{item.time}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                        if (item.type === 'cashback') {
                            return (
                                <View key={item.id} style={styles.historyItem}>
                                    <View style={[styles.historyIcon, { backgroundColor: '#10B98115' }]}>
                                        <Ionicons name="cash-outline" size={20} color="#10B981" />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyName}>{item.shopName}</Text>
                                        <Text style={[styles.cashbackText, { color: '#10B981' }]}>+{item.amount.toFixed(2)} {currencySymbol}</Text>
                                    </View>
                                    <View style={styles.historyRight}>
                                        <Text style={styles.historyDate}>{formatShortDate(item.date)}</Text>
                                        <Text style={styles.historyTime}>{item.time}</Text>
                                    </View>
                                </View>
                            );
                        }
                        return null;
                    })}

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.seeMoreBtn}
                        onPress={() => navigation.navigate('HistoryScreen')}
                    >
                        <Text style={styles.seeMoreText}>See more</Text>
                    </TouchableOpacity>
                </View>


                {/* My Shops */}
                <View style={styles.myShopsSection}>
                    <View style={styles.historySectionHeader}>
                        <Ionicons name="storefront-outline" size={22} color="#2d253b" />
                        <Text style={styles.historySectionTitle}>My Shops</Text>
                    </View>
                    {MY_SHOPS.map((shop) => (
                        <TouchableOpacity
                            key={shop.id}
                            style={styles.myShopItem}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('MyShopEditScreen', { shop })}
                        >
                            <View style={styles.myShopIcon}>
                                <Ionicons name="storefront" size={22} color="#2d253b" />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyName}>{shop.name}</Text>
                                <Text style={styles.historyAddress}>{shop.address}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#bbb" />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.seeMoreBtn}
                        onPress={() => navigation.navigate('MyShopsScreen')}
                    >
                        <Text style={styles.seeMoreText}>See all / Add a shop</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* UUID at the bottom */}
            <View style={styles.footer}>
                <Text style={styles.uuidText}>{deviceUUID}</Text>
            </View>
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
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#2d253b',
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#e8ebf0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    walletCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    walletLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d253b',
    },
    walletBalance: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2d253b',
    },
    historySection: {
        marginTop: 20,
    },
    historySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    historySectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d253b',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    historyIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d253b',
    },
    historyAddress: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    cashbackText: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    historyDate: {
        fontSize: 12,
        color: '#b0b0b0',
        fontWeight: '500',
    },
    historyTime: {
        fontSize: 11,
        color: '#ccc',
        fontWeight: '500',
        marginTop: 2,
    },
    myShopsSection: {
        marginTop: 20,
    },
    myShopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    myShopIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#e8ebf0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    seeMoreBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 6,
    },
    seeMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d253b',
        textDecorationLine: 'underline',
    },
    geofencingSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    geofencingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    geofencingSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d253b',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 12,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#2d253b',
        flex: 1,
    },
    controlBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    controlBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    footer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    uuidText: {
        fontSize: 12,
        color: '#b0b0b0',
    },
});
