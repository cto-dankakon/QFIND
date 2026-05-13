import { supabase } from './supabaseClient';
import type { GeofenceEventPayload } from '../types/database';

// TODO Nathan : ajouter la colonne `platform text` à la table `shop_visits` dans Supabase :
// ALTER TABLE shop_visits ADD COLUMN IF NOT EXISTS platform text;

/**
 * DEPRECATED: Utiliser sendGeofenceEvent depuis '../services/GeofenceEventService' à la place.
 * Cette fonction n'a pas de retry logic ni de queue persistence.
 * 
 * Cette fonction est gardée pour compatibilité backwards, mais pour le POC géofencing,
 * utiliser GeofenceEventService.ts qui gère correctement les erreurs et les retries.
 */

/**
 * S'assure que l'owner existe dans la table `owners`.
 * Crée l'entrée si absente (upsert sur l'id).
 * Met à jour last_seen_at à chaque appel.
 */
async function upsertOwner(deviceUUID: string): Promise<void> {
  const { error } = await supabase
    .from('owners')
    .upsert(
      { id: deviceUUID, last_seen_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) throw new Error(`[qfindEvents] upsertOwner failed: ${error.message}`);
}

/**
 * DEPRECATED: Utiliser sendGeofenceEvent depuis '../services/GeofenceEventService'
 * 
 * Envoie un événement de géofencing (entrée dans un magasin).
 * 1. Upsert l'owner dans la table `owners`
 * 2. Insert dans la table `shop_visits`
 *
 * @param payload - contient owner_uuid, shop_id, entered_at, platform
 */
export async function sendGeofenceEvent(payload: GeofenceEventPayload): Promise<void> {
  console.warn(
    '[qfindEvents] sendGeofenceEvent DEPRECATED — use GeofenceEventService.sendGeofenceEvent instead'
  );
  console.log('[qfindEvents] Envoi event :', JSON.stringify(payload));

  // 1. S'assurer que l'owner existe
  await upsertOwner(payload.owner_uuid);

  // 2. Insérer la visite dans shop_visits
  const { error } = await supabase
    .from('shop_visits')
    .insert({
      owner_uuid: payload.owner_uuid,
      shop_id: payload.shop_id,
      entered_at: payload.entered_at,
      platform: payload.platform,
    });

  if (error) throw new Error(`[qfindEvents] insert shop_visits failed: ${error.message}`);

  console.log('[qfindEvents] shop_visit inséré pour shop_id :', payload.shop_id);
}

