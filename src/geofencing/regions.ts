import type { LocationRegion } from 'expo-location';
import type { Shop } from '../types/database';
import { fetchShops } from '../api/shopsApi';
import { validateShopsForGeofence } from '../types/validation';
import { LogService } from '../services/LoggingService';

export const GEOFENCE_RADIUS_METERS = 100;

/**
 * Construit les régions de géofencing à partir d'un tableau de shops.
 * L'identifier = shop.id → utilisé comme shop_id dans shop_visits.
 * Filtre les shops sans coordonnées GPS (location === null).
 */
export function buildRegionsFromShops(shops: Shop[]): LocationRegion[] {
  // Valider les shops avant créer les régions
  const validShops = validateShopsForGeofence(
    shops.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
    }))
  );

  const regions = validShops.map((shop) => ({
    identifier: shop.id,
    latitude: shop.location!.latitude,
    longitude: shop.location!.longitude,
    radius: GEOFENCE_RADIUS_METERS,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));

  LogService.info('regions', `Built ${regions.length} geofence regions`, {
    region_count: regions.length,
    shop_count: shops.length,
  });
  
  return regions;
}

/**
 * Récupère les shops depuis l'API et construit les régions de géofencing.
 * → Supabase si disponible, sinon mocks en fallback (via fetchShops).
 */
export async function buildGeofenceRegions(): Promise<LocationRegion[]> {
  try {
    const shops = await fetchShops();
    LogService.info('regions', `Fetched ${shops.length} shops from API`);
    return buildRegionsFromShops(shops);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    LogService.error('regions', 'Failed to build geofence regions', {
      error: msg,
    });
    return [];
  }
}
