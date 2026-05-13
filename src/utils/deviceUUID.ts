import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';

const DEVICE_UUID_KEY = '@qfind/device_uuid';

/**
 * Génère un UUID v4 sans dépendance externe
 * @returns UUID v4 généré
 */
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Récupère ou génère l'UUID unique du device
 * Lit depuis AsyncStorage, génère et stocke si absent
 * @returns Promise contenant l'UUID du device
 */
export async function getDeviceUUID(): Promise<string> {
  try {
    const storedUUID = await AsyncStorage.getItem(DEVICE_UUID_KEY);

    if (storedUUID) {
      console.log('[deviceUUID] UUID charge :', storedUUID);
      return storedUUID;
    }

    const newUUID = generateUUIDv4();
    await AsyncStorage.setItem(DEVICE_UUID_KEY, newUUID);
    console.log('[deviceUUID] UUID généré et stocké :', newUUID);

    return newUUID;
  } catch (error) {
    console.error('[deviceUUID] Erreur AsyncStorage :', error);
    // Fallback : retourne un UUID non persistant en cas d'erreur
    return generateUUIDv4();
  }
}

/**
 * Supprime l'UUID stocké dans AsyncStorage
 * Utile pour les tests
 * @returns Promise<void>
 */
export async function clearDeviceUUID(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_UUID_KEY);
    console.log('[deviceUUID] UUID supprimé.');
  } catch (error) {
    console.error('[deviceUUID] Erreur lors de la suppression de l\'UUID :', error);
  }
}

/**
 * S'assure que l'owner existe dans la table `owners` dès le lancement de l'app.
 * Crée l'entrée si absente, met à jour last_seen_at à chaque appel.
 */
export async function ensureOwnerExists(): Promise<void> {
  try {
    const uuid = await getDeviceUUID();

    const { error } = await supabase
      .from('owners')
      .upsert(
        { id: uuid, last_seen_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      // Ne pas crasher si Supabase n'est pas encore configuré
      console.warn('[deviceUUID] ensureOwnerExists — Supabase indisponible :', error.message);
      return;
    }

    console.log('[deviceUUID] Owner enregistré/mis à jour :', uuid);
  } catch (err: any) {
    console.warn('[deviceUUID] ensureOwnerExists — erreur ignorée :', err.message);
  }
}
