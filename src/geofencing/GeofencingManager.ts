import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getDeviceUUID } from '../utils/deviceUUID';
import { sendGeofenceEvent } from '../services/GeofenceEventService';
import {
  activateBleEmission,
  getBleActivationState,
} from '../services/BleActivationService';
import { buildGeofenceRegions } from './regions';
import { LogService } from '../services/LoggingService';
import { saveLastGeofenceEventDebug } from '../services/GeofenceEventService';

/** Nom de la tâche background — doit être unique dans l'app */
export const GEOFENCING_TASK = 'QFIND_GEOFENCING_TASK';

export type GeofenceEnterTrigger = 'os_geofence' | 'debug_manual';

/**
 * Callback unique de traitement d'entree geofence (Android POC).
 * Reutilise par la tache OS + le bouton de simulation de l'ecran debug.
 */
export async function onEnterGeofence(
  storeId: string,
  trigger: GeofenceEnterTrigger = 'os_geofence'
): Promise<void> {
  LogService.info('GeofencingManager', 'Geofence entered', {
    shop_id: storeId,
    trigger,
  });

  const uuid = await getDeviceUUID();
  const enteredAt = new Date().toISOString();
  const payload = {
    owner_uuid: uuid,
    shop_id: storeId,
    entered_at: enteredAt,
    platform: 'android' as const,
  };

  try {
    const sendResult = await sendGeofenceEvent(payload);

    await activateBleEmission({
      deviceUUID: uuid,
      sourceStoreId: storeId,
      reason: `geofence_enter:${trigger}`,
    });
    const bleState = await getBleActivationState();

    await saveLastGeofenceEventDebug({
      owner_uuid: uuid,
      shop_id: storeId,
      entered_at: enteredAt,
      platform: 'android',
      trigger,
      send_success: sendResult.success,
      queued: !sendResult.success,
      error: sendResult.error,
      ble_active: bleState.active,
      processed_at: new Date().toISOString(),
    });

    if (sendResult.success) {
      LogService.info('GeofencingManager', 'Event sent successfully', {
        shop_id: storeId,
      });
    } else {
      LogService.warn('GeofencingManager', 'Event queued for retry', {
        shop_id: storeId,
        error: sendResult.error,
      });
    }
  } catch (err: any) {
    LogService.error('GeofencingManager', 'Failed to process geofence event', {
      shop_id: storeId,
      error: err?.message,
      trigger,
    });

    await saveLastGeofenceEventDebug({
      owner_uuid: uuid,
      shop_id: storeId,
      entered_at: enteredAt,
      platform: 'android',
      trigger,
      send_success: false,
      queued: true,
      error: err?.message,
      ble_active: false,
      processed_at: new Date().toISOString(),
    });
  }
}

// ── Définition de la tâche (niveau module — obligatoire) ──────────────────
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }: any) => {
  if (error) {
    LogService.error('GeofencingManager', 'Background task error', {
      error: error?.message,
    });
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  if (eventType === Location.GeofencingEventType.Enter) {
    await onEnterGeofence(region.identifier, 'os_geofence');
  }
});

// ── Fonctions publiques ───────────────────────────────────────────────────

/** Démarre le géofencing sur toutes les zones des shops pilotes */
export async function startGeofencing(): Promise<void> {
  try {
    const regions = await buildGeofenceRegions();
    if (regions.length === 0) {
      LogService.warn('GeofencingManager', 'No regions available for geofencing');
      return;
    }
    await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    LogService.info('GeofencingManager', 'Geofencing started', {
      region_count: regions.length,
    });
  } catch (error) {
    LogService.error('GeofencingManager', 'Failed to start geofencing', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Arrête le géofencing s'il est actif */
export async function stopGeofencing(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      LogService.info('GeofencingManager', 'Geofencing stopped');
    }
  } catch (error) {
    LogService.error('GeofencingManager', 'Failed to stop geofencing', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Vérifie si le géofencing est actuellement actif */
export async function isGeofencingActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
}
