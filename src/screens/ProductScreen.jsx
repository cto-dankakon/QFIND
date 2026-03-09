import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Animated,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Color options for product variants
const COLOR_OPTIONS = [
    { id: 'orange', color: '#E8732A' },
    { id: 'green', color: '#3DAB3D' },
    { id: 'lavender', color: '#D9C8E8' },
];

// Storage options
const STORAGE_OPTIONS = ['256 GB', '512 GB', '1024 GB', '2048 GB'];

// More products from same shop
const MORE_FROM_SHOP = [
    { id: 'm1', name: 'AirPods Pro 2', price: '279 $', img: require('../../assets/iphone.jpeg') },
    { id: 'm2', name: 'Apple Watch Ultra', price: '899 $', img: require('../../assets/iphone.jpeg') },
    { id: 'm3', name: 'iPad Pro 13"', price: '1299 $', img: require('../../assets/iphone.jpeg') },
    { id: 'm4', name: 'MacBook Air M3', price: '1199 $', img: require('../../assets/iphone.jpeg') },
];

export default function ProductScreen({ route, navigation }) {
    const product = route?.params?.product || {
        name: 'Iphone 17 Pro Max',
        price: '899 $',
        old_price: '1329 $',
        store_infos: 'Apple Store',
        store_address: 'Shay St 39, Tel Aviv-Yafo',
        img: require('../../assets/iphone.jpeg'),
        distance: '255 m',
        inStock: true,
        screenSize: "6,9'",
        description: `Design & Display
• 6.9-inch Super Retina XDR display with ProMotion 2.0 technology (ultra-smooth refresh rate from 1 to 120Hz).
• Under the screen: Full Face ID integration under the panel, reducing the Dynamic Island to a simple circular notch (or an even more discreet "pill").
• Chassis: New Grade 5 polished Titanium alloy, lighter and scratch-resistant.

New: Capacitive buttons with haptic feedback (no more physical moving buttons).

Performance (The powerhouse)
• A19 Pro chip: 2nm process for record energy efficiency and doubled computing power for AI.
• Memory: 12 GB of RAM minimum to support the new Apple Intelligence 2.0 features locally (no cloud).`,
        colors: COLOR_OPTIONS,
        storageOptions: STORAGE_OPTIONS,
    };

    const isOwner = route?.params?.isOwner || false;

    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].id);
    const [selectedStorage, setSelectedStorage] = useState(STORAGE_OPTIONS[0]);
    const [showFullDescription, setShowFullDescription] = useState(false);
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

    const handleFindShop = () => {
        const query = product.store_address || product.store_infos || '';
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
            default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        });
        Linking.openURL(url);
    };

    const handleGoToShop = () => {
        if (product.shopData) {
            navigation.navigate('ShopScreen', { shop: product.shopData });
        }
    };

    const descriptionText = product.description || '';
    const descriptionPreview = descriptionText.length > 300 ? descriptionText.substring(0, 300) + '...' : descriptionText;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Top bar: Return + Favorite */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.returnButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
                        <Text style={styles.returnText}>Return</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleFavorite} activeOpacity={0.7} style={styles.favButton}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={28}
                                color={isFavorite ? '#1ba5b8' : '#1a1a1a'}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Product Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={product.img}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Product Info */}
                <View style={styles.productInfoSection}>
                    {/* Name + Price */}
                    <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName}>{product.name}</Text>
                            {product.inStock !== false && (
                                <Text style={styles.inStockText}>in stock</Text>
                            )}
                        </View>
                        <View style={styles.priceBlock}>
                            {product.old_price && (
                                <Text style={styles.oldPrice}>{product.old_price}</Text>
                            )}
                            <Text style={styles.currentPrice}>{product.price}</Text>
                        </View>
                    </View>

                    {/* Color Options */}
                    <View style={styles.colorRow}>
                        {(product.colors || COLOR_OPTIONS).map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                activeOpacity={1}
                                onPress={() => setSelectedColor(c.id)}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: c.color },
                                    selectedColor === c.id && styles.colorCircleSelected,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Storage Options */}
                    <View style={styles.storageRow}>
                        <View style={styles.storageIcon}>
                            <Ionicons name="hardware-chip-outline" size={18} color="#666" />
                        </View>
                        {(product.storageOptions || STORAGE_OPTIONS).map((s) => (
                            <TouchableOpacity
                                key={s}
                                activeOpacity={0.7}
                                onPress={() => setSelectedStorage(s)}
                                style={[
                                    styles.storageChip,
                                    selectedStorage === s && styles.storageChipSelected,
                                ]}
                            >
                                <Text style={[
                                    styles.storageChipText,
                                    selectedStorage === s && styles.storageChipTextSelected,
                                ]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Screen Size */}
                    {product.screenSize && (
                        <View style={styles.screenSizeRow}>
                            <Ionicons name="phone-portrait-outline" size={16} color="#666" />
                            <Text style={styles.screenSizeText}>{product.screenSize}</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {showFullDescription ? descriptionText : descriptionPreview}
                    </Text>
                    {descriptionText.length > 300 && (
                        <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} activeOpacity={0.7}>
                            <Text style={styles.seeMoreText}>
                                {showFullDescription ? 'See less' : 'See more'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Shop Information */}
                <View style={styles.shopInfoSection}>
                    <Text style={styles.shopInfoTitle}>Shop information</Text>
                    <View style={styles.shopInfoCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>{product.store_infos || 'Shop'}</Text>
                            <Text style={styles.shopAddress}>{product.store_address || ''}</Text>
                        </View>

                        <TouchableOpacity onPress={handleFindShop} activeOpacity={0.7} style={styles.findUsBtn}>
                            <Ionicons name="location-sharp" size={24} color="#e74c3c" />
                            <Text style={styles.findUsText}>Find us !</Text>
                        </TouchableOpacity>

                        <View style={styles.distanceBlock}>
                            <Ionicons name="walk-outline" size={18} color="#666" />
                            <Text style={styles.distanceText}>{product.distance || '-- m'}</Text>
                        </View>
                    </View>
                </View>

                {/* More of the shop */}
                <View style={styles.moreSection}>
                    <View style={styles.moreHeader}>
                        <Text style={styles.moreTitle}>More of the shop</Text>
                        <TouchableOpacity onPress={handleGoToShop} activeOpacity={0.7} style={styles.shopLink}>
                            <Text style={styles.shopLinkText}>Shop</Text>
                            <Ionicons name="chevron-forward" size={18} color="#1a1a1a" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moreScroll}
                    >
                        {MORE_FROM_SHOP.map((item) => (
                            <TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.moreCard}>
                                <Image source={item.img} style={styles.moreCardImage} resizeMode="cover" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: isOwner ? 80 : 30 }} />
            </ScrollView>

            {/* Floating Edit Button (owner only) */}
            {isOwner && (
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.85}
                    onPress={() => Alert.alert('Edit product', 'Product editing coming soon!')}
                >
                    <Ionicons name="pencil" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Top bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    returnButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    returnText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    favButton: {
        padding: 6,
    },

    // Product Image
    imageContainer: {
        width: '100%',
        height: width * 0.7,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImage: {
        width: '80%',
        height: '100%',
    },

    // Product Info
    productInfoSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    inStockText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    priceBlock: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    oldPrice: {
        fontSize: 14,
        color: '#e74c3c',
        textDecorationLine: 'line-through',
    },
    currentPrice: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },

    // Colors
    colorRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 18,
        paddingLeft: 4,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircleSelected: {
        borderColor: '#1a1a1a',
        borderWidth: 3,
    },

    // Storage
    storageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    storageIcon: {
        marginRight: 2,
    },
    storageChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    storageChipSelected: {
        borderColor: '#1a1a1a',
        backgroundColor: '#f5f5f5',
    },
    storageChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },
    storageChipTextSelected: {
        color: '#1a1a1a',
    },

    // Screen size
    screenSizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    screenSizeText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },

    // Description
    descriptionSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    descriptionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 21,
    },
    seeMoreText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000000ff',
        marginTop: 8,
    },

    // Shop info
    shopInfoSection: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginTop: 8,
    },
    shopInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    shopInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shopName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    shopAddress: {
        fontSize: 13,
        color: '#3c8ce7ff',
        marginTop: 2,
    },
    findUsBtn: {
        alignItems: 'center',
        gap: 4,
    },
    findUsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#e74c3c',
    },
    distanceBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distanceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },

    // More of the shop
    moreSection: {
        paddingTop: 16,
        paddingBottom: 10,
    },
    moreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    moreTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    shopLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    shopLinkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    moreScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    moreCard: {
        width: 130,
        height: 130,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f8f8f8',
    },
    moreCardImage: {
        width: '100%',
        height: '100%',
    },

    // FAB (owner edit)
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2d253b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2d253b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
    },
});
