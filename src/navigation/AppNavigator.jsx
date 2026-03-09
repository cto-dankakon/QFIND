import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopScreen from '../screens/ShopScreen';
import ProductScreen from '../screens/ProductScreen';
import ShopsListScreen from '../screens/ShopsListScreen';
import VisitedShopsScreen from '../screens/VisitedShopsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyShopsScreen from '../screens/MyShopsScreen';
import MyShopEditScreen from '../screens/MyShopEditScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');

function AnimatedScreen({ children, direction }) {
    const slideAnim = useRef(new Animated.Value(direction * width)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateX: slideAnim }] }}>
            {children}
        </Animated.View>
    );
}

function TabNavigator() {
    const prevIndexRef = useRef(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const directionRef = useRef(1);

    return (
        <Tab.Navigator
            initialRouteName="Browse"
            screenListeners={{
                state: (e) => {
                    const newIndex = e.data.state.index;
                    directionRef.current = newIndex > prevIndexRef.current ? 1 : -1;
                    prevIndexRef.current = newIndex;
                    setCurrentIndex(newIndex);
                },
            }}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Browse') {
                        iconName = focused ? 'compass' : 'compass-outline';
                    } else if (route.name === 'Favorites') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2d253bff',
                tabBarInactiveTintColor: '#64748B',
                tabBarStyle: {
                    backgroundColor: '#eceff3ff',
                    borderTopWidth: 0,
                    height: 70,
                    paddingBottom: 8,
                    paddingTop: 5,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            })}
        >
            <Tab.Screen name="Browse">
                {() => (
                    <AnimatedScreen direction={directionRef.current} key={`browse-${currentIndex}`}>
                        <BrowseScreen />
                    </AnimatedScreen>
                )}
            </Tab.Screen>
            <Tab.Screen name="Favorites">
                {() => (
                    <AnimatedScreen direction={directionRef.current} key={`favorites-${currentIndex}`}>
                        <FavoritesScreen />
                    </AnimatedScreen>
                )}
            </Tab.Screen>
            <Tab.Screen name="Profile">
                {() => (
                    <AnimatedScreen direction={directionRef.current} key={`profile-${currentIndex}`}>
                        <ProfileScreen />
                    </AnimatedScreen>
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen
                    name="ShopScreen"
                    component={ShopScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="ProductScreen"
                    component={ProductScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="ShopsListScreen"
                    component={ShopsListScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="VisitedShopsScreen"
                    component={VisitedShopsScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="SettingsScreen"
                    component={SettingsScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="MyShopsScreen"
                    component={MyShopsScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="MyShopEditScreen"
                    component={MyShopEditScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
