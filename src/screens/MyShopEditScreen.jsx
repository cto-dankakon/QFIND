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
    Alert,
    TextInput,
    Modal,
    FlatList,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 220;
const PICKER_ITEM_HEIGHT = 44;
const LOGO_SIZE = 70;
const EDIT_LOGO_SIZE = 90;

// Initial dummy product data
const INITIAL_PRODUCTS = {
    'Last discounts': [
        { id: '1', name: 'iPhone 16 Pro', distance: '255 m', price: '1199 $', discountPrice: '999 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 10 },
        { id: '2', name: 'MacBook Air', distance: '255 m', price: '1299 $', discountPrice: '1099 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 5 },
        { id: '3', name: 'AirPods Pro', distance: '255 m', price: '279 $', discountPrice: '219 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 20 },
        { id: '4', name: 'iPad Mini', distance: '255 m', price: '599 $', discountPrice: '499 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 8 },
    ],
    'Phones': [
        { id: '5', name: 'iPhone 16', distance: '255 m', price: '999 $', discountPrice: '899 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 15 },
        { id: '6', name: 'iPhone 16 Plus', distance: '255 m', price: '1099 $', discountPrice: null, img: require('../../assets/iphone.jpeg'), description: '', stock: 12 },
        { id: '7', name: 'iPhone SE', distance: '255 m', price: '429 $', discountPrice: null, img: require('../../assets/iphone.jpeg'), description: '', stock: 25 },
        { id: '8', name: 'iPhone 15', distance: '255 m', price: '899 $', discountPrice: '699 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 7 },
    ],
    'Tablets': [
        { id: '9', name: 'iPad Pro 13"', distance: '255 m', price: '1299 $', discountPrice: null, img: require('../../assets/iphone.jpeg'), description: '', stock: 4 },
        { id: '10', name: 'iPad Air', distance: '255 m', price: '699 $', discountPrice: '599 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 10 },
        { id: '11', name: 'iPad 10th Gen', distance: '255 m', price: '449 $', discountPrice: null, img: require('../../assets/iphone.jpeg'), description: '', stock: 18 },
        { id: '12', name: 'iPad Mini 7', distance: '255 m', price: '599 $', discountPrice: '499 $', img: require('../../assets/iphone.jpeg'), description: '', stock: 6 },
    ],
};



// ─── Product Card (same as ShopScreen) ───
function ProductCard({ product, shopName, shopAddress, currentSection, availableSections, onProductUpdate }) {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('ProductScreen', {
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                discountPrice: product.discountPrice,
                img: product.img,
                images: product.images || [],
                description: product.description || '',
                distance: product.distance,
                store_infos: shopName || 'Shop',
                store_address: shopAddress || '',
                inStock: true,
            },
            isOwner: true,
            currentSection,
            availableSections,
            onProductUpdate,
        });
    };

    return (
        <TouchableOpacity activeOpacity={0.85} style={styles.productCard} onPress={handlePress}>
            <View style={styles.productImageContainer}>
                <Image source={product.img} style={styles.productImage} resizeMode="cover" />
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.productMeta}>
                    <View style={styles.productPriceContainer}>
                        {product.discountPrice && (
                            <Text style={styles.productOldPrice}>{product.price}</Text>
                        )}
                        <Text style={styles.productPrice}>{product.discountPrice || product.price}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function CategorySection({ title, products, shopName, shopAddress, availableSections, onProductUpdate }) {
    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
            >
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        shopName={shopName}
                        shopAddress={shopAddress}
                        currentSection={title}
                        availableSections={availableSections}
                        onProductUpdate={onProductUpdate}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

// ─── Main Screen ───
export default function MyShopEditScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const shopParam = route.params?.shop;

    // ─── Products state ───
    const [shopProducts, setShopProducts] = useState(INITIAL_PRODUCTS);

    // ─── Add Product modal state ───
    const [addProductVisible, setAddProductVisible] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductDiscountPrice, setNewProductDiscountPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('');
    const [newProductSection, setNewProductSection] = useState('');
    const [newProductImages, setNewProductImages] = useState([]);
    const [showNewSectionInput, setShowNewSectionInput] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // ─── Saved (committed) shop data state ───
    const [shopName, setShopName] = useState(shopParam?.name || 'My Shop');
    const [shopAddress, setShopAddress] = useState(shopParam?.address || shopParam?.adress || '');
    const [shopPhone, setShopPhone] = useState(shopParam?.phone || '');
    const [openTime, setOpenTime] = useState(shopParam?.openTime || '09:00');
    const [closeTime, setCloseTime] = useState(shopParam?.closeTime || '21:00');
    const [logo, setLogo] = useState(shopParam?.logo || null);
    const [coverImage, setCoverImage] = useState(shopParam?.coverImage || null);

    // ─── Draft (edit mode) state — only committed on Save ───
    const [editName, setEditName] = useState(shopName);
    const [editAddress, setEditAddress] = useState(shopAddress);
    const [editPhone, setEditPhone] = useState(shopPhone);
    const [editOpenTime, setEditOpenTime] = useState(openTime);
    const [editCloseTime, setEditCloseTime] = useState(closeTime);
    const [editLogo, setEditLogo] = useState(logo);
    const [editCoverImage, setEditCoverImage] = useState(coverImage);

    // Time picker modal state
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState('open'); // 'open' or 'close'
    const [tempHour, setTempHour] = useState('09');
    const [tempMinute, setTempMinute] = useState('00');

    // Refs for auto-scroll in picker
    const hourScrollRef = useRef(null);
    const minuteScrollRef = useRef(null);

    // Generate hours and minutes arrays
    const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    // Helper: compute open status from any openTime/closeTime
    const computeIsOpen = useCallback((ot, ct) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = ot.split(':').map(Number);
        const [closeH, closeM] = ct.split(':').map(Number);
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        if (closeMinutes > openMinutes) {
            return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        } else if (closeMinutes < openMinutes) {
            return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
        return false;
    }, []);

    // Saved open status (for client view)
    const isOpen = computeIsOpen(openTime, closeTime);
    // Draft open status (for edit preview)
    const editIsOpen = computeIsOpen(editOpenTime, editCloseTime);

    // Initialize draft values when entering edit mode
    const enterEditMode = () => {
        setEditName(shopName);
        setEditAddress(shopAddress);
        setEditPhone(shopPhone);
        setEditOpenTime(openTime);
        setEditCloseTime(closeTime);
        setEditLogo(logo);
        setEditCoverImage(coverImage);
    };

    const openTimePicker = (target) => {
        const time = target === 'open' ? editOpenTime : editCloseTime;
        const [h, m] = time.split(':');
        setTempHour(h);
        setTempMinute(m);
        setTimePickerTarget(target);
        setTimePickerVisible(true);

        // Auto-scroll to selected values after modal renders
        setTimeout(() => {
            const hourIndex = HOURS.indexOf(h);
            const minuteIndex = MINUTES.indexOf(m);
            if (hourScrollRef.current && hourIndex >= 0) {
                hourScrollRef.current.scrollTo({ y: hourIndex * PICKER_ITEM_HEIGHT, animated: false });
            }
            if (minuteScrollRef.current && minuteIndex >= 0) {
                minuteScrollRef.current.scrollTo({ y: minuteIndex * PICKER_ITEM_HEIGHT, animated: false });
            }
        }, 100);
    };

    const confirmTimePicker = () => {
        const newTime = `${tempHour}:${tempMinute}`;
        if (timePickerTarget === 'open') {
            setEditOpenTime(newTime);
        } else {
            setEditCloseTime(newTime);
        }
        setTimePickerVisible(false);
    };

    // Edit mode toggle
    const [isEditing, setIsEditing] = useState(false);

    // Favorite animation
    const [isFavorite, setIsFavorite] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    // FAB animation
    const fabRotation = useRef(new Animated.Value(0)).current;

    const toggleFavorite = () => {
        if (!isFavorite) {
            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
            ]).start();
        }
        setIsFavorite((prev) => !prev);
    };

    const toggleEdit = () => {
        if (!isEditing) {
            enterEditMode();
        }
        Animated.timing(fabRotation, {
            toValue: isEditing ? 0 : 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
        setIsEditing((prev) => !prev);
    };

    const fabRotateInterp = fabRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const handleCall = () => {
        if (shopPhone) {
            Linking.openURL(`tel:${shopPhone}`);
        }
    };

    const handleFindUs = () => {
        const lat = shopParam?.latitude || 31.662121;
        const lng = shopParam?.longitude || 34.554262;
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

    // ─── Image Picker ───
    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: type === 'logo' ? [1, 1] : [16, 9],
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            if (type === 'logo') {
                setEditLogo(result.assets[0].uri);
            } else {
                setEditCoverImage(result.assets[0].uri);
            }
        }
    };

    const handleSave = () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Shop name is required.');
            return;
        }
        // Commit draft values to saved state
        setShopName(editName.trim());
        setShopAddress(editAddress.trim());
        setShopPhone(editPhone.trim());
        setOpenTime(editOpenTime);
        setCloseTime(editCloseTime);
        setLogo(editLogo);
        setCoverImage(editCoverImage);

        const updatedShop = {
            ...shopParam,
            name: editName.trim(),
            address: editAddress.trim(),
            phone: editPhone.trim(),
            openTime: editOpenTime,
            closeTime: editCloseTime,
            hours: `${editOpenTime} - ${editCloseTime}`,
            logo: editLogo,
            coverImage: editCoverImage,
        };
        if (route.params?.onUpdate) {
            route.params.onUpdate(updatedShop);
        }
        Alert.alert('Saved!', 'Your shop has been updated.', [
            { text: 'OK', onPress: () => setIsEditing(false) },
        ]);
    };

    // ─── Add Product Logic ───
    const resetAddProductForm = () => {
        setNewProductName('');
        setNewProductDescription('');
        setNewProductPrice('');
        setNewProductDiscountPrice('');
        setNewProductStock('');
        setNewProductSection('');
        setNewProductImages([]);
        setShowNewSectionInput(false);
        setNewSectionName('');
    };

    const pickProductImage = async () => {
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
            setNewProductImages((prev) => [...prev, result.assets[0].uri]);
        }
    };

    const removeProductImage = (index) => {
        setNewProductImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddProduct = () => {
        if (!newProductName.trim()) {
            Alert.alert('Error', 'Product name is required.');
            return;
        }
        if (!newProductPrice.trim()) {
            Alert.alert('Error', 'Product price is required.');
            return;
        }
        if (newProductImages.length === 0) {
            Alert.alert('Error', 'Please add at least one product photo.');
            return;
        }

        let section = newProductSection;
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

        const hasDiscount = newProductDiscountPrice.trim() !== '';
        const newProduct = {
            id: Date.now().toString(),
            name: newProductName.trim(),
            description: newProductDescription.trim(),
            price: `${newProductPrice.trim()} $`,
            discountPrice: hasDiscount ? `${newProductDiscountPrice.trim()} $` : null,
            img: { uri: newProductImages[0] },
            images: newProductImages,
            stock: parseInt(newProductStock) || 0,
            distance: '0 m',
        };

        setShopProducts((prev) => {
            const updated = { ...prev };
            if (updated[section]) {
                updated[section] = [...updated[section], newProduct];
            } else {
                updated[section] = [newProduct];
            }
            return updated;
        });

        resetAddProductForm();
        setAddProductVisible(false);
        Alert.alert('Success', `"${newProduct.name}" has been added to "${section}".`);
    };

    // ─── Update Product Logic ───
    const handleProductUpdate = (productId, oldSection, newSection, updatedData) => {
        setShopProducts((prev) => {
            const updated = {};
            // Copy all sections
            Object.keys(prev).forEach((key) => {
                updated[key] = [...prev[key]];
            });

            // Find and remove from old section
            let product = null;
            if (updated[oldSection]) {
                const idx = updated[oldSection].findIndex((p) => p.id === productId);
                if (idx >= 0) {
                    product = { ...updated[oldSection][idx], ...updatedData };
                    updated[oldSection].splice(idx, 1);
                    // Remove section if empty
                    if (updated[oldSection].length === 0) {
                        delete updated[oldSection];
                    }
                }
            }

            // Add to new section
            if (product) {
                if (updated[newSection]) {
                    updated[newSection] = [...(updated[newSection] || []), product];
                } else {
                    updated[newSection] = [product];
                }
            }

            return updated;
        });
    };

    // ──────────────────────────────────────
    // EDIT MODE VIEW
    // ──────────────────────────────────────
    if (isEditing) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Cover Image (tappable to change) */}
                    <TouchableOpacity
                        style={styles.headerImageContainer}
                        activeOpacity={0.85}
                        onPress={() => pickImage('cover')}
                    >
                        {editCoverImage ? (
                            <Image source={{ uri: editCoverImage }} style={styles.headerImage} resizeMode="cover" />
                        ) : (
                            <Image
                                source={require('../../assets/apple-store.jpeg')}
                                style={styles.headerImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.coverCameraBadge}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                        {/* Back button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={toggleEdit}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerOverlay} />
                    </TouchableOpacity>

                    {/* Edit Card */}
                    <View style={styles.editInfoCard}>
                        {/* Logo (tappable to change) */}
                        <View style={styles.editLogoSection}>
                            <TouchableOpacity
                                style={styles.editLogoContainer}
                                activeOpacity={0.85}
                                onPress={() => pickImage('logo')}
                            >
                                {editLogo ? (
                                    <Image source={{ uri: editLogo }} style={styles.editLogoImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.editLogoPlaceholder}>
                                        <Ionicons name="logo-apple" size={40} color="#000" />
                                    </View>
                                )}
                                <View style={styles.logoCameraBadge}>
                                    <Ionicons name="camera" size={14} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Edit Fields */}
                        <View style={styles.formSection}>
                            <Text style={styles.formSectionTitle}>Shop Information</Text>

                            <Text style={styles.inputLabel}>Shop name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter shop name"
                                placeholderTextColor="#aaa"
                                value={editName}
                                onChangeText={setEditName}
                            />

                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter address"
                                placeholderTextColor="#aaa"
                                value={editAddress}
                                onChangeText={setEditAddress}
                            />

                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                placeholderTextColor="#aaa"
                                value={editPhone}
                                onChangeText={setEditPhone}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>Opening hours</Text>
                            <View style={styles.timePickerRow}>
                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => openTimePicker('open')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={18} color="#1ba5b8" />
                                    <View>
                                        <Text style={styles.timePickerLabel}>Opens at</Text>
                                        <Text style={styles.timePickerValue}>{editOpenTime}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.timePickerSeparator}>
                                    <Ionicons name="arrow-forward" size={18} color="#ccc" />
                                </View>

                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => openTimePicker('close')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time" size={18} color="#e74c3c" />
                                    <View>
                                        <Text style={styles.timePickerLabel}>Closes at</Text>
                                        <Text style={styles.timePickerValue}>{editCloseTime}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Open/Closed status preview (using draft values) */}
                            <View style={[styles.statusPreview, { backgroundColor: editIsOpen ? '#e8f8f0' : '#fde8e8' }]}>
                                <View style={[styles.statusDot, { backgroundColor: editIsOpen ? '#27ae60' : '#e74c3c' }]} />
                                <Text style={[styles.statusPreviewText, { color: editIsOpen ? '#27ae60' : '#e74c3c' }]}>
                                    {editIsOpen ? 'Currently open' : 'Currently closed'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Time Picker Modal */}
                <Modal
                    visible={timePickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setTimePickerVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {timePickerTarget === 'open' ? 'Opening time' : 'Closing time'}
                            </Text>

                            <View style={styles.pickerContainer}>
                                {/* Hours column */}
                                <View style={styles.pickerColumn}>
                                    <Text style={styles.pickerColumnLabel}>Hour</Text>
                                    <ScrollView
                                        ref={hourScrollRef}
                                        style={styles.pickerScroll}
                                        showsVerticalScrollIndicator={false}
                                        nestedScrollEnabled
                                    >
                                        {HOURS.map((h) => (
                                            <TouchableOpacity
                                                key={h}
                                                style={[
                                                    styles.pickerItem,
                                                    tempHour === h && styles.pickerItemSelected,
                                                ]}
                                                onPress={() => setTempHour(h)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pickerItemText,
                                                        tempHour === h && styles.pickerItemTextSelected,
                                                    ]}
                                                >
                                                    {h}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Separator */}
                                <Text style={styles.pickerColon}>:</Text>

                                {/* Minutes column */}
                                <View style={styles.pickerColumn}>
                                    <Text style={styles.pickerColumnLabel}>Min</Text>
                                    <ScrollView
                                        ref={minuteScrollRef}
                                        style={styles.pickerScroll}
                                        showsVerticalScrollIndicator={false}
                                        nestedScrollEnabled
                                    >
                                        {MINUTES.map((m) => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[
                                                    styles.pickerItem,
                                                    tempMinute === m && styles.pickerItemSelected,
                                                ]}
                                                onPress={() => setTempMinute(m)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pickerItemText,
                                                        tempMinute === m && styles.pickerItemTextSelected,
                                                    ]}
                                                >
                                                    {m}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Preview */}
                            <View style={styles.modalPreview}>
                                <Ionicons name="time" size={20} color="#1ba5b8" />
                                <Text style={styles.modalPreviewText}>{tempHour}:{tempMinute}</Text>
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setTimePickerVisible(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalConfirmBtn}
                                    onPress={confirmTimePicker}
                                >
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                    <Text style={styles.modalConfirmText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                {/* Save Button */}
                <View style={styles.saveContainer}>
                    <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveBtnText}>Save changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ──────────────────────────────────────
    // CLIENT VIEW (default)
    // ──────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header Image — tap to go to edit mode */}
                <TouchableOpacity
                    style={styles.headerImageContainer}
                    activeOpacity={0.9}
                    onPress={toggleEdit}
                >
                    {coverImage ? (
                        <Image source={{ uri: coverImage }} style={styles.headerImage} resizeMode="cover" />
                    ) : (
                        <Image
                            source={require('../../assets/apple-store.jpeg')}
                            style={styles.headerImage}
                            resizeMode="cover"
                        />
                    )}
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

                    {/* Edit hint badge on header */}
                    <View style={styles.editHintBadge}>
                        <Ionicons name="pencil" size={14} color="#fff" />
                        <Text style={styles.editHintText}>Edit</Text>
                    </View>

                    <View style={styles.headerOverlay} />
                </TouchableOpacity>

                {/* Shop Info Card */}
                <View style={styles.infoCard}>
                    {/* Logo circle */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            {logo ? (
                                <Image source={{ uri: logo }} style={styles.logoCircleImage} resizeMode="cover" />
                            ) : (
                                <Ionicons name="logo-apple" size={40} color="#000" />
                            )}
                        </View>
                    </View>

                    {/* Shop name + address */}
                    <View style={styles.shopHeader}>
                        <View style={styles.shopNameBlock}>
                            <Text style={styles.shopName}>{shopName}</Text>
                            <Text style={styles.shopAddress}>{shopAddress}</Text>
                        </View>
                    </View>

                    {/* Status */}
                    <View style={[styles.clientStatusBadge, { backgroundColor: isOpen ? '#e8f8f0' : '#fde8e8' }]}>
                        <View style={[styles.statusDot, { backgroundColor: isOpen ? '#27ae60' : '#e74c3c' }]} />
                        <Text style={[styles.clientStatusText, { color: isOpen ? '#27ae60' : '#e74c3c' }]}>
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
                    {Object.entries(shopProducts).map(([category, products]) => (
                        <CategorySection
                            key={category}
                            title={category}
                            products={products}
                            shopName={shopName}
                            shopAddress={shopAddress}
                            availableSections={Object.keys(shopProducts)}
                            onProductUpdate={handleProductUpdate}
                        />
                    ))}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* FAB Add Product */}
            <TouchableOpacity
                style={styles.addProductFab}
                activeOpacity={0.8}
                onPress={() => setAddProductVisible(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Add Product Modal */}
            <Modal
                visible={addProductVisible}
                animationType="slide"
                onRequestClose={() => { resetAddProductForm(); setAddProductVisible(false); }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.addProductContainer}>
                        {/* Header */}
                        <View style={styles.addProductHeader}>
                            <TouchableOpacity
                                onPress={() => { resetAddProductForm(); setAddProductVisible(false); }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={26} color="#2d253b" />
                            </TouchableOpacity>
                            <Text style={styles.addProductTitle}>Add Product</Text>
                            <View style={{ width: 26 }} />
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        >
                            {/* Product Photos */}
                            <Text style={styles.addProductLabel}>Photos</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.addProductImagesRow}
                            >
                                {newProductImages.map((uri, index) => (
                                    <View key={index} style={styles.addProductImageWrapper}>
                                        <Image source={{ uri }} style={styles.addProductImage} />
                                        <TouchableOpacity
                                            style={styles.addProductImageRemove}
                                            onPress={() => removeProductImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={22} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    style={styles.addProductImageAdd}
                                    onPress={pickProductImage}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="camera-outline" size={28} color="#999" />
                                    <Text style={styles.addProductImageAddText}>Add photo</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Product Name */}
                            <Text style={styles.addProductLabel}>Product name *</Text>
                            <TextInput
                                style={styles.addProductInput}
                                placeholder="e.g. iPhone 16 Pro"
                                placeholderTextColor="#bbb"
                                value={newProductName}
                                onChangeText={setNewProductName}
                            />

                            {/* Description */}
                            <Text style={styles.addProductLabel}>Description</Text>
                            <TextInput
                                style={[styles.addProductInput, styles.addProductTextArea]}
                                placeholder="Describe your product..."
                                placeholderTextColor="#bbb"
                                value={newProductDescription}
                                onChangeText={setNewProductDescription}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            {/* Price Row */}
                            <View style={styles.addProductPriceRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.addProductLabel, { paddingHorizontal: 0 }]}>Price ($) *</Text>
                                    <TextInput
                                        style={[styles.addProductInput, { marginHorizontal: 0 }]}
                                        placeholder="1199"
                                        placeholderTextColor="#bbb"
                                        value={newProductPrice}
                                        onChangeText={setNewProductPrice}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.addProductLabel, { paddingHorizontal: 0 }]}>Discount price ($)</Text>
                                    <TextInput
                                        style={[styles.addProductInput, { marginHorizontal: 0 }]}
                                        placeholder="999"
                                        placeholderTextColor="#bbb"
                                        value={newProductDiscountPrice}
                                        onChangeText={setNewProductDiscountPrice}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Stock */}
                            <Text style={styles.addProductLabel}>Stock quantity</Text>
                            <TextInput
                                style={styles.addProductInput}
                                placeholder="e.g. 10"
                                placeholderTextColor="#bbb"
                                value={newProductStock}
                                onChangeText={setNewProductStock}
                                keyboardType="numeric"
                            />

                            {/* Section Picker */}
                            <Text style={styles.addProductLabel}>Section *</Text>
                            <View style={styles.sectionPickerContainer}>
                                {Object.keys(shopProducts).map((section) => (
                                    <TouchableOpacity
                                        key={section}
                                        style={[
                                            styles.sectionChip,
                                            newProductSection === section && !showNewSectionInput && styles.sectionChipSelected,
                                        ]}
                                        onPress={() => {
                                            setNewProductSection(section);
                                            setShowNewSectionInput(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.sectionChipText,
                                                newProductSection === section && !showNewSectionInput && styles.sectionChipTextSelected,
                                            ]}
                                        >
                                            {section}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[
                                        styles.sectionChip,
                                        styles.sectionChipNew,
                                        showNewSectionInput && styles.sectionChipSelected,
                                    ]}
                                    onPress={() => {
                                        setShowNewSectionInput(true);
                                        setNewProductSection('');
                                    }}
                                >
                                    <Ionicons name="add" size={16} color={showNewSectionInput ? '#fff' : '#1ba5b8'} />
                                    <Text style={[
                                        styles.sectionChipText,
                                        { color: showNewSectionInput ? '#fff' : '#1ba5b8' },
                                    ]}>New</Text>
                                </TouchableOpacity>
                            </View>

                            {showNewSectionInput && (
                                <TextInput
                                    style={[styles.addProductInput, { marginTop: 8 }]}
                                    placeholder="New section name"
                                    placeholderTextColor="#bbb"
                                    value={newSectionName}
                                    onChangeText={setNewSectionName}
                                    autoFocus
                                />
                            )}
                        </ScrollView>

                        {/* Add Button */}
                        <View style={styles.addProductFooter}>
                            <TouchableOpacity
                                style={styles.addProductBtn}
                                activeOpacity={0.8}
                                onPress={handleAddProduct}
                            >
                                <Ionicons name="bag-add" size={22} color="#fff" />
                                <Text style={styles.addProductBtnText}>Add product</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f4f7',
    },

    // ─── Header Image ───
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
    editHintBadge: {
        position: 'absolute',
        bottom: 70,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 5,
        zIndex: 10,
    },
    editHintText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // ─── Info Card (client view) ───
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
        overflow: 'hidden',
    },
    logoCircleImage: {
        width: '100%',
        height: '100%',
    },
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
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
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

    // ─── Products ───
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
        justifyContent: 'flex-end',
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

    // ─── FAB ───
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

    // ─── Edit Mode Styles ───
    editCoverPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d5d9e0',
    },
    editCoverPlaceholderText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    coverCameraBadge: {
        position: 'absolute',
        bottom: 30,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    editInfoCard: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    editLogoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    editLogoContainer: {
        position: 'relative',
    },
    editLogoImage: {
        width: EDIT_LOGO_SIZE,
        height: EDIT_LOGO_SIZE,
        borderRadius: EDIT_LOGO_SIZE / 2,
        borderWidth: 3,
        borderColor: '#f0f0f0',
    },
    editLogoPlaceholder: {
        width: EDIT_LOGO_SIZE,
        height: EDIT_LOGO_SIZE,
        borderRadius: EDIT_LOGO_SIZE / 2,
        backgroundColor: '#f2f4f7',
        borderWidth: 3,
        borderColor: '#e8ebf0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#2d253b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    formSection: {
        marginTop: 4,
    },
    formSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d253b',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d253b',
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: '#2d253b',
    },
    saveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 12,
        backgroundColor: 'rgba(242,244,247,0.95)',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2d253b',
        borderRadius: 14,
        paddingVertical: 15,
        gap: 8,
        shadowColor: '#2d253b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // ─── Time Picker Styles ───
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    timePickerLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    timePickerValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d253b',
    },
    timePickerSeparator: {
        paddingHorizontal: 2,
    },
    statusPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusPreviewText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // ─── Client Status Badge ───
    clientStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    clientStatusText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // ─── Time Picker Modal ───
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 20,
        width: width * 0.8,
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d253b',
        textAlign: 'center',
        marginBottom: 20,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    pickerColumn: {
        alignItems: 'center',
        flex: 1,
    },
    pickerColumnLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pickerScroll: {
        height: 180,
    },
    pickerItem: {
        height: PICKER_ITEM_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    pickerItemSelected: {
        backgroundColor: '#1ba5b8',
    },
    pickerItemText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#999',
    },
    pickerItemTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    pickerColon: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d253b',
        marginTop: 20,
    },
    modalPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 10,
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
    },
    modalPreviewText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d253b',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalCancelBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#f2f4f7',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#888',
    },
    modalConfirmBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#1ba5b8',
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    // ─── Add Product FAB ───
    addProductFab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1ba5b8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1ba5b8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
    },

    // ─── Add Product Modal ───
    addProductContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addProductHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 44,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    addProductTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d253b',
    },
    addProductLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d253b',
        marginBottom: 6,
        marginTop: 18,
        paddingHorizontal: 20,
    },
    addProductInput: {
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: '#2d253b',
        marginHorizontal: 20,
    },
    addProductTextArea: {
        minHeight: 80,
        paddingTop: 13,
    },
    addProductPriceRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 0,
    },
    addProductImagesRow: {
        paddingHorizontal: 16,
        gap: 10,
        paddingVertical: 4,
    },
    addProductImageWrapper: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    addProductImage: {
        width: '100%',
        height: '100%',
    },
    addProductImageRemove: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#fff',
        borderRadius: 11,
    },
    addProductImageAdd: {
        width: 90,
        height: 90,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    addProductImageAddText: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },

    // ─── Section Picker ───
    sectionPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 8,
    },
    sectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f2f4f7',
    },
    sectionChipSelected: {
        backgroundColor: '#1ba5b8',
    },
    sectionChipNew: {
        borderWidth: 1.5,
        borderColor: '#1ba5b8',
        backgroundColor: 'transparent',
    },
    sectionChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    sectionChipTextSelected: {
        color: '#fff',
    },

    // ─── Add Product Footer ───
    addProductFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    addProductBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1ba5b8',
        borderRadius: 14,
        paddingVertical: 15,
        gap: 8,
        shadowColor: '#1ba5b8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addProductBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
