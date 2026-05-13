/**
 * Schémas de validation pour les types du géofencing.
 * 
 * Deux versions proposées:
 * A) Avec Zod (meilleures erreurs, type-safe)
 * B) Simple validation (pas de dépendance)
 * 
 * Pour POC, on propose A avec fallback simple si Zod pas disponible.
 */

import type { GeofenceEventPayload } from './database';

// Version A: Avec Zod (à installer: npm install zod)
// Décommentez si vous voulez utiliser Zod

/*
import { z } from 'zod';

const GeofenceEventPayloadSchema = z.object({
  owner_uuid: z.string().uuid('Invalid owner UUID'),
  shop_id: z.string().uuid('Invalid shop ID'),
  entered_at: z.string().datetime('Invalid ISO timestamp'),
  platform: z.enum(['android', 'ios']),
});

export function validateGeofenceEventPayload(payload: unknown): GeofenceEventPayload {
  return GeofenceEventPayloadSchema.parse(payload);
}
*/

// Version B: Validation simple (pas de dépendance externe)
// Validations de base pour garantir format minimal

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

interface ValidationError {
  field: string;
  message: string;
}

function validateUUID(value: string, fieldName: string): ValidationError | null {
  if (!value || typeof value !== 'string') {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }
  if (!UUID_REGEX.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid UUID (received: ${value})`,
    };
  }
  return null;
}

function validateISOTimestamp(value: string, fieldName: string): ValidationError | null {
  if (!value || typeof value !== 'string') {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be ISO 8601 timestamp (received: ${value})`,
    };
  }
  // Vérifier que le timestamp n'est pas dans le futur (±5min de tolérance)
  const now = Date.now();
  const timestamp = new Date(value).getTime();
  const diff = Math.abs(now - timestamp);
  if (diff > 5 * 60 * 1000) {
    console.warn(
      `[validation] Timestamp skew: ${Math.round(diff / 1000)}s. May indicate device clock issue.`
    );
  }
  return null;
}

export function validateGeofenceEventPayload(
  payload: unknown
): GeofenceEventPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }

  const p = payload as Record<string, unknown>;
  const errors: ValidationError[] = [];

  // Valider owner_uuid
  const ownerUUIDError = validateUUID(String(p.owner_uuid), 'owner_uuid');
  if (ownerUUIDError) errors.push(ownerUUIDError);

  // Valider shop_id
  const shopIDError = validateUUID(String(p.shop_id), 'shop_id');
  if (shopIDError) errors.push(shopIDError);

  // Valider entered_at
  const timestampError = validateISOTimestamp(String(p.entered_at), 'entered_at');
  if (timestampError) errors.push(timestampError);

  // Valider platform
  if (!p.platform || !['android', 'ios'].includes(String(p.platform))) {
    errors.push({
      field: 'platform',
      message: `platform must be 'android' or 'ios' (received: ${p.platform})`,
    });
  }

  if (errors.length > 0) {
    const errorMsg = errors
      .map((e) => `${e.field}: ${e.message}`)
      .join('; ');
    throw new Error(`Validation failed: ${errorMsg}`);
  }

  // Casting sûr après validation
  return {
    owner_uuid: String(p.owner_uuid),
    shop_id: String(p.shop_id),
    entered_at: String(p.entered_at),
    platform: p.platform as 'android' | 'ios',
  };
}

/**
 * Fonction de helper pour valider une liste de shops avant créer geofences.
 * Vérifie que chaque shop a les coordonnées GPS nécessaires.
 */
export interface ShopForGeofence {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export function validateShopsForGeofence(shops: ShopForGeofence[]): ShopForGeofence[] {
  const validShops = shops.filter((shop) => {
    if (!shop.id || !shop.location) {
      console.warn(`[validation] Skipping shop "${shop.name}" (no GPS location)`);
      return false;
    }
    if (!isValidCoordinate(shop.location.latitude, shop.location.longitude)) {
      console.warn(
        `[validation] Skipping shop "${shop.name}" (invalid coordinates: ${shop.location.latitude}, ${shop.location.longitude})`
      );
      return false;
    }
    return true;
  });

  if (validShops.length === 0) {
    console.warn('[validation] No valid shops with GPS location!');
  }

  return validShops;
}

/**
 * Valide que les coordonnées GPS sont valides.
 * Latitude: [-90, 90]
 * Longitude: [-180, 180]
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Helper pour stringify un événement avec masquage des infos sensibles
 * (utile pour les logs)
 */
export function stringifyEventForLogging(payload: GeofenceEventPayload): string {
  const maskedUUID = `${payload.owner_uuid.substring(0, 8)}...`;
  const maskedShopId = `${payload.shop_id.substring(0, 8)}...`;
  return JSON.stringify({
    owner_uuid: maskedUUID,
    shop_id: maskedShopId,
    entered_at: payload.entered_at,
    platform: payload.platform,
  });
}
