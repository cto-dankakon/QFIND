/**
 * Types alignés sur le schéma PostgreSQL Supabase QFind.
 * Ne pas modifier manuellement — refléter toujours la vraie DB.
 */

// Table: shops
export interface Shop {
  id: string;                   // uuid PK
  name: string;                 // text
  address: string;              // text — adresse lisible pour affichage humain
  category: string;             // text
  phone: string;                // text
  open_time: string;            // text — ex: "09:00"
  close_time: string;           // text — ex: "21:00"
  logo_url: string | null;      // text
  cover_url: string | null;     // text
  location: {                   // geography(Point) PostGIS — point GPS exact
    latitude: number;
    longitude: number;
  } | null;
  created_at: string;           // timestamptz
  owner_uuid: string;           // uuid FK → owners.id
}

// Table: owners (= utilisateurs identifiés par leur device UUID)
export interface Owner {
  id: string;                   // uuid PK — c'est le device UUID de l'app
  created_at: string;           // timestamptz
  last_seen_at: string;         // timestamptz
  cashback_balance: number;     // numeric
}

// Table: shop_visits (= événement de géofencing — 1 ligne = 1 entrée dans un magasin)
export interface ShopVisit {
  id: string;                   // uuid PK
  owner_uuid: string;           // uuid FK → owners.id (device UUID)
  shop_id: string;              // uuid FK → shops.id
  entered_at: string;           // timestamptz ISO 8601
  platform: 'android' | 'ios' | null;   // text — plateforme de détection
}

// Table: wallet_transactions
export interface WalletTransaction {
  id: string;
  owner_uuid: string;
  shop_id: string | null;
  type: string;
  amount: number;
  currency: string;
  meta: Record<string, unknown> | null;  // jsonb
  created_at: string;
}

// Table: products
export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  currency: string;
  in_stock: boolean;
  created_at: string;
  image_urls: string[] | null;  // jsonb
  section_id: string | null;
}

// Table: shop_sections
export interface ShopSection {
  id: string;
  shop_id: string;
  title: string;
  sort_order: number;
}

// Table: beta_access_codes
export interface BetaAccessCode {
  id: string;
  code: string;
  uses_remaining: number;
}

// Payload envoyé lors d'un événement géofencing (avant insert en DB)
export interface GeofenceEventPayload {
  owner_uuid: string;     // device UUID
  shop_id: string;        // shops.id
  entered_at: string;     // ISO 8601
  platform: 'android' | 'ios';
}
