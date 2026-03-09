import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, TextInput, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FCShop from '../components/FCShop';
import FCProduct from '../components/FCProduct';

export default function FavoritesScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef(null);

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

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favorites</Text>
                <TouchableOpacity onPress={toggleSearch} activeOpacity={0.7} style={{
                    backgroundColor: '#eceff3ff',
                    borderRadius: 50,
                    padding: 10,

                    borderColor: '#2d253bff',
                    borderWidth: 1,
                }}>
                    <Ionicons name={isSearchOpen ? 'close' : 'search-outline'} size={24} color="#2d253bff" />
                </TouchableOpacity>
            </View>

            {/* Search dropdown */}
            <Animated.View style={{
                height: dropdownHeight,
                opacity: dropdownOpacity,
                overflow: 'hidden',
                backgroundColor: '#f2f4f7',
                paddingHorizontal: 16,
                justifyContent: 'center',
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
                        placeholder="Search favorites..."
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Favorite Shops */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="storefront-outline" size={22} color="#2d253b" />
                            <Text style={styles.sectionTitle}>Shops</Text>
                        </View>
                        <Text style={styles.sectionCount}>3 shops</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 3, paddingVertical: 5 }}
                    >
                        <FCShop initialFavorite={true} />
                        <FCShop initialFavorite={true} />
                        <FCShop initialFavorite={true} />
                    </ScrollView>
                </View>

                {/* Favorite Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="pricetag-outline" size={22} color="#2d253b" />
                            <Text style={styles.sectionTitle}>Products</Text>
                        </View>
                        <Text style={styles.sectionCount}>4 products</Text>
                    </View>

                    <View style={styles.productsGrid}>
                        <View style={styles.productColumn}>
                            <FCProduct initialFavorite={true} />
                            <FCProduct initialFavorite={true} />
                            <FCProduct initialFavorite={true} />
                        </View>
                        <View style={styles.productColumn}>
                            <FCProduct initialFavorite={true} />
                            <FCProduct initialFavorite={true} />
                            <FCProduct initialFavorite={true} />
                        </View>
                    </View>
                </View>
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
        paddingTop: 50,
        backgroundColor: '#f2f4f7',
        padding: 16,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    section: {
        margin: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d253b',
    },
    sectionCount: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    productsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 28,
        padding: 10,
    },
    productColumn: {
        flex: 1,
        gap: 28,
    },
});
