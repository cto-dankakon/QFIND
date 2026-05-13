import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import {
  isGeofencingActive,
  startGeofencing,
  stopGeofencing,
} from '../geofencing/GeofencingManager';
import { LogService } from '../services/LoggingService';

export type GeofencingStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

/**
 * Hook pour gerer le cycle de vie du geofencing dans l'app QFind.
 * Gere les permissions foreground + background (Android) et demarre/arrete le service.
 * 
 * Améliorations:
 * - Meilleure gestion des rejets de permissions
 * - Affichage de rationale dialogs (Android 12+)
 * - Logging structuré via LoggingService
 * - Graceful degradation si permissions refusées
 */
export function useGeofencing() {
  const [status, setStatus] = useState<GeofencingStatus>('idle');

  /**
   * Demande les permissions de localisation et demarre le geofencing.
   * A appeler au lancement de l'app ou apres action explicite de l'utilisateur.
   */
  async function requestPermissionsAndStart(): Promise<void> {
    setStatus('requesting');
    LogService.info('useGeofencing', 'Starting geofencing setup');

    try {
      // 1. Demander la permission FOREGROUND
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        LogService.warn('useGeofencing', 'Foreground location permission denied');
        
        // Afficher une rationale dialog
        if (Platform.OS === 'android') {
          Alert.alert(
            'Permission de localisation',
            'QFind a besoin d\'accéder à votre localisation pour détecter les magasins pilotes.',
            [
              {
                text: 'Ouvrir paramètres',
                onPress: async () => {
                  await Location.requestForegroundPermissionsAsync();
                },
              },
              { text: 'Ignorer', onPress: () => {} },
            ]
          );
        }
        
        setStatus('denied');
        return;
      }

      LogService.info('useGeofencing', 'Foreground permission granted');

      // 2. Si Platform.OS !== 'web', demander la permission BACKGROUND
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus === 'granted') {
          LogService.info('useGeofencing', 'Background permission granted');
          await startGeofencing();
          setStatus('active');
          console.log('[useGeofencing] ✅ Geofencing ACTIF (mode background).');
        } else {
          // Pour le POC Android, on exige la permission background
          LogService.warn(
            'useGeofencing',
            'Background permission denied, geofencing not started'
          );

          // Afficher info à l'utilisateur
          Alert.alert(
            'Permission requise',
            'Pour le POC geofencing Android (app en background ecran verrouille), activez la localisation en arriere-plan puis relancez le module.',
            [{ text: 'OK' }]
          );

          setStatus('denied');
        }
        return;
      }

      // 3. Si Platform.OS === 'web'
      LogService.warn('useGeofencing', 'Geofencing not supported on web');
      setStatus('denied');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      LogService.error('useGeofencing', 'Error during geofencing setup', {
        error: message,
      });
      setStatus('error');
    }
  }

  async function stop(): Promise<void> {
    await stopGeofencing();
    setStatus('idle');
    LogService.info('useGeofencing', 'Geofencing stopped');
  }

  useEffect(() => {
    void isGeofencingActive().then((active) => {
      if (active) {
        setStatus('active');
        LogService.info('useGeofencing', 'Geofencing active on startup');
      }
    });
  }, []);

  return { status, requestPermissionsAndStart, stop };
}