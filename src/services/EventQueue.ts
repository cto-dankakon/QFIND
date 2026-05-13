/**
 * Service de persistence et retry pour les événements geofencing.
 * Stocke les événements non-envoyés localement et les rejoue en background.
 * 
 * Résout le problème: Si Supabase est unavailable ou app crash,
 * les événements sont perdus. Cette queue garantit delivery eventual.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { GeofenceEventPayload } from '../types/database';

// Types pour la queue
export interface QueuedEvent {
  id: string;                           // UUID unique de l'event en queue
  payload: GeofenceEventPayload;
  attempt: number;                      // nombre de tentatives
  lastAttemptedAt: string | null;       // ISO timestamp
  enqueuedAt: string;                   // ISO timestamp de création
  nextRetryAt?: string;                 // ISO timestamp du prochain retry
}

const QUEUE_KEY = '@qfind/event_queue';
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;        // 1 seconde
const MAX_BACKOFF_MS = 60000;            // 1 minute

/**
 * Récupère la queue actuelle depuis AsyncStorage
 */
async function getQueue(): Promise<QueuedEvent[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[EventQueue] Erreur lecture queue :', error);
    return [];
  }
}

/**
 * Sauvegarde la queue dans AsyncStorage
 */
async function saveQueue(queue: QueuedEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[EventQueue] Erreur sauvegarde queue :', error);
    // Ne pas crasher — log only
  }
}

/**
 * Enqueue un événement geofencing.
 * Est appelée quand l'événement arrive du background geofencing.
 * L'événement restera en queue jusqu'à envoi successful.
 */
export async function enqueueEvent(payload: GeofenceEventPayload): Promise<void> {
  const queue = await getQueue();
  
  const queuedEvent: QueuedEvent = {
    id: uuidv4(),
    payload,
    attempt: 0,
    lastAttemptedAt: null,
    enqueuedAt: new Date().toISOString(),
  };

  queue.push(queuedEvent);
  await saveQueue(queue);

  console.log(
    `[EventQueue] Event enqueued. Shop: ${payload.shop_id}, Queue size: ${queue.length}`
  );
}

/**
 * Récupère les événements prêts à être retried (respecting backoff).
 */
export async function getEventsToRetry(): Promise<QueuedEvent[]> {
  const queue = await getQueue();
  const now = new Date();

  return queue.filter((event) => {
    // Skip si dépassé MAX_RETRIES
    if (event.attempt >= MAX_RETRIES) {
      console.warn(
        `[EventQueue] Event ${event.id} dépassé MAX_RETRIES (${event.attempt}). À investiguer manuellement.`
      );
      return false;
    }

    // Skip si n'a jamais été tenté (sera essayé tout de suite)
    if (event.lastAttemptedAt === null) {
      return true;
    }

    // Vérifier backoff exponentiel
    const nextRetryAt = event.nextRetryAt ? new Date(event.nextRetryAt) : new Date(0);
    return now >= nextRetryAt;
  });
}

/**
 * Appelle lors d'une tentative d'envoi d'un événement.
 * Met à jour attempt count et backoff.
 */
export async function markEventAsAttempted(eventId: string, success: boolean): Promise<void> {
  const queue = await getQueue();
  const event = queue.find((e) => e.id === eventId);

  if (!event) {
    console.warn(`[EventQueue] Event ${eventId} not found in queue.`);
    return;
  }

  if (success) {
    // Supprimer l'event de la queue
    const newQueue = queue.filter((e) => e.id !== eventId);
    await saveQueue(newQueue);
    console.log(`[EventQueue] ✅ Event ${eventId} envoyé avec succès. Supprimé de queue.`);
  } else {
    // Incrémenter attempt et calculer next backoff
    event.attempt += 1;
    event.lastAttemptedAt = new Date().toISOString();

    // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 32s (capped à 60s)
    const backoffMs = Math.min(
      INITIAL_BACKOFF_MS * Math.pow(2, event.attempt - 1),
      MAX_BACKOFF_MS
    );
    const nextRetry = new Date(Date.now() + backoffMs);
    event.nextRetryAt = nextRetry.toISOString();

    await saveQueue(queue);
    console.log(
      `[EventQueue] ⏳ Event ${eventId} retry attempt ${event.attempt}/${MAX_RETRIES}. Next retry: ${event.nextRetryAt}`
    );
  }
}

/**
 * Donne la taille actuelle de la queue (pour debugging)
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Vide la queue (utile pour tests)
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
  console.log('[EventQueue] Queue vidée.');
}

/**
 * Récupère les stats de la queue (pour debugging/monitoring)
 */
export async function getQueueStats(): Promise<{
  totalEvents: number;
  readyToRetry: number;
  failedEvents: number;
  avgAttempts: number;
}> {
  const queue = await getQueue();
  const readyToRetry = (await getEventsToRetry()).length;
  const failedEvents = queue.filter((e) => e.attempt >= MAX_RETRIES).length;
  const avgAttempts =
    queue.length > 0 ? queue.reduce((sum, e) => sum + e.attempt, 0) / queue.length : 0;

  return {
    totalEvents: queue.length,
    readyToRetry,
    failedEvents,
    avgAttempts: Math.round(avgAttempts * 100) / 100,
  };
}
