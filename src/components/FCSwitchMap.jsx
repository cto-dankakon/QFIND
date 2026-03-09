import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { View, TouchableOpacity } from 'react-native'

export default function FCSwitchMap({ mode = 'list', onModeChange }) {

    const activeColor = '#2d253b'
    const inactiveColor = 'transparent'
    const activeIcon = '#ffffff'
    const inactiveIcon = '#2d253b'

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: '#dfe3e8',
            borderRadius: 10,
            padding: 3,
            borderColor: '#2d253bff',
            borderWidth: 1,
        }}>
            <TouchableOpacity
                onPress={() => onModeChange?.('list')}
                activeOpacity={0.7}
                style={{
                    backgroundColor: mode === 'list' ? activeColor : inactiveColor,
                    borderRadius: 8,
                    padding: 8,
                }}
            >
                <Ionicons name="list" size={22} color={mode === 'list' ? activeIcon : inactiveIcon} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => onModeChange?.('map')}
                activeOpacity={0.7}
                style={{
                    backgroundColor: mode === 'map' ? activeColor : inactiveColor,
                    borderRadius: 8,
                    padding: 8,
                }}
            >
                <Ionicons name="map-outline" size={22} color={mode === 'map' ? activeIcon : inactiveIcon} />
            </TouchableOpacity>
        </View>
    )
}

