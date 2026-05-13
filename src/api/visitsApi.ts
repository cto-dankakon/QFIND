import { supabase } from './supabaseClient';
import { getDeviceUUID } from '../utils/deviceUUID';
import { MOCK_VISITS, type VisitWithShop } from '../mocks';

export type { VisitWithShop } from '../mocks';

/**
 * Recupere les visites de l'utilisateur courant enrichies des infos shop.
 * -> Supabase si configure (join shop_visits + shops).
 * -> MOCK_VISITS en fallback.
 * Triees par date decroissante (plus recente en premier).
 */
export async function fetchMyVisits(): Promise<VisitWithShop[]> {
  try {
    const uuid = await getDeviceUUID();
    console.log('[visitsApi] Chargement visites pour UUID :', uuid);

    const { data, error } = await supabase
      .from('shop_visits')
      .select(`
        id,
        shop_id,
        entered_at,
        platform,
        shops (
          name,
          address,
          category
        )
      `)
      .eq('owner_uuid', uuid)
      .order('entered_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const mapped: VisitWithShop[] = (data ?? []).map((row: any) => ({
      id: row.id,
      shop_id: row.shop_id,
      shop_name: row.shops?.name ?? 'Unknown shop',
      shop_address: row.shops?.address ?? '',
      shop_category: row.shops?.category ?? '',
      entered_at: row.entered_at,
      platform: row.platform ?? null,
    }));

    console.log(`[visitsApi] ${mapped.length} visites chargees depuis Supabase.`);
    return mapped;
  } catch (err: any) {
    console.warn('[visitsApi] Supabase indisponible - fallback sur mocks :', err.message);
    return MOCK_VISITS;
  }
}
