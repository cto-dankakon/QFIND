import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSettings, CURRENCIES } from '../context/SettingsContext';

// Simulated user UUID
const USER_UUID = 'a3f8b12e-7c4d-4e9a-b6d1-9f2e8a3c5d7f';

// Simulated wallet balance
const WALLET_BALANCE = 50;

// Simulated user shops
const MY_SHOPS = [
    { id: '1', name: 'Apple Store', address: 'Shay St 39, Tel Aviv' },
];

// Simulated shop visit history
const VISIT_HISTORY = [
    { id: '1', name: 'Apple Store', adress: 'Shay St 39, Tel Aviv', date: '18 Feb 2026', phone: '+972-3-1234567', hours: '09:00 - 21:00', isOpen: true },
    { id: '2', name: 'Mega Sport', adress: 'Shay Agnon St, Ashkelon', date: '17 Feb 2026', phone: '+972-8-8765432', hours: '10:00 - 20:00', isOpen: true },
    { id: '3', name: 'Fox', adress: 'Shay Agnon St, Ashkelon', date: '16 Feb 2026', phone: '+972-8-1234567', hours: '10:00 - 22:00', isOpen: false },
    { id: '4', name: "Yitzhak's Grocery", adress: 'Shay Agnon St 5, Ashkelon', date: '15 Feb 2026', phone: '+972-8-1112223', hours: '08:00 - 19:30', isOpen: true },
    { id: '5', name: 'Studio Pasha', adress: 'Shay Agnon St, Ashkelon', date: '14 Feb 2026', phone: '+972-8-4445556', hours: '09:30 - 21:00', isOpen: true },
];

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { getCurrencySymbol } = useSettings();
    const visibleHistory = VISIT_HISTORY.slice(0, 3);
    const currencySymbol = getCurrencySymbol();

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


                {/* Visit History */}
                <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                        <Ionicons name="time-outline" size={22} color="#2d253b" />
                        <Text style={styles.historySectionTitle}>Visited shops</Text>
                    </View>
                    {visibleHistory.map((visit) => (
                        <TouchableOpacity
                            key={visit.id}
                            style={styles.historyItem}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('ShopScreen', { shop: visit })}
                        >
                            <View style={styles.historyIcon}>
                                <Ionicons name="storefront-outline" size={22} color="#2d253b" />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyName}>{visit.name}</Text>
                                <Text style={styles.historyAddress}>{visit.adress}</Text>
                            </View>
                            <Text style={styles.historyDate}>{visit.date}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.seeMoreBtn}
                        onPress={() => navigation.navigate('VisitedShopsScreen')}
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
                <Text style={styles.uuidText}>{USER_UUID}</Text>
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
        backgroundColor: '#f2f4f7',
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
    historyDate: {
        fontSize: 12,
        color: '#b0b0b0',
        fontWeight: '500',
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
    footer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    uuidText: {
        fontSize: 12,
        color: '#b0b0b0',
    },
});
