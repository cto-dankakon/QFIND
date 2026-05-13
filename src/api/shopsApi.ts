import { supabase } from './supabaseClient';
import type { Shop } from '../types/database';
import { MOCK_SHOPS } from '../mocks';

const supabaseClient = supabase as typeof supabase & {
  supabaseUrl?: string;
  supabaseKey?: string;
};

const IS_SUPABASE_CONFIGURED =
  !supabaseClient.supabaseUrl?.includes('YOUR_PROJECT') &&
  !supabaseClient.supabaseKey?.includes('YOUR_SUPABASE');

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeShopLocation(raw: unknown): Shop['location'] {
  if (!raw) return null;

  // Case 1: already in app format { latitude, longitude }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const lat = toFiniteNumber(obj.latitude);
    const lng = toFiniteNumber(obj.longitude);
    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng };
    }

    // Case 2: GeoJSON-like { type: 'Point', coordinates: [lng, lat] }
    if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const coordLng = toFiniteNumber(obj.coordinates[0]);
      const coordLat = toFiniteNumber(obj.coordinates[1]);
      if (coordLat !== null && coordLng !== null) {
        return { latitude: coordLat, longitude: coordLng };
      }
    }

    // Case 3: PostGIS object forms with x/y or lon/lat keys
    const x = toFiniteNumber(obj.x ?? obj.lng ?? obj.lon ?? obj.longitude);
    const y = toFiniteNumber(obj.y ?? obj.lat ?? obj.latitude);
    if (y !== null && x !== null) {
      return { latitude: y, longitude: x };
    }
  }

  // Case 4: WKT text like POINT(34.55 31.66)
  if (typeof raw === 'string') {
    const match = raw.match(/POINT\s*\(\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s*\)/i);
    if (match) {
      const lng = toFiniteNumber(match[1]);
      const lat = toFiniteNumber(match[2]);
      if (lat !== null && lng !== null) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return null;
}

type SupabaseShopRow = Record<string, unknown> & {
  id: string;
  name: string;
  address: string;
  category: string;
  phone: string;
  open_time: string;
  close_time: string;
  logo_url: string | null;
  cover_url: string | null;
  created_at: string;
  owner_uuid: string;
  location?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  lat?: unknown;
  lng?: unknown;
};

function normalizeShop(row: SupabaseShopRow): Shop {
  const directLocation = normalizeShopLocation(row.location);
  const flatLat = toFiniteNumber(row.latitude ?? row.lat);
  const flatLng = toFiniteNumber(row.longitude ?? row.lng);

  const location =
    directLocation ??
    (flatLat !== null && flatLng !== null
      ? { latitude: flatLat, longitude: flatLng }
      : null);

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    category: row.category,
    phone: row.phone,
    open_time: row.open_time,
    close_time: row.close_time,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    location,
    created_at: row.created_at,
    owner_uuid: row.owner_uuid,
  };
}

/**
 * Recupere tous les shops.
 * Utilise Supabase si la configuration est valide, sinon retourne les mocks.
 */
export async function fetchShops(): Promise<Shop[]> {
  if (!IS_SUPABASE_CONFIGURED) {
    console.warn('[shopsApi] Credentials Supabase placeholders detectes — fallback sur mocks.');
    return MOCK_SHOPS;
  }

  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as SupabaseShopRow[];
    const normalizedShops = rows.map(normalizeShop);
    const withLocation = normalizedShops.filter((s) => s.location !== null).length;

    console.log(
      `[shopsApi] ${normalizedShops.length} shops charges depuis Supabase (${withLocation} avec GPS valide).`
    );

    if (normalizedShops.length > 0 && withLocation === 0) {
      console.warn(
        '[shopsApi] Supabase renvoie des shops sans GPS exploitable — fallback sur mocks pour geofencing.'
      );
      return MOCK_SHOPS;
    }

    return normalizedShops;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.warn('[shopsApi] Supabase indisponible — fallback sur mocks :', message);
    return MOCK_SHOPS;
  }
}

/**
 * Recupere les N shops les plus proches d'une position GPS.
 * Le tri est fait cote client avec une distance euclidienne approximative.
 */
export async function fetchNearbyShops(
  latitude: number,
  longitude: number,
  limit = 10
): Promise<Shop[]> {
  const shops = await fetchShops();

  console.log(
    `[shopsApi] Calcul des ${limit} shops les plus proches pour (${latitude}, ${longitude}).`
  );

  return shops
    .filter((shop) => shop.location !== null)
    .sort((shopA, shopB) => {
      const distanceA = Math.hypot(
        (shopA.location?.latitude ?? 0) - latitude,
        (shopA.location?.longitude ?? 0) - longitude
      );
      const distanceB = Math.hypot(
        (shopB.location?.latitude ?? 0) - latitude,
        (shopB.location?.longitude ?? 0) - longitude
      );

      return distanceA - distanceB;
    })
    .slice(0, limit);
}