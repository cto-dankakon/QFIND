/**
 * MOCK DATA — Utilisé comme fallback tant que Supabase n'est pas configuré.
 * NE PAS utiliser directement dans les écrans — passer par src/api/*.ts.
 */

export interface VisitWithShop {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_address: string;
  shop_category: string;
  entered_at: string;
  platform: string | null;
}

export const MOCK_VISITS: VisitWithShop[] = [
  {
    id: 'visit-1',
    shop_id: 'shop-1',
    shop_name: 'Mega Sport',
    shop_address: 'Shay Agnon St, Ashkelon',
    shop_category: 'Shopping',
    entered_at: '2026-03-10T14:05:00Z',
    platform: 'android',
  },
  {
    id: 'visit-2',
    shop_id: 'shop-2',
    shop_name: 'Fox',
    shop_address: 'Shay Agnon St, Ashkelon',
    shop_category: 'Shopping',
    entered_at: '2026-03-10T11:30:00Z',
    platform: 'ios',
  },
  {
    id: 'visit-3',
    shop_id: 'shop-3',
    shop_name: 'Mania Jeans',
    shop_address: 'Shay Agnon St, Ashkelon',
    shop_category: 'Shopping',
    entered_at: '2026-02-28T16:20:00Z',
    platform: null,
  },
  {
    id: 'visit-4',
    shop_id: 'shop-4',
    shop_name: 'Studio Pasha',
    shop_address: 'Shay Agnon St, Ashkelon',
    shop_category: 'Shopping',
    entered_at: '2026-02-17T09:45:00Z',
    platform: 'android',
  },
  {
    id: 'visit-5',
    shop_id: 'shop-5',
    shop_name: "Yitzhak's Grocery",
    shop_address: 'Shay Agnon St 5, Ashkelon',
    shop_category: 'Restaurants',
    entered_at: '2026-01-25T18:10:00Z',
    platform: 'ios',
  },
  {
    id: 'visit-6',
    shop_id: 'shop-6',
    shop_name: 'Lee Cooper Kids',
    shop_address: 'Shay Agnon St, Ashkelon',
    shop_category: 'Shopping',
    entered_at: '2026-01-07T13:55:00Z',
    platform: null,
  },
  {
    id: 'visit-7',
    shop_id: 'shop-7',
    shop_name: 'TechStore Pro',
    shop_address: 'Ben Gurion St 10, Ashkelon',
    shop_category: 'Tech',
    entered_at: '2026-03-22T19:40:00Z',
    platform: 'android',
  },
];
