import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PICKER_ITEM_HEIGHT = 44;
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Beta access code — change this to whatever code you give to testers
const BETA_ACCESS_CODE = 'QFIND2026';

// Simulated user shops (will be shared state later)
const INITIAL_SHOPS = [
    {
        id: '1',
        name: 'Apple Store',
        address: 'Shay St 39, Tel Aviv',
        phone: '+972-3-1234567',
        hours: '09:00 - 21:00',
        logo: null, // null means use default icon
        coverImage: null,
    },
];

export default function MyShopsScreen() {
    const navigation = useNavigation();
    const [shops, setShops] = useState(INITIAL_SHOPS);
    const [modalVisible, setModalVisible] = useState(false);
    const [newShopName, setNewShopName] = useState('');
    const [newShopAddress, setNewShopAddress] = useState('');
    const [newShopPhone, setNewShopPhone] = useState('');
    const [newShopOpenTime, setNewShopOpenTime] = useState('09:00');
    const [newShopCloseTime, setNewShopCloseTime] = useState('21:00');

    // Time picker state for creation modal
    const [createTimePickerVisible, setCreateTimePickerVisible] = useState(false);
    const [createTimePickerTarget, setCreateTimePickerTarget] = useState('open'); // 'open' or 'close'
    const [createTempHour, setCreateTempHour] = useState('09');
    const [createTempMinute, setCreateTempMinute] = useState('00');
    const createHourScrollRef = useRef(null);
    const createMinuteScrollRef = useRef(null);

    // Generate hours and minutes arrays
    const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    const openCreateTimePicker = (target) => {
        const time = target === 'open' ? newShopOpenTime : newShopCloseTime;
        const [h, m] = time.split(':');
        setCreateTempHour(h);
        setCreateTempMinute(m);
        setCreateTimePickerTarget(target);
        setCreateTimePickerVisible(true);

        // Auto-scroll to selected values after modal renders
        setTimeout(() => {
            const hourIndex = HOURS.indexOf(h);
            const minuteIndex = MINUTES.indexOf(m);
            if (createHourScrollRef.current && hourIndex >= 0) {
                createHourScrollRef.current.scrollTo({ y: hourIndex * PICKER_ITEM_HEIGHT, animated: false });
            }
            if (createMinuteScrollRef.current && minuteIndex >= 0) {
                createMinuteScrollRef.current.scrollTo({ y: minuteIndex * PICKER_ITEM_HEIGHT, animated: false });
            }
        }, 100);
    };

    const confirmCreateTimePicker = () => {
        const newTime = `${createTempHour}:${createTempMinute}`;
        if (createTimePickerTarget === 'open') {
            setNewShopOpenTime(newTime);
        } else {
            setNewShopCloseTime(newTime);
        }
        setCreateTimePickerVisible(false);
    };

    // Beta code gate state
    const [betaModalVisible, setBetaModalVisible] = useState(false);
    const [betaCode, setBetaCode] = useState('');
    const [betaError, setBetaError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleBetaCodeSubmit = () => {
        if (betaCode.trim().toUpperCase() === BETA_ACCESS_CODE) {
            // Code is correct — close beta modal and open shop creation modal
            setBetaModalVisible(false);
            setBetaCode('');
            setBetaError('');
            setModalVisible(true);
        } else {
            // Wrong code — show error + shake
            setBetaError('Invalid access code. Please try again.');
            triggerShake();
        }
    };

    const handleOpenBetaModal = () => {
        setBetaCode('');
        setBetaError('');
        setBetaModalVisible(true);
    };

    const handleAddShop = () => {
        if (!newShopName.trim()) {
            Alert.alert('Error', 'Please enter a shop name.');
            return;
        }
        const newShop = {
            id: Date.now().toString(),
            name: newShopName.trim(),
            address: newShopAddress.trim() || 'No address',
            phone: newShopPhone.trim() || '',
            hours: `${newShopOpenTime} - ${newShopCloseTime}`,
            openTime: newShopOpenTime,
            closeTime: newShopCloseTime,
            logo: null,
            coverImage: null,
        };
        setShops([...shops, newShop]);
        setNewShopName('');
        setNewShopAddress('');
        setNewShopPhone('');
        setNewShopOpenTime('09:00');
        setNewShopCloseTime('21:00');
        setModalVisible(false);
    };

    const handleUpdateShop = (updatedShop) => {
        setShops((prev) =>
            prev.map((s) => (s.id === updatedShop.id ? updatedShop : s))
        );
    };

    const handleShopPress = (shop) => {
        navigation.navigate('MyShopEditScreen', {
            shop,
            onUpdate: handleUpdateShop,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={24} color="#2d253b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Shops</Text>
                <TouchableOpacity
                    onPress={handleOpenBetaModal}
                    activeOpacity={0.7}
                    style={styles.addBtn}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Shop List */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {shops.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="storefront-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No shops yet</Text>
                        <Text style={styles.emptySubText}>
                            Tap the + button to add your first shop
                        </Text>
                    </View>
                ) : (
                    shops.map((shop) => (
                        <TouchableOpacity
                            key={shop.id}
                            style={styles.shopCard}
                            activeOpacity={0.7}
                            onPress={() => handleShopPress(shop)}
                        >
                            {/* Cover image preview */}
                            <View style={styles.shopCoverContainer}>
                                {shop.coverImage ? (
                                    <Image
                                        source={{ uri: shop.coverImage }}
                                        style={styles.shopCover}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.shopCoverPlaceholder}>
                                        <Ionicons name="image-outline" size={32} color="#ccc" />
                                    </View>
                                )}
                                {/* Logo overlay on cover */}
                                <View style={styles.shopLogoOverlay}>
                                    {shop.logo ? (
                                        <Image
                                            source={{ uri: shop.logo }}
                                            style={styles.shopLogoImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.shopLogoPlaceholder}>
                                            <Ionicons name="storefront" size={24} color="#2d253b" />
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Shop info */}
                            <View style={styles.shopInfo}>
                                <Text style={styles.shopName}>{shop.name}</Text>
                                <Text style={styles.shopAddress}>{shop.address}</Text>
                            </View>

                            {/* Arrow */}
                            <View style={styles.shopArrow}>
                                <Ionicons name="chevron-forward" size={20} color="#bbb" />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Add Shop Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add a new shop</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={26} color="#2d253b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Shop name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. My Cool Shop"
                                placeholderTextColor="#aaa"
                                value={newShopName}
                                onChangeText={setNewShopName}
                            />

                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 123 Main Street"
                                placeholderTextColor="#aaa"
                                value={newShopAddress}
                                onChangeText={setNewShopAddress}
                            />

                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. +972-3-1234567"
                                placeholderTextColor="#aaa"
                                value={newShopPhone}
                                onChangeText={setNewShopPhone}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>Opening hours</Text>
                            <View style={styles.createTimePickerRow}>
                                <TouchableOpacity
                                    style={styles.createTimePickerButton}
                                    onPress={() => openCreateTimePicker('open')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time-outline" size={18} color="#1ba5b8" />
                                    <View>
                                        <Text style={styles.createTimePickerLabel}>Opens at</Text>
                                        <Text style={styles.createTimePickerValue}>{newShopOpenTime}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.createTimePickerSeparator}>
                                    <Ionicons name="arrow-forward" size={18} color="#ccc" />
                                </View>

                                <TouchableOpacity
                                    style={styles.createTimePickerButton}
                                    onPress={() => openCreateTimePicker('close')}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="time" size={18} color="#e74c3c" />
                                    <View>
                                        <Text style={styles.createTimePickerLabel}>Closes at</Text>
                                        <Text style={styles.createTimePickerValue}>{newShopCloseTime}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.createBtn}
                            activeOpacity={0.8}
                            onPress={handleAddShop}
                        >
                            <Ionicons name="add-circle" size={22} color="#fff" />
                            <Text style={styles.createBtnText}>Create Shop</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Time Picker Modal for Shop Creation */}
            <Modal
                visible={createTimePickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCreateTimePickerVisible(false)}
            >
                <View style={styles.timeModalOverlay}>
                    <View style={styles.timeModalContent}>
                        <Text style={styles.timeModalTitle}>
                            {createTimePickerTarget === 'open' ? 'Opening time' : 'Closing time'}
                        </Text>

                        <View style={styles.pickerContainer}>
                            {/* Hours column */}
                            <View style={styles.pickerColumn}>
                                <Text style={styles.pickerColumnLabel}>Hour</Text>
                                <ScrollView
                                    ref={createHourScrollRef}
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {HOURS.map((h) => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[
                                                styles.pickerItem,
                                                createTempHour === h && styles.pickerItemSelected,
                                            ]}
                                            onPress={() => setCreateTempHour(h)}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    createTempHour === h && styles.pickerItemTextSelected,
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
                                    ref={createMinuteScrollRef}
                                    style={styles.pickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled
                                >
                                    {MINUTES.map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.pickerItem,
                                                createTempMinute === m && styles.pickerItemSelected,
                                            ]}
                                            onPress={() => setCreateTempMinute(m)}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    createTempMinute === m && styles.pickerItemTextSelected,
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
                        <View style={styles.timeModalPreview}>
                            <Ionicons name="time" size={20} color="#1ba5b8" />
                            <Text style={styles.timeModalPreviewText}>{createTempHour}:{createTempMinute}</Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.timeModalActions}>
                            <TouchableOpacity
                                style={styles.timeModalCancelBtn}
                                onPress={() => setCreateTimePickerVisible(false)}
                            >
                                <Text style={styles.timeModalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.timeModalConfirmBtn}
                                onPress={confirmCreateTimePicker}
                            >
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <Text style={styles.timeModalConfirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Beta Access Code Modal */}
            <Modal
                visible={betaModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setBetaModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.betaOverlay}
                >
                    <TouchableOpacity
                        style={styles.betaOverlayDismiss}
                        activeOpacity={1}
                        onPress={() => setBetaModalVisible(false)}
                    />
                    <Animated.View
                        style={[
                            styles.betaContainer,
                            { transform: [{ translateX: shakeAnim }] },
                        ]}
                    >
                        {/* Lock icon */}
                        <View style={styles.betaIconWrap}>
                            <Ionicons name="lock-closed" size={32} color="#fff" />
                        </View>

                        <Text style={styles.betaTitle}>Beta Access</Text>
                        <Text style={styles.betaSubtitle}>
                            Enter the code provided by the QFind team to unlock shop creation.
                        </Text>

                        <TextInput
                            style={[
                                styles.betaInput,
                                betaError ? styles.betaInputError : null,
                            ]}
                            placeholder="Enter access code"
                            placeholderTextColor="#999"
                            value={betaCode}
                            onChangeText={(text) => {
                                setBetaCode(text);
                                if (betaError) setBetaError('');
                            }}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleBetaCodeSubmit}
                        />

                        {betaError ? (
                            <View style={styles.betaErrorRow}>
                                <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                                <Text style={styles.betaErrorText}>{betaError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.betaSubmitBtn,
                                !betaCode.trim() && styles.betaSubmitBtnDisabled,
                            ]}
                            activeOpacity={0.8}
                            onPress={handleBetaCodeSubmit}
                            disabled={!betaCode.trim()}
                        >
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                            <Text style={styles.betaSubmitText}>Verify Code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.betaCancelBtn}
                            activeOpacity={0.7}
                            onPress={() => setBetaModalVisible(false)}
                        >
                            <Text style={styles.betaCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
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
    header: {
        backgroundColor: '#f2f4f7',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#e8ebf0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2d253b',
        marginLeft: 12,
    },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#2d253b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#999',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 6,
        textAlign: 'center',
    },

    // Shop Card
    shopCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    shopCoverContainer: {
        height: 120,
        backgroundColor: '#e8ebf0',
        position: 'relative',
    },
    shopCover: {
        width: '100%',
        height: '100%',
    },
    shopCoverPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e8ebf0',
    },
    shopLogoOverlay: {
        position: 'absolute',
        bottom: -24,
        left: 16,
        zIndex: 5,
    },
    shopLogoImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 3,
        borderColor: '#fff',
    },
    shopLogoPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#f2f4f7',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shopInfo: {
        paddingTop: 30,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    shopName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d253b',
    },
    shopAddress: {
        fontSize: 13,
        color: '#888',
        marginTop: 3,
    },
    shopArrow: {
        position: 'absolute',
        right: 16,
        bottom: 20,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d253b',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d253b',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#2d253b',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2d253b',
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 20,
        gap: 8,
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // Time Picker buttons in creation modal
    createTimePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    createTimePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    createTimePickerLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    createTimePickerValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d253b',
    },
    createTimePickerSeparator: {
        paddingHorizontal: 2,
    },

    // Time Picker Modal
    timeModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 20,
        width: SCREEN_WIDTH * 0.8,
        maxWidth: 340,
    },
    timeModalTitle: {
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
    timeModalPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 10,
        backgroundColor: '#f2f4f7',
        borderRadius: 12,
    },
    timeModalPreviewText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d253b',
    },
    timeModalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    timeModalCancelBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#f2f4f7',
    },
    timeModalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#888',
    },
    timeModalConfirmBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#1ba5b8',
    },
    timeModalConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    // Beta Access Code Modal
    betaOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    betaOverlayDismiss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    betaContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        width: '85%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    betaIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2d253b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    betaTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2d253b',
        marginBottom: 6,
    },
    betaSubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    betaInput: {
        width: '100%',
        backgroundColor: '#f2f4f7',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 17,
        color: '#2d253b',
        textAlign: 'center',
        letterSpacing: 3,
        fontWeight: '700',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    betaInputError: {
        borderColor: '#e74c3c',
        backgroundColor: '#fef2f2',
    },
    betaErrorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    betaErrorText: {
        fontSize: 13,
        color: '#e74c3c',
        fontWeight: '500',
    },
    betaSubmitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2d253b',
        borderRadius: 14,
        paddingVertical: 14,
        width: '100%',
        marginTop: 18,
        gap: 8,
    },
    betaSubmitBtnDisabled: {
        opacity: 0.4,
    },
    betaSubmitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    betaCancelBtn: {
        marginTop: 14,
        paddingVertical: 6,
    },
    betaCancelText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
});
