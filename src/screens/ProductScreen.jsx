import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Animated,
    Linking,
    Platform,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

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
        price: '1329 $',
        discountPrice: '899 $',
        store_infos: 'Apple Store',
        store_address: 'Shay St 39, Tel Aviv-Yafo',
        img: require('../../assets/iphone.jpeg'),
        distance: '255 m',
        inStock: true,
        screenSize: "6,9'",
        description: `Design & Display
• 6.9-inch Super Retina XDR display with ProMotion 2.0 technology.
• Chassis: New Grade 5 polished Titanium alloy, lighter and scratch-resistant.

Performance
• A19 Pro chip: 2nm process for record energy efficiency.
• Memory: 12 GB of RAM minimum.`,
        colors: COLOR_OPTIONS,
        storageOptions: STORAGE_OPTIONS,
    };

    const isOwner = route?.params?.isOwner || false;
    const currentSection = route?.params?.currentSection || '';
    const availableSections = route?.params?.availableSections || [];
    const onProductUpdate = route?.params?.onProductUpdate;

    // ─── Display state ───
    const [displayProduct, setDisplayProduct] = useState(product);

    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].id);
    const [selectedStorage, setSelectedStorage] = useState(STORAGE_OPTIONS[0]);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Build the images list
    const imagesList = (displayProduct.images && displayProduct.images.length > 0)
        ? displayProduct.images.map((uri) => (typeof uri === 'string' ? { uri } : uri))
        : [displayProduct.img];

    // ─── Edit modal state ───
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editOldPrice, setEditOldPrice] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImages, setEditImages] = useState([]);
    const [editSection, setEditSection] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [showNewSectionInput, setShowNewSectionInput] = useState(false);

    const openEditModal = () => {
        const priceNum = displayProduct.price ? displayProduct.price.replace(/[^0-9.]/g, '') : '';
        const discountPriceNum = displayProduct.discountPrice ? displayProduct.discountPrice.replace(/[^0-9.]/g, '') : '';

        setEditName(displayProduct.name || '');
        setEditPrice(priceNum);
        setEditOldPrice(discountPriceNum);
        setEditDescription(displayProduct.description || '');
        setEditSection(currentSection);
        setShowNewSectionInput(false);
        setNewSectionName('');

        const imgs = (displayProduct.images && displayProduct.images.length > 0)
            ? [...displayProduct.images]
            : [];
        setEditImages(imgs);

        setEditModalVisible(true);
    };

    const pickEditImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setEditImages((prev) => [...prev, result.assets[0].uri]);
        }
    };

    const removeEditImage = (index) => {
        setEditImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveEdit = () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Product name is required.');
            return;
        }
        if (!editPrice.trim()) {
            Alert.alert('Error', 'Product price is required.');
            return;
        }
        if (editImages.length === 0) {
            Alert.alert('Error', 'Please add at least one product photo.');
            return;
        }

        let section = editSection;
        if (showNewSectionInput) {
            if (!newSectionName.trim()) {
                Alert.alert('Error', 'Please enter a section name.');
                return;
            }
            section = newSectionName.trim();
        }
        if (!section) {
            Alert.alert('Error', 'Please select a section.');
            return;
        }

        const hasDiscount = editOldPrice.trim() !== '';
        const updatedData = {
            name: editName.trim(),
            price: `${editPrice.trim()} $`,
            discountPrice: hasDiscount ? `${editOldPrice.trim()} $` : null,
            description: editDescription.trim(),
            images: editImages,
            img: typeof editImages[0] === 'string' ? { uri: editImages[0] } : editImages[0],
        };

        setDisplayProduct((prev) => ({
            ...prev,
            name: updatedData.name,
            price: updatedData.price,
            discountPrice: updatedData.discountPrice,
            description: updatedData.description,
            images: updatedData.images,
            img: updatedData.img,
        }));

        if (onProductUpdate && displayProduct.id) {
            onProductUpdate(displayProduct.id, currentSection, section, updatedData);
        }

        setEditModalVisible(false);
        Alert.alert('Saved!', 'Product has been updated.');
    };

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
        const query = displayProduct.store_address || displayProduct.store_infos || '';
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
            default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        });
        Linking.openURL(url);
    };

    const handleGoToShop = () => {
        if (displayProduct.shopData) {
            navigation.navigate('ShopScreen', { shop: displayProduct.shopData });
        }
    };

    const descriptionText = displayProduct.description || '';
    const descriptionPreview = descriptionText.length > 300 ? descriptionText.substring(0, 300) + '...' : descriptionText;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Top bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
                        <Text style={styles.returnText}>Return</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFavorite} activeOpacity={0.7} style={styles.favButton}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={28} color={isFavorite ? '#1ba5b8' : '#1a1a1a'} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Product Image(s) Slider */}
                {imagesList.length > 1 ? (
                    <View style={styles.imageContainer}>
                        <FlatList
                            data={imagesList}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, index) => index.toString()}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setActiveImageIndex(index);
                            }}
                            renderItem={({ item }) => (
                                <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image source={item} style={styles.productImage} resizeMode="contain" />
                                </View>
                            )}
                        />
                        <View style={styles.paginationDots}>
                            {imagesList.map((_, index) => (
                                <View key={index} style={[styles.dot, activeImageIndex === index && styles.dotActive]} />
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.imageContainer}>
                        <Image source={imagesList[0]} style={styles.productImage} resizeMode="contain" />
                    </View>
                )}

                {/* Product Info */}
                <View style={styles.productInfoSection}>
                    <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName}>{displayProduct.name}</Text>
                            {displayProduct.inStock !== false && <Text style={styles.inStockText}>in stock</Text>}
                        </View>
                        <View style={styles.priceBlock}>
                            {displayProduct.discountPrice && <Text style={styles.oldPrice}>{displayProduct.price}</Text>}
                            <Text style={styles.currentPrice}>{displayProduct.discountPrice || displayProduct.price}</Text>
                        </View>
                    </View>

                    <View style={styles.colorRow}>
                        {(displayProduct.colors || COLOR_OPTIONS).map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                activeOpacity={1}
                                onPress={() => setSelectedColor(c.id)}
                                style={[styles.colorCircle, { backgroundColor: c.color }, selectedColor === c.id && styles.colorCircleSelected]}
                            />
                        ))}
                    </View>

                    <View style={styles.storageRow}>
                        <View style={styles.storageIcon}>
                            <Ionicons name="hardware-chip-outline" size={18} color="#666" />
                        </View>
                        {(displayProduct.storageOptions || STORAGE_OPTIONS).map((s) => (
                            <TouchableOpacity
                                key={s}
                                activeOpacity={0.7}
                                onPress={() => setSelectedStorage(s)}
                                style={[styles.storageChip, selectedStorage === s && styles.storageChipSelected]}
                            >
                                <Text style={[styles.storageChipText, selectedStorage === s && styles.storageChipTextSelected]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {displayProduct.screenSize && (
                        <View style={styles.screenSizeRow}>
                            <Ionicons name="phone-portrait-outline" size={16} color="#666" />
                            <Text style={styles.screenSizeText}>{displayProduct.screenSize}</Text>
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
                            <Text style={styles.seeMoreText}>{showFullDescription ? 'See less' : 'See more'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Shop Information */}
                <View style={styles.shopInfoSection}>
                    <Text style={styles.shopInfoTitle}>Shop information</Text>
                    <View style={styles.shopInfoCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>{displayProduct.store_infos || 'Shop'}</Text>
                            <Text style={styles.shopAddress}>{displayProduct.store_address || ''}</Text>
                        </View>
                        <TouchableOpacity onPress={handleFindShop} activeOpacity={0.7} style={styles.findUsBtn}>
                            <Ionicons name="location-sharp" size={24} color="#e74c3c" />
                            <Text style={styles.findUsText}>Find us !</Text>
                        </TouchableOpacity>
                        <View style={styles.distanceBlock}>
                            <Ionicons name="walk-outline" size={18} color="#666" />
                            <Text style={styles.distanceText}>{displayProduct.distance || '-- m'}</Text>
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreScroll}>
                        {MORE_FROM_SHOP.map((item) => (
                            <TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.moreCard}>
                                <Image source={item.img} style={styles.moreCardImage} resizeMode="cover" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={{ height: isOwner ? 80 : 30 }} />
            </ScrollView>

            {/* FAB */}
            {isOwner && (
                <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openEditModal}>
                    <Ionicons name="pencil" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {/* ─── Edit Product Modal ─── */}
            <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.editModalOverlay}>
                    <View style={styles.editModalContainer}>
                        <View style={styles.editModalHeader}>
                            <Text style={styles.editModalTitle}>Edit product</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.7}>
                                <Ionicons name="close" size={26} color="#2d253b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.editLabel}>Product name *</Text>
                            <TextInput style={styles.editInput} placeholder="Product name" placeholderTextColor="#aaa" value={editName} onChangeText={setEditName} />

                            <Text style={styles.editLabel}>Price *</Text>
                            <TextInput style={styles.editInput} placeholder="e.g. 1199" placeholderTextColor="#aaa" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />

                            <Text style={styles.editLabel}>Discount price</Text>
                            <TextInput style={styles.editInput} placeholder="Leave empty if no discount" placeholderTextColor="#aaa" value={editOldPrice} onChangeText={setEditOldPrice} keyboardType="numeric" />

                            <Text style={styles.editLabel}>Description</Text>
                            <TextInput
                                style={[styles.editInput, styles.editInputMultiline]}
                                placeholder="Product description"
                                placeholderTextColor="#aaa"
                                value={editDescription}
                                onChangeText={setEditDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <Text style={styles.editLabel}>Photos ({editImages.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editImagesRow}>
                                {editImages.map((img, index) => (
                                    <View key={index} style={styles.editImageThumb}>
                                        <Image source={typeof img === 'string' ? { uri: img } : img} style={styles.editImageThumbImg} resizeMode="cover" />
                                        <TouchableOpacity style={styles.editImageRemoveBtn} onPress={() => removeEditImage(index)} activeOpacity={0.7}>
                                            <Ionicons name="close-circle" size={22} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.editImageAddBtn} onPress={pickEditImage} activeOpacity={0.7}>
                                    <Ionicons name="add" size={28} color="#999" />
                                    <Text style={styles.editImageAddText}>Add</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <Text style={styles.editLabel}>Section *</Text>
                            <View style={styles.editSectionGrid}>
                                {availableSections.map((sec) => (
                                    <TouchableOpacity
                                        key={sec}
                                        activeOpacity={0.7}
                                        onPress={() => { setEditSection(sec); setShowNewSectionInput(false); }}
                                        style={[styles.editSectionChip, editSection === sec && !showNewSectionInput && styles.editSectionChipActive]}
                                    >
                                        <Text style={[styles.editSectionChipText, editSection === sec && !showNewSectionInput && styles.editSectionChipTextActive]}>{sec}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => { setShowNewSectionInput(true); setEditSection(''); }}
                                    style={[styles.editSectionChip, styles.editSectionChipNew, showNewSectionInput && styles.editSectionChipActive]}
                                >
                                    <Ionicons name="add" size={16} color={showNewSectionInput ? '#fff' : '#2d253b'} />
                                    <Text style={[styles.editSectionChipText, showNewSectionInput && styles.editSectionChipTextActive]}>New</Text>
                                </TouchableOpacity>
                            </View>
                            {showNewSectionInput && (
                                <TextInput
                                    style={[styles.editInput, { marginTop: 8 }]}
                                    placeholder="New section name"
                                    placeholderTextColor="#aaa"
                                    value={newSectionName}
                                    onChangeText={setNewSectionName}
                                    autoFocus
                                />
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <TouchableOpacity style={styles.editSaveBtn} activeOpacity={0.8} onPress={handleSaveEdit}>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.editSaveBtnText}>Save changes</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    // Top bar
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10, backgroundColor: '#fff' },
    returnButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    returnText: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
    favButton: { padding: 6 },

    // Product Image
    imageContainer: { width: '100%', height: width * 0.7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    productImage: { width: '80%', height: '100%' },
    paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 12, left: 0, right: 0, gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d0d0d0' },
    dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2d253b' },

    // Product Info
    productInfoSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: '#fff' },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    productName: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    inStockText: { fontSize: 12, color: '#888', marginTop: 2 },
    priceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    oldPrice: { fontSize: 14, color: '#e74c3c', textDecorationLine: 'line-through' },
    currentPrice: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },

    // Colors
    colorRow: { flexDirection: 'row', gap: 16, marginBottom: 18, paddingLeft: 4 },
    colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
    colorCircleSelected: { borderColor: '#1a1a1a', borderWidth: 3 },

    // Storage
    storageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    storageIcon: { marginRight: 2 },
    storageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
    storageChipSelected: { borderColor: '#1a1a1a', backgroundColor: '#f5f5f5' },
    storageChipText: { fontSize: 13, fontWeight: '600', color: '#888' },
    storageChipTextSelected: { color: '#1a1a1a' },

    // Screen size
    screenSizeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    screenSizeText: { fontSize: 14, color: '#666', fontWeight: '500' },

    // Description
    descriptionSection: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    descriptionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
    descriptionText: { fontSize: 14, color: '#444', lineHeight: 21 },
    seeMoreText: { fontSize: 14, fontWeight: '800', color: '#000', marginTop: 8 },

    // Shop info
    shopInfoSection: { backgroundColor: '#f0f0f0', paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
    shopInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
    shopInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    shopName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    shopAddress: { fontSize: 13, color: '#3c8ce7', marginTop: 2 },
    findUsBtn: { alignItems: 'center', gap: 4 },
    findUsText: { fontSize: 12, fontWeight: '600', color: '#e74c3c' },
    distanceBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    distanceText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },

    // More of the shop
    moreSection: { paddingTop: 16, paddingBottom: 10 },
    moreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    moreTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    shopLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    shopLinkText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    moreScroll: { paddingHorizontal: 16, gap: 12 },
    moreCard: { width: 130, height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8f8f8' },
    moreCardImage: { width: '100%', height: '100%' },

    // FAB
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2d253b', justifyContent: 'center', alignItems: 'center', shadowColor: '#2d253b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },

    // ─── Edit Modal ───
    editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    editModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d253b' },
    editLabel: { fontSize: 14, fontWeight: '600', color: '#2d253b', marginBottom: 6, marginTop: 12 },
    editInput: { backgroundColor: '#f2f4f7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2d253b' },
    editInputMultiline: { minHeight: 90, paddingTop: 12 },

    // Edit images
    editImagesRow: { flexDirection: 'row', marginTop: 4 },
    editImageThumb: { width: 80, height: 80, borderRadius: 12, marginRight: 10, overflow: 'hidden', position: 'relative' },
    editImageThumbImg: { width: '100%', height: '100%' },
    editImageRemoveBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 11 },
    editImageAddBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    editImageAddText: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 2 },

    // Edit sections
    editSectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    editSectionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f2f4f7', borderWidth: 1.5, borderColor: 'transparent' },
    editSectionChipActive: { backgroundColor: '#2d253b', borderColor: '#2d253b' },
    editSectionChipNew: { borderStyle: 'dashed', borderColor: '#ccc' },
    editSectionChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
    editSectionChipTextActive: { color: '#fff' },

    // Save button
    editSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2d253b', borderRadius: 14, paddingVertical: 14, marginTop: 12, gap: 8 },
    editSaveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
