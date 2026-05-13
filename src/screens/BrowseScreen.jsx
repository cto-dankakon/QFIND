import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
    Easing,
    Platform,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

// Logo Imports
const LogoApple = require('../../assets/logo-apple.png');
import { useNavigation } from '@react-navigation/native';
import FCShop from '../components/FCShop';
import FCProduct from '../components/FCProduct';
import FCSwitchMap from '../components/FCSwitchMap';
import FCFilterBar from '../components/FCFilterBar';
import { fetchShops } from '../api/shopsApi';
import { getMenuData } from '../../amplify/functions/getMenuData';

// react-native-maps only works on native (iOS/Android), not on web
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
    MapView = require('react-native-map-clustering').default;
    Marker = require('react-native-maps').Marker;
}

const { width } = Dimensions.get('window');



const POPULAR = [
    { id: '1', title: 'Corner Bakery', category: 'Restaurants', rating: 4.8, reviews: 234 },
    { id: '2', title: 'Central Café', category: 'Cafes', rating: 4.6, reviews: 189 },
    { id: '3', title: 'TechStore Pro', category: 'Shopping', rating: 4.5, reviews: 312 },
    { id: '4', title: 'Adventure Park', category: 'Leisure', rating: 4.9, reviews: 567 },
];


export default function BrowseScreen() {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [filters, setFilters] = useState({
        categories: [],
        distance: null,
        priceMin: null,
        priceMax: null,
        promoOnly: false,
        showMode: 'all',
    });
    const [refreshing, setRefreshing] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const panelAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef(null);
    const locationSubRef = useRef(null);

    // Fetch shops from API and products from getMenuData
    const fetchMenuData = useCallback(async () => {
        try {
            const coords = userLocation
                ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                : { latitude: 31.662, longitude: 34.554 };

            const [shopsData, data] = await Promise.all([
                fetchShops(),
                getMenuData(coords),
            ]);

            // Map shops to the format expected by FCShop
            const mappedShops = shopsData.map((s) => ({
                id: s.id,
                name: s.name,
                title: s.name,
                category: s.category,
                adress: s.address,
                latitude: s.location?.latitude ?? 0,
                longitude: s.location?.longitude ?? 0,
                description: s.description ?? '',
                rating: s.rating ?? 0,
                reviews: s.reviews ?? 0,
                distance: s.distance ?? '',
                phone: s.phone,
                hours: `${s.open_time} - ${s.close_time}`,
                isOpen: s.isOpen ?? true,
                logo: LogoApple,
                logoUrl: s.logo_url,
                coverUrl: s.cover_url,
            }));

            // Map products to the format expected by FCProduct
            const productImages = [
                require('../../assets/iphone.jpeg'),
                require('../../assets/sneakers.jpeg'),
            ];
            const mappedProducts = (data?.nearbyProducts ?? []).map((p, i) => ({
                name: p.name,
                rating: p.rating,
                price: p.discountPrice ? `${p.discountPrice} ${p.currency}` : `${p.price} ${p.currency}`,
                old_price: p.discountPrice ? `${p.price} ${p.currency}` : null,
                store_infos: p.shopName,
                store_address: p.shopAddress,
                img: productImages[i % 2],
                distance: p.distance,
                inStock: p.inStock,
                description: p.description || '',
            }));

            setShops(mappedShops);
            setProducts(mappedProducts);
        } catch (error) {
            console.error('[BrowseScreen] Failed to fetch menu data:', error);
        }
    }, [userLocation]);

    // Load data on mount
    useEffect(() => {
        fetchMenuData();
    }, []);

    // Pull-to-refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMenuData();
        setRefreshing(false);
    }, [fetchMenuData]);

    const openShopPanel = (shop) => {
        setSelectedShop(shop);
        Animated.timing(panelAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
        }).start();
    };

    const closeShopPanel = () => {
        Animated.timing(panelAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
        }).start(() => setSelectedShop(null));
    };

    // Request permission and track GPS location in real-time
    useEffect(() => {
        if (viewMode === 'map') {
            (async () => {
                setLocationLoading(true);

                // Check that GPS is enabled on the device
                const enabled = await Location.hasServicesEnabledAsync();
                if (!enabled) {
                    alert('Please enable GPS / Location Services on your device.');
                    setLocationLoading(false);
                    return;
                }

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    alert('Location permission denied. Please enable it in settings.');
                    setLocationLoading(false);
                    return;
                }

                // Track position in real-time
                locationSubRef.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 1000,
                        distanceInterval: 1,
                    },
                    (location) => {
                        setUserLocation({
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        });
                        setLocationLoading(false);
                    }
                );
            })();
        }

        // Cleanup: stop tracking when leaving map
        return () => {
            if (locationSubRef.current) {
                locationSubRef.current.remove();
                locationSubRef.current = null;
            }
        };
    }, [viewMode]);

    const toggleSearch = () => {
        if (isSearchOpen) {
            searchInputRef.current?.blur();
            Animated.timing(searchAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
                easing: Easing.inOut(Easing.cubic),
            }).start(() => {
                setIsSearchOpen(false);
                setSearchQuery('');
            });
        } else {
            setIsSearchOpen(true);
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.cubic),
            }).start(() => {
                searchInputRef.current?.focus();
            });
        }
    };

    const toggleCategoryFilter = (category) => {
        const current = filters.categories || [];
        const exists = current.find((f) => f.id === category.id);
        if (exists) {
            setFilters({ ...filters, categories: current.filter((f) => f.id !== category.id) });
        } else {
            setFilters({ ...filters, categories: [...current, category] });
        }
    };

    const dropdownHeight = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 55],
    });
    const dropdownOpacity = searchAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <TouchableOpacity
                onPress={toggleSearch}
                activeOpacity={0.7}
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    backgroundColor: '#2d253b',
                    borderRadius: 50,
                    width: 42,
                    height: 42,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                    zIndex: 20,
                }}
            >
                <Ionicons name={isSearchOpen ? 'close' : 'search-outline'} size={18} color="#ffffff" />
            </TouchableOpacity>


            {/* Header */}
            <View style={{
                backgroundColor: '#f2f4f7ff',
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
                zIndex: 10,
            }}>
                <Text style={{ fontSize: 34, fontWeight: 'bold', color: '#2d253bff' }}>QFind</Text>
                <FCSwitchMap mode={viewMode} onModeChange={setViewMode} />
            </View>

            {/* Filter Bar */}
            <FCFilterBar filters={filters} onFiltersChange={setFilters} />

            {/* Search dropdown */}
            <Animated.View style={{
                height: dropdownHeight,
                opacity: dropdownOpacity,
                overflow: 'hidden',
                backgroundColor: '#f2f4f7',
                paddingHorizontal: 16,
                justifyContent: 'center',
                zIndex: 5,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#eceff3ff',
                    borderRadius: 8,
                    padding: 8,
                    borderColor: '#2d253bff',
                    borderWidth: 1,
                }}>
                    <Ionicons name="search-outline" size={20} color="#2d253bff" />
                    <TextInput
                        ref={searchInputRef}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#2d253bff',
                            marginLeft: 8,
                            outlineStyle: 'none',
                        }}
                    />
                </View>
            </Animated.View>

            {viewMode === 'list' ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#2d253b"
                            colors={['#2d253b']}
                            progressBackgroundColor="#f2f4f7"
                        />
                    }
                >


                    <View style={styles.containerSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.sectionTitle}>Shops near you</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ShopsListScreen')}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
                            >
                                <Text style={{ textAlign: 'right', fontSize: 16, fontWeight: 'bold' }}>See all </Text>
                                <Ionicons name="chevron-forward-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ position: 'relative' }}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 3 }}
                            >
                                {shops.map((shop) => (
                                    <FCShop key={shop.id} shop={shop} />
                                ))}
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text>More</Text>
                                    <Ionicons name="chevron-forward-outline" size={24} color="black" />
                                </TouchableOpacity>
                            </ScrollView>

                        </View>
                    </View>

                    <View style={styles.containerSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.sectionTitle}>Products near you</Text>
                        </View>
                        <View style={styles.masonryContainer}>
                            <View style={styles.masonryColumn}>
                                {products
                                    .filter((_, i) => i % 2 === 0)
                                    .map((p, i) => (
                                        <FCProduct key={`left-${i}`} product={p} />
                                    ))}
                            </View>
                            <View style={styles.masonryColumn}>
                                {products
                                    .filter((_, i) => i % 2 === 1)
                                    .map((p, i) => (
                                        <FCProduct key={`right-${i}`} product={p} />
                                    ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                locationLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#2d253b" />
                        <Text style={{ marginTop: 10, color: '#2d253b' }}>Locating...</Text>
                    </View>
                ) : (
                    MapView && <MapView
                        style={styles.map}
                        clusterColor="#2d253b"
                        clusterTextColor="white"
                        renderCluster={(cluster) => {
                            const { id, geometry, onPress, properties } = cluster;
                            const pointCount = properties.point_count;
                            const coordinate = {
                                latitude: geometry.coordinates[1],
                                longitude: geometry.coordinates[0],
                            };
                            return (
                                <Marker
                                    key={`cluster-${id}`}
                                    coordinate={coordinate}
                                    onPress={onPress}
                                    zIndex={100} // Ensure clusters are above other markers
                                >
                                    <View style={styles.clusterMarker}>
                                        <Text style={styles.clusterText}>{pointCount}</Text>
                                    </View>
                                </Marker>
                            );
                        }}
                        region={userLocation || {
                            latitude: 31.6688,
                            longitude: 34.5718,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {/* User location marker */}
                        {userLocation && Marker && (
                            <Marker
                                coordinate={{
                                    latitude: userLocation.latitude,
                                    longitude: userLocation.longitude,
                                }}
                                title="My location"
                                description="You are here"
                                pinColor="#1ba5b8"
                                cluster={false}
                            />
                        )}

                        {/* Shop markers */}
                        {Marker && shops.map((shop) => (
                            <Marker
                                key={shop.id}
                                coordinate={{
                                    latitude: shop.latitude,
                                    longitude: shop.longitude,
                                }}
                                onPress={() => openShopPanel(shop)}
                            >
                                <View style={styles.customMarker}>
                                    <View style={[styles.markerCircle, { backgroundColor: 'white' }]}>
                                        <Image
                                            source={shop.logo || LogoApple}
                                            style={styles.markerImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                )
            )
            }

            {/* Shop preview panel */}
            {selectedShop && (
                <Animated.View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    transform: [{
                        translateY: panelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [300, 0],
                        }),
                    }],
                    backgroundColor: 'white',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    paddingBottom: 30,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 15,
                    zIndex: 30,
                }}>
                    {/* Drag handle */}
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd' }} />
                    </View>

                    {/* Header with close button */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2d253b' }}>{selectedShop.name}</Text>
                        <TouchableOpacity onPress={closeShopPanel} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    {/* Category */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <Ionicons name="pricetag" size={16} color="#FF6B6B" />
                        <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>{selectedShop.category}</Text>
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>{selectedShop.description}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            closeShopPanel();
                            navigation.navigate('ShopScreen', { shop: selectedShop });
                        }}
                        style={{
                            backgroundColor: '#2d253b',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>View shop</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f4f7',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d253bff',
    },
    containerSection: {
        margin: 10
    },
    masonryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
        padding: 10
    },
    masonryColumn: {
        flex: 1,
        gap: 0,
    },
    map: {
        flex: 1,
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerCircle: {
        width: 36,
        height: 36,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 15,
        overflow: 'hidden',
    },
    markerImage: {
        width: '100%',
        height: '100%',
    },
    clusterMarker: {
        width: 36,
        height: 36,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2d253b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    clusterText: {
        color: '#2d253b',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
