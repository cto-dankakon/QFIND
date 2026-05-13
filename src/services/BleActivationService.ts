import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LogService } from './LoggingService';

const BLE_STATE_KEY = '@qfind/ble_activation_state';

export interface BleActivationState {
  active: boolean;
  mode: 'stub';
  lastActivatedAt: string | null;
  sourceStoreId: string | null;
  reason: string | null;
  deviceUUID: string | null;
  note: string;
}

const DEFAULT_STATE: BleActivationState = {
  active: false,
  mode: 'stub',
  lastActivatedAt: null,
  sourceStoreId: null,
  reason: null,
  deviceUUID: null,
  note:
    'BLE advertising stub active. Android cannot be force-enabled silently in managed JS; user Bluetooth state must be ON for real scan visibility.',
};

async function persistState(state: BleActivationState): Promise<void> {
  try {
    await AsyncStorage.setItem(BLE_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    LogService.warn('BleActivationService', 'Failed to persist BLE state', {
      error: msg,
    });
  }
}

export async function getBleActivationState(): Promise<BleActivationState> {
  try {
    const raw = await AsyncStorage.getItem(BLE_STATE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    return JSON.parse(raw) as BleActivationState;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    LogService.warn('BleActivationService', 'Failed to read BLE state', {
      error: msg,
    });
    return DEFAULT_STATE;
  }
}

export async function activateBleEmission(input: {
  deviceUUID: string;
  sourceStoreId: string;
  reason: string;
}): Promise<BleActivationState> {
  const nextState: BleActivationState = {
    active: true,
    mode: 'stub',
    lastActivatedAt: new Date().toISOString(),
    sourceStoreId: input.sourceStoreId,
    reason: input.reason,
    deviceUUID: input.deviceUUID,
    note:
      Platform.OS === 'android'
        ? 'BLE intent flagged after geofence enter. For demo, ensure Bluetooth is manually ON on the smartphone to be detectable by a PC scanner.'
        : 'BLE stub available for debug only.',
  };

  await persistState(nextState);
  LogService.info('BleActivationService', 'BLE emission state activated (stub)', {
    source_store_id: input.sourceStoreId,
    reason: input.reason,
  });

  return nextState;
}

export async function deactivateBleEmission(reason = 'manual_stop'): Promise<void> {
  const current = await getBleActivationState();
  const nextState: BleActivationState = {
    ...current,
    active: false,
    reason,
  };
  await persistState(nextState);
  LogService.info('BleActivationService', 'BLE emission state deactivated (stub)', {
    reason,
  });
}
