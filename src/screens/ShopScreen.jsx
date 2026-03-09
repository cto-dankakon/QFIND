import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Linking,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Dummy product data for shop categories
const SHOP_PRODUCTS = {
    'Last discounts': [
        { id: '1', name: 'iPhone 16 Pro', distance: '255 m', oldPrice: '1199 $', price: '999 $', img: require('../../assets/iphone.jpeg') },
        { id: '2', name: 'MacBook Air', distance: '255 m', oldPrice: '1299 $', price: '1099 $', img: require('../../assets/iphone.jpeg') },
        { id: '3', name: 'AirPods Pro', distance: '255 m', oldPrice: '279 $', price: '219 $', img: require('../../assets/iphone.jpeg') },
        { id: '4', name: 'iPad Mini', distance: '255 m', oldPrice: '599 $', price: '499 $', img: require('../../assets/iphone.jpeg') },
    ],
    'Phones': [
        { id: '5', name: 'iPhone 16', distance: '255 m', oldPrice: '999 $', price: '899 $', img: require('../../assets/iphone.jpeg') },
        { id: '6', name: 'iPhone 16 Plus', distance: '255 m', oldPrice: null, price: '1099 $', img: require('../../assets/iphone.jpeg') },
        { id: '7', name: 'iPhone SE', distance: '255 m', oldPrice: null, price: '429 $', img: require('../../assets/iphone.jpeg') },
        { id: '8', name: 'iPhone 15', distance: '255 m', oldPrice: '899 $', price: '699 $', img: require('../../assets/iphone.jpeg') },
    ],
    'Tablets': [
        { id: '9', name: 'iPad Pro 13"', distance: '255 m', oldPrice: null, price: '1299 $', img: require('../../assets/iphone.jpeg') },
        { id: '10', name: 'iPad Air', distance: '255 m', oldPrice: '699 $', price: '599 $', img: require('../../assets/iphone.jpeg') },
        { id: '11', name: 'iPad 10th Gen', distance: '255 m', oldPrice: null, price: '449 $', img: require('../../assets/iphone.jpeg') },
        { id: '12', name: 'iPad Mini 7', distance: '255 m', oldPrice: '599 $', price: '499 $', img: require('../../assets/iphone.jpeg') },
    ],
};

function ProductCard({ product }) {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('ProductScreen', {
            product: {
                name: product.name,
                price: product.price,
                old_price: product.oldPrice,
                img: product.img,
                distance: product.distance,
                store_infos: product.shopName || 'Shop',
                store_address: product.shopAddress || '',
                inStock: true,
            },
        });
    };

    return (
        <TouchableOpacity activeOpacity={0.85} style={styles.productCard} onPress={handlePress}>
            <View style={styles.productImageContainer}>
                <Image
                    source={product.img}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.productMeta}>
                    <View style={styles.productPriceContainer}>
                        {product.oldPrice && (
                            <Text style={styles.productOldPrice}>{product.oldPrice}</Text>
                        )}
                        <Text style={styles.productPrice}>{product.price}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function CategorySection({ title, products }) {
    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
            >
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </ScrollView>
        </View>
    );
}

export default function ShopScreen({ route, navigation }) {
    const shop = route?.params?.shop || {
        id: '1',
        title: 'Apple Store',
        name: 'Apple Store',
        adress: 'Shay St 12',
        distance: '255 m',
        rating: 4.8,
        phone: '+1234567890',
        hours: '08:00 - 23:30',
        isOpen: false,
    };

    const shopName = shop.title || shop.name || 'Shop';
    const shopAddress = shop.adress || 'Address not available';
    const shopDistance = shop.distance || '-- m';
    const shopPhone = shop.phone || '';
    const openTime = shop.openTime || '09:00';
    const closeTime = shop.closeTime || '21:00';

    // Calculate if shop is currently open
    const isShopOpen = useCallback(() => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        if (closeMinutes > openMinutes) {
            return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        } else if (closeMinutes < openMinutes) {
            return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
        return false;
    }, [openTime, closeTime]);

    const isOpen = isShopOpen();

    const [isFavorite, setIsFavorite] = useState(shop.isFavorite || false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const toggleFavorite = () => {
        if (!isFavorite) {
            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
            ]).start();
        }
        setIsFavorite((prev) => !prev);
    };

    const handleCall = () => {
        if (shopPhone) {
            Linking.openURL(`tel:${shopPhone}`);
        }
    };

    const handleFindUs = () => {
        const lat = shop.latitude || 31.662121;
        const lng = shop.longitude || 34.554262;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = shopName;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`,
            default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
        });
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Header Image */}
                <View style={styles.headerImageContainer}>
                    <Image
                        source={require('../../assets/apple-store.jpeg')}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Favorite button */}
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={toggleFavorite}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={24}
                                color={isFavorite ? '#1ba5b8' : '#fff'}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Dark gradient overlay at bottom */}
                    <View style={styles.headerOverlay} />
                </View>

                {/* Shop Info Card */}
                <View style={styles.infoCard}>
                    {/* Logo circle - overlapping */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="logo-apple" size={40} color="#000" />
                        </View>
                    </View>

                    {/* Shop name + address + distance */}
                    <View style={styles.shopHeader}>
                        <View style={styles.shopNameBlock}>
                            <Text style={styles.shopName}>{shopName}</Text>
                            <Text style={styles.shopAddress}>{shopAddress}</Text>
                        </View>
                        <View style={styles.distanceBlock}>
                            <Ionicons name="walk-outline" size={18} color="#666" />
                            <Text style={styles.distanceText}>{shopDistance}</Text>
                        </View>
                    </View>

                    {/* Status */}
                    <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#e8f8f0' : '#fde8e8' }]}>
                        <View style={[styles.statusDot, { backgroundColor: isOpen ? '#27ae60' : '#e74c3c' }]} />
                        <Text style={[styles.statusBadgeText, { color: isOpen ? '#27ae60' : '#e74c3c' }]}>
                            {isOpen ? 'Open now' : 'Currently closed'}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27ae60' }]} onPress={handleCall} activeOpacity={0.8}>
                            <Ionicons name="call" size={28} color="#fff" />
                            <Text style={styles.actionBtnText}>Call the shop</Text>
                        </TouchableOpacity>

                        <View style={[styles.actionBtn, { backgroundColor: isOpen ? '#fff' : '#888' }]}>
                            <Ionicons name="time-outline" size={28} color={isOpen ? '#333' : '#fff'} />
                            <Text style={[styles.actionBtnText, { color: isOpen ? '#333' : '#fff' }]}>{openTime} - {closeTime}</Text>
                        </View>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f5f5f5' }]} onPress={handleFindUs} activeOpacity={0.8}>
                            <Ionicons name="location-sharp" size={28} color="#e74c3c" />
                            <Text style={[styles.actionBtnText, { color: '#333' }]}>Find us</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Product Sections */}
                <View style={styles.productsContainer}>
                    {Object.entries(SHOP_PRODUCTS).map(([category, products]) => (
                        <CategorySection key={category} title={category} products={products} />
                    ))}
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const HEADER_HEIGHT = 220;
const LOGO_SIZE = 70;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f4f7',
    },

    // Header Image
    headerImageContainer: {
        width: '100%',
        height: HEADER_HEIGHT,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    favoriteButton: {
        position: 'absolute',
        top: 48,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    // Info Card
    infoCard: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        position: 'relative',
    },
    logoContainer: {
        position: 'absolute',
        top: -LOGO_SIZE / 2,
        right: 20,
        zIndex: 5,
    },
    logoCircle: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: LOGO_SIZE / 2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },

    // Shop header
    shopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        paddingRight: LOGO_SIZE + 10,
    },
    shopNameBlock: {},
    shopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    shopAddress: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    distanceBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    distanceText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },

    // Status
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },

    // Products
    productsContainer: {
        paddingTop: 10,
    },
    categorySection: {
        marginBottom: 10,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },

    // Product Card
    productCard: {
        width: 155,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    productImageContainer: {
        width: '100%',
        height: 110,
        backgroundColor: '#f8f8f8',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        padding: 8,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    productPriceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        flexDirection: 'row',
        gap: 5,
    },
    productOldPrice: {
        fontSize: 11,
        color: '#e74c3c',
        textDecorationLine: 'line-through',
    },
    productPrice: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
});
