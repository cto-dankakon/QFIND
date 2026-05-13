/**
 * Service d'envoi des événements geofencing vers Supabase.
 * Gère le retry, la validation des données, et la persistence en queue.
 * 
 * Flow:
 * 1. Événement geofence arrive via TaskManager
 * 2. GeofenceEventService.sendEvent() l'enqueue
 * 3. Si succès → supprimé de queue
 * 4. Si erreur → reste en queue et retried avec exponential backoff
 * 5. En foreground, on peut trigger un flush de la queue
 */

import { supabase } from '../api/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueEvent, markEventAsAttempted, getEventsToRetry } from './EventQueue';
import type { GeofenceEventPayload } from '../types/database';
import { validateGeofenceEventPayload } from '../types/validation';

const LAST_GEOFENCE_EVENT_DEBUG_KEY = '@qfind/last_geofence_event_debug';

export interface LastGeofenceEventDebug {
  owner_uuid: string;
  shop_id: string;
  entered_at: string;
  platform: 'android' | 'ios';
  trigger: 'os_geofence' | 'debug_manual';
  send_success: boolean;
  queued: boolean;
  error?: string;
  ble_active: boolean;
  processed_at: string;
}

export interface SendEventResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export async function saveLastGeofenceEventDebug(
  event: LastGeofenceEventDebug
): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_GEOFENCE_EVENT_DEBUG_KEY, JSON.stringify(event));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[GeofenceEventService] Failed to persist last debug event:', msg);
  }
}

export async function getLastGeofenceEventDebug(): Promise<LastGeofenceEventDebug | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_GEOFENCE_EVENT_DEBUG_KEY);
    return raw ? (JSON.parse(raw) as LastGeofenceEventDebug) : null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[GeofenceEventService] Failed to read last debug event:', msg);
    return null;
  }
}

/**
 * Envoie un événement geofence vers Supabase.
 * Si succès → retourne success=true
 * Si erreur → event est enqueued pour retry + retourne success=false
 * 
 * Cette fonction est appelée:
 * 1. Depuis le background task (GeofencingManager.ts)
 * 2. Depuis la queue de retry (en background ou foreground)
 */
export async function sendGeofenceEvent(
  payload: GeofenceEventPayload
): Promise<SendEventResult> {
  console.log('[GeofenceEventService] Envoi event:', JSON.stringify(payload));

  try {
    // 1. Valider le payload
    const validatedPayload = validateGeofenceEventPayload(payload);

    // 2. Envoyer vers Supabase
    await sendToSupabase(validatedPayload);

    console.log('[GeofenceEventService] ✅ Event envoyé avec succès:', payload.shop_id);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[GeofenceEventService] ❌ Erreur envoi:', errorMsg);

    // 3. Enqueue pour retry
    try {
      await enqueueEvent(payload);
      console.log('[GeofenceEventService] Event enqueued pour retry.');
      return {
        success: false,
        error: `Event enqueued (${errorMsg})`,
      };
    } catch (queueError) {
      const queueMsg =
        queueError instanceof Error ? queueError.message : String(queueError);
      console.error('[GeofenceEventService] ❌ Impossible d\'enqueue event:', queueMsg);
      return {
        success: false,
        error: `Queue failure: ${queueMsg}`,
      };
    }
  }
}

/**
 * Envoie un événement qui est déjà dans la queue de retry.
 * Similaire à sendGeofenceEvent mais met à jour la queue aprés.
 */
export async function retryQueuedEvent(
  eventId: string,
  payload: GeofenceEventPayload
): Promise<SendEventResult> {
  console.log('[GeofenceEventService] Retry event:', eventId);

  try {
    const validatedPayload = validateGeofenceEventPayload(payload);
    await sendToSupabase(validatedPayload);

    // Succès → supprimer de queue
    await markEventAsAttempted(eventId, true);
    return { success: true, eventId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[GeofenceEventService] ❌ Retry échoué:', errorMsg);

    // Échec → garder en queue, increment attempt count
    await markEventAsAttempted(eventId, false);
    return {
      success: false,
      eventId,
      error: errorMsg,
    };
  }
}

/**
 * Envoie directement vers Supabase.
 * Throws si erreur (caller gère la logique d'enqueue/retry).
 * 
 * Private — appelée seulement depuis sendGeofenceEvent/retryQueuedEvent
 */
async function sendToSupabase(payload: GeofenceEventPayload): Promise<void> {
  // 1. Upsert owner
  const { error: ownerError } = await supabase
    .from('owners')
    .upsert(
      { id: payload.owner_uuid, last_seen_at: payload.entered_at },
      { onConflict: 'id' }
    );

  if (ownerError) {
    throw new Error(`Upsert owner failed: ${ownerError.message}`);
  }

  // 2. Insert shop_visit
  const { error: visitError } = await supabase
    .from('shop_visits')
    .insert({
      owner_uuid: payload.owner_uuid,
      shop_id: payload.shop_id,
      entered_at: payload.entered_at,
      platform: payload.platform,
    });

  if (visitError) {
    throw new Error(`Insert shop_visit failed: ${visitError.message}`);
  }

  console.log('[GeofenceEventService] ✅ Supabase insert successful:', payload.shop_id);
}

/**
 * Flush la queue de retry.
 * Essaie de renvoyer tous les événements prêts pour retry.
 * 
 * À appeler:
 * - Périodiquement en foreground (ex: toutes les 5 minutes)
 * - Quand la connexion revient (online detection)
 * - Manuellement via Settings/Debug UI
 */
export async function flushEventQueue(): Promise<{
  sent: number;
  failed: number;
}> {
  console.log('[GeofenceEventService] Flushing event queue...');

  const eventsToRetry = await getEventsToRetry();
  if (eventsToRetry.length === 0) {
    console.log('[GeofenceEventService] Queue vide — rien à envoyer.');
    return { sent: 0, failed: 0 };
  }

  console.log(
    `[GeofenceEventService] ${eventsToRetry.length} événements à renvoyer.`
  );

  let sent = 0;
  let failed = 0;

  // Envoyer les événements séquentiellement (pas de race condition)
  for (const queuedEvent of eventsToRetry) {
    const result = await retryQueuedEvent(queuedEvent.id, queuedEvent.payload);
    if (result.success) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  console.log(
    `[GeofenceEventService] Queue flush complete: ${sent} sent, ${failed} failed`
  );
  return { sent, failed };
}

/**
 * Optionnel: Nettoie les événements qui ont échoué trop de fois.
 * À appeler périodiquement (ex: une fois par jour).
 * 
 * Note: Pour POC, peut être ignoré. En production, il faudrait
 * envoyer ces événements à un service de dead-letter pour investigation.
 */
export async function cleanupFailedEvents(): Promise<void> {
  console.log('[GeofenceEventService] Cleanup failed events...');
  // Implémentation future si nécessaire
}
