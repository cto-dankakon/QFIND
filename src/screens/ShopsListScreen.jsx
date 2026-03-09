import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LogoApple = require('../../assets/logo-apple.png');

const NEARBY_SHOPS = [
    {
        id: '1',
        name: 'Mega Sport',
        title: 'Mega Sport',
        category: 'Shopping',
        adress: 'Shay Agnon St, Ashkelon',
        latitude: 31.662121,
        longitude: 34.554262,
        description: 'Sports & Fitness Equipment',
        rating: 4.5,
        reviews: 187,
        distance: '150 m',
        phone: '+972-8-672-1234',
        hours: '09:00 - 21:00',
        isOpen: true,
        logoIcon: 'fitness',
        logoColor: '#FF6B6B',
        logo: LogoApple,
    },
    {
        id: '2',
        name: 'Fox',
        title: 'Fox',
        category: 'Shopping',
        adress: 'Shay Agnon St, Ashkelon',
        latitude: 31.661033,
        longitude: 34.555941,
        description: 'Clothing & Fashion',
        rating: 4.3,
        reviews: 312,
        distance: '200 m',
        phone: '+972-8-672-5678',
        hours: '09:30 - 22:00',
        isOpen: true,
        logoIcon: 'shirt',
        logoColor: '#4ECDC4',
        logo: LogoApple,
    },
    {
        id: '3',
        name: 'Mania Jeans',
        title: 'Mania Jeans',
        category: 'Shopping',
        adress: 'Shay Agnon St, Ashkelon',
        latitude: 31.6625,
        longitude: 34.5548,
        description: 'Jeans & Casual Wear',
        rating: 4.2,
        reviews: 98,
        distance: '180 m',
        phone: '+972-8-672-9012',
        hours: '10:00 - 20:00',
        isOpen: false,
        logoIcon: 'body',
        logoColor: '#45B7D1',
        logo: LogoApple,
    },
    {
        id: '4',
        name: 'Studio Pasha',
        title: 'Studio Pasha',
        category: 'Shopping',
        adress: 'Shay Agnon St, Ashkelon',
        latitude: 31.6618,
        longitude: 34.5555,
        description: "Women's Fashion",
        rating: 4.6,
        reviews: 145,
        distance: '250 m',
        phone: '+972-8-672-3456',
        hours: '09:00 - 21:30',
        isOpen: true,
        logoIcon: 'woman',
        logoColor: '#F78FB3',
        logo: LogoApple,
    },
    {
        id: '5',
        name: 'Lee Cooper Kids',
        title: 'Lee Cooper Kids',
        category: 'Shopping',
        adress: 'Shay Agnon St, Ashkelon',
        latitude: 31.6630,
        longitude: 34.5540,
        description: 'Kids Fashion',
        rating: 4.4,
        reviews: 76,
        distance: '300 m',
        phone: '+972-8-672-7890',
        hours: '10:00 - 20:00',
        isOpen: false,
        logoIcon: 'happy',
        logoColor: '#FFD93D',
        logo: LogoApple,
    },
    {
        id: '6',
        name: "Yitzhak's Grocery",
        title: "Yitzhak's Grocery",
        category: 'Restaurants',
        adress: 'Shay Agnon St 5, Ashkelon',
        latitude: 31.6622,
        longitude: 34.5537,
        description: 'Fine Grocery & Local Products',
        rating: 4.8,
        reviews: 54,
        distance: '120 m',
        phone: '+972-8-672-1111',
        hours: '08:00 - 20:00',
        isOpen: true,
        logoIcon: 'cart',
        logoColor: '#A55EEA',
        logo: LogoApple,
    },
];

function ShopListItem({ shop }) {
    const navigation = useNavigation();
    const [isFavorite, setIsFavorite] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const toggleFavorite = () => {
        if (!isFavorite) {
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.35,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 12,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 10,
                }),
            ]).start();
        }
        setIsFavorite((prev) => !prev);
    };

    const handlePress = () => {
        navigation.navigate('ShopScreen', { shop });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            style={styles.shopCard}
        >
            {/* Shop Image */}
            <View style={styles.shopImageContainer}>
                <Image
                    source={require('../../assets/apple-store.jpeg')}
                    style={styles.shopImage}
                    resizeMode="cover"
                />
                {/* Open/Closed badge */}
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: shop.isOpen ? '#27ae6020' : '#e74c3c20' },
                ]}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: shop.isOpen ? '#27ae60' : '#e74c3c' },
                    ]} />
                    <Text style={[
                        styles.statusBadgeText,
                        { color: shop.isOpen ? '#27ae60' : '#e74c3c' },
                    ]}>
                        {shop.isOpen ? 'Open' : 'Closed'}
                    </Text>
                </View>

                {/* Favorite button */}
                <TouchableOpacity
                    onPress={toggleFavorite}
                    activeOpacity={0.7}
                    style={styles.favoriteBtn}
                >
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={isFavorite ? '#1ba5b8' : '#fff'}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Shop Info */}
            <View style={styles.shopInfo}>
                <View style={styles.shopInfoTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                        <View style={styles.categoryRow}>
                            <Ionicons name="pricetag-outline" size={12} color="#888" />
                            <Text style={styles.shopCategory}>{shop.category}</Text>
                        </View>
                    </View>
                    {/* Logo */}
                    <View style={styles.shopLogo}>
                        <Image
                            source={shop.logo || LogoApple}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </View>
                </View>

                <View style={styles.shopAddress}>
                    <Ionicons name="location-outline" size={14} color="#999" />
                    <Text style={styles.shopAddressText} numberOfLines={1}>{shop.adress}</Text>
                </View>

                <View style={styles.shopMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.metaText}>{shop.rating}</Text>
                        <Text style={styles.metaSubtext}>({shop.reviews})</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="walk-outline" size={16} color="#3B82F6" />
                        <Text style={styles.metaText}>{shop.distance}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#888" />
                        <Text style={styles.metaSubtext}>{shop.hours}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function ShopsListScreen() {
    const navigation = useNavigation();

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
                <Text style={styles.headerTitle}>Shops near you</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Results count */}
            <View style={styles.resultsBar}>
                <Text style={styles.resultsCount}>{NEARBY_SHOPS.length} shops found</Text>
                <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
                    <Ionicons name="filter-outline" size={18} color="#2d253b" />
                    <Text style={styles.sortText}>Sort</Text>
                </TouchableOpacity>
            </View>

            {/* Shop List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {NEARBY_SHOPS.map((shop) => (
                    <ShopListItem key={shop.id} shop={shop} />
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>
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
    resultsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    resultsCount: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#e8ebf0',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sortText: {
        fontSize: 14,
        color: '#2d253b',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 14,
    },

    // Shop Card
    shopCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    shopImageContainer: {
        width: '100%',
        height: 140,
        position: 'relative',
    },
    shopImage: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#00000044',
        padding: 6,
        borderRadius: 50,
    },

    // Shop Info
    shopInfo: {
        padding: 14,
        gap: 8,
    },
    shopInfoTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    shopCategory: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    shopLogo: {
        width: 42,
        height: 42,
        borderRadius: 21,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    shopAddress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    shopAddressText: {
        fontSize: 13,
        color: '#999',
        flex: 1,
    },
    shopMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    metaSubtext: {
        fontSize: 12,
        color: '#999',
    },
});
