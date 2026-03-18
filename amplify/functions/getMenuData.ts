/**
 * getMenuData.ts
 *
 * Simulated Amplify function that returns menu data:
 *   - The 5 nearest shops
 *   - The 10 nearest products
 *
 * For now this uses hardcoded mock data.
 * Later it will be replaced by real DynamoDB / AppSync queries
 * using the user's geolocation coordinates.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Shop {
    id: string;
    name: string;
    category: string;
    address: string;
    latitude: number;
    longitude: number;
    description: string;
    rating: number;
    reviews: number;
    /** Pre-calculated distance string (e.g. "150 m", "1.2 km") */
    distance: string;
    /** Distance in meters — used for sorting */
    distanceMeters: number;
    phone: string;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
    logoUrl: string | null;
    coverUrl: string | null;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    /** Original (non-discounted) price — null if no discount */
    discountPrice: number | null;
    currency: string;
    imageUrl: string | null;
    rating: number;
    /** Pre-calculated distance string */
    distance: string;
    /** Distance in meters — used for sorting */
    distanceMeters: number;
    inStock: boolean;
    shopId: string;
    shopName: string;
    shopAddress: string;
    description: string | null;
}

export interface MenuDataResponse {
    nearbyShops: Shop[];
    nearbyProducts: Product[];
}

export interface GetMenuDataInput {
    latitude: number;
    longitude: number;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_SHOPS: Shop[] = [
    {
        id: 'shop-1',
        name: 'Mega Sport',
        category: 'Shopping',
        address: 'Shay Agnon St, Ashkelon',
        latitude: 31.662121,
        longitude: 34.554262,
        description: 'Sports & Fitness Equipment',
        rating: 4.5,
        reviews: 187,
        distance: '150 m',
        distanceMeters: 150,
        phone: '+972-8-672-1234',
        openTime: '09:00',
        closeTime: '21:00',
        isOpen: true,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-2',
        name: 'Fox',
        category: 'Shopping',
        address: 'Shay Agnon St, Ashkelon',
        latitude: 31.661033,
        longitude: 34.555941,
        description: 'Clothing & Fashion',
        rating: 4.3,
        reviews: 312,
        distance: '200 m',
        distanceMeters: 200,
        phone: '+972-8-672-5678',
        openTime: '09:30',
        closeTime: '22:00',
        isOpen: true,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-3',
        name: 'Mania Jeans',
        category: 'Shopping',
        address: 'Shay Agnon St, Ashkelon',
        latitude: 31.6625,
        longitude: 34.5548,
        description: 'Jeans & Casual Wear',
        rating: 4.2,
        reviews: 98,
        distance: '180 m',
        distanceMeters: 180,
        phone: '+972-8-672-9012',
        openTime: '10:00',
        closeTime: '20:00',
        isOpen: false,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-4',
        name: 'Studio Pasha',
        category: 'Shopping',
        address: 'Shay Agnon St, Ashkelon',
        latitude: 31.6618,
        longitude: 34.5555,
        description: "Women's Fashion",
        rating: 4.6,
        reviews: 145,
        distance: '250 m',
        distanceMeters: 250,
        phone: '+972-8-672-3456',
        openTime: '09:00',
        closeTime: '21:30',
        isOpen: true,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-5',
        name: "Yitzhak's Grocery",
        category: 'Restaurants',
        address: 'Shay Agnon St 5, Ashkelon',
        latitude: 31.6622,
        longitude: 34.5537,
        description: 'Fine Grocery & Local Products',
        rating: 4.8,
        reviews: 54,
        distance: '120 m',
        distanceMeters: 120,
        phone: '+972-8-672-1111',
        openTime: '08:00',
        closeTime: '20:00',
        isOpen: true,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-6',
        name: 'Lee Cooper Kids',
        category: 'Shopping',
        address: 'Shay Agnon St, Ashkelon',
        latitude: 31.663,
        longitude: 34.554,
        description: 'Kids Fashion',
        rating: 4.4,
        reviews: 76,
        distance: '300 m',
        distanceMeters: 300,
        phone: '+972-8-672-7890',
        openTime: '10:00',
        closeTime: '20:00',
        isOpen: false,
        logoUrl: null,
        coverUrl: null,
    },
    {
        id: 'shop-7',
        name: 'TechStore Pro',
        category: 'Tech',
        address: 'Ben Gurion St 10, Ashkelon',
        latitude: 31.664,
        longitude: 34.556,
        description: 'Electronics & Gadgets',
        rating: 4.7,
        reviews: 312,
        distance: '420 m',
        distanceMeters: 420,
        phone: '+972-8-672-4444',
        openTime: '09:00',
        closeTime: '22:00',
        isOpen: true,
        logoUrl: null,
        coverUrl: null,
    },
];

const MOCK_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        name: 'iPhone 17 Pro Max',
        price: 1329,
        discountPrice: 899,
        currency: '$',
        imageUrl: null,
        rating: 4.8,
        distance: '255 m',
        distanceMeters: 255,
        inStock: true,
        shopId: 'shop-7',
        shopName: 'TechStore Pro',
        shopAddress: 'Ben Gurion St 10, Ashkelon',
        description: 'Latest Apple flagship with A19 Pro chip.',
    },
    {
        id: 'prod-2',
        name: 'Nike Air Max 90',
        price: 179,
        discountPrice: 129,
        currency: '$',
        imageUrl: null,
        rating: 4.6,
        distance: '150 m',
        distanceMeters: 150,
        inStock: true,
        shopId: 'shop-1',
        shopName: 'Mega Sport',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Retro-modern sneakers with visible Air unit.',
    },
    {
        id: 'prod-3',
        name: 'AirPods Pro 3',
        price: 279,
        discountPrice: 219,
        currency: '$',
        imageUrl: null,
        rating: 4.7,
        distance: '255 m',
        distanceMeters: 255,
        inStock: true,
        shopId: 'shop-7',
        shopName: 'TechStore Pro',
        shopAddress: 'Ben Gurion St 10, Ashkelon',
        description: 'Active noise cancellation with spatial audio.',
    },
    {
        id: 'prod-4',
        name: 'Levi\'s 501 Original',
        price: 89,
        discountPrice: null,
        currency: '$',
        imageUrl: null,
        rating: 4.3,
        distance: '180 m',
        distanceMeters: 180,
        inStock: true,
        shopId: 'shop-3',
        shopName: 'Mania Jeans',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Classic straight-fit jeans.',
    },
    {
        id: 'prod-5',
        name: 'Fox Summer Dress',
        price: 59,
        discountPrice: 39,
        currency: '$',
        imageUrl: null,
        rating: 4.4,
        distance: '200 m',
        distanceMeters: 200,
        inStock: true,
        shopId: 'shop-2',
        shopName: 'Fox',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Lightweight summer dress in floral print.',
    },
    {
        id: 'prod-6',
        name: 'Adidas Ultraboost 24',
        price: 199,
        discountPrice: 159,
        currency: '$',
        imageUrl: null,
        rating: 4.5,
        distance: '150 m',
        distanceMeters: 150,
        inStock: true,
        shopId: 'shop-1',
        shopName: 'Mega Sport',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Premium running shoes with Boost midsole.',
    },
    {
        id: 'prod-7',
        name: 'Kids Polo Shirt',
        price: 35,
        discountPrice: null,
        currency: '$',
        imageUrl: null,
        rating: 4.1,
        distance: '300 m',
        distanceMeters: 300,
        inStock: true,
        shopId: 'shop-5',
        shopName: 'Lee Cooper Kids',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Cotton polo shirt for boys, ages 4-12.',
    },
    {
        id: 'prod-8',
        name: 'Studio Pasha Handbag',
        price: 120,
        discountPrice: 89,
        currency: '$',
        imageUrl: null,
        rating: 4.6,
        distance: '250 m',
        distanceMeters: 250,
        inStock: true,
        shopId: 'shop-4',
        shopName: 'Studio Pasha',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Elegant leather handbag, limited edition.',
    },
    {
        id: 'prod-9',
        name: 'Organic Olive Oil 750ml',
        price: 18,
        discountPrice: null,
        currency: '$',
        imageUrl: null,
        rating: 4.9,
        distance: '120 m',
        distanceMeters: 120,
        inStock: true,
        shopId: 'shop-5',
        shopName: "Yitzhak's Grocery",
        shopAddress: 'Shay Agnon St 5, Ashkelon',
        description: 'Cold-pressed extra virgin olive oil from the Galilee.',
    },
    {
        id: 'prod-10',
        name: 'iPad Air M3',
        price: 699,
        discountPrice: 599,
        currency: '$',
        imageUrl: null,
        rating: 4.7,
        distance: '255 m',
        distanceMeters: 255,
        inStock: true,
        shopId: 'shop-7',
        shopName: 'TechStore Pro',
        shopAddress: 'Ben Gurion St 10, Ashkelon',
        description: '11-inch Liquid Retina display with M3 chip.',
    },
    {
        id: 'prod-11',
        name: 'Puma Running Shorts',
        price: 45,
        discountPrice: 29,
        currency: '$',
        imageUrl: null,
        rating: 4.2,
        distance: '150 m',
        distanceMeters: 150,
        inStock: false,
        shopId: 'shop-1',
        shopName: 'Mega Sport',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Lightweight, quick-dry running shorts.',
    },
    {
        id: 'prod-12',
        name: 'Fox Leather Jacket',
        price: 199,
        discountPrice: null,
        currency: '$',
        imageUrl: null,
        rating: 4.5,
        distance: '200 m',
        distanceMeters: 200,
        inStock: true,
        shopId: 'shop-2',
        shopName: 'Fox',
        shopAddress: 'Shay Agnon St, Ashkelon',
        description: 'Classic fitted leather jacket.',
    },
];

// ─── Simulated API function ─────────────────────────────────────────────────

/**
 * Simulates fetching the main menu data.
 *
 * Returns the 5 nearest shops and 10 nearest products
 * sorted by distance (ascending).
 *
 * @param input — user's current GPS coordinates
 * @returns MenuDataResponse with nearbyShops (5) and nearbyProducts (10)
 *
 * TODO: Replace mock data with real Amplify Data (AppSync) queries:
 *   - Query Shop model filtered / sorted by geo-distance
 *   - Query Product model filtered / sorted by geo-distance
 */
export async function getMenuData(
    input: GetMenuDataInput
): Promise<MenuDataResponse> {
    const { latitude, longitude } = input;

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    // In a real implementation we would calculate actual distances
    // using the Haversine formula or a DynamoDB geo query.
    // For now we just sort by the pre-set distanceMeters field.

    const sortedShops = [...MOCK_SHOPS].sort(
        (a, b) => a.distanceMeters - b.distanceMeters
    );

    const sortedProducts = [...MOCK_PRODUCTS].sort(
        (a, b) => a.distanceMeters - b.distanceMeters
    );

    const nearbyShops = sortedShops.slice(0, 5);
    const nearbyProducts = sortedProducts.slice(0, 10);

    console.log(
        `[getMenuData] Returning ${nearbyShops.length} shops and ${nearbyProducts.length} products ` +
        `for location (${latitude}, ${longitude})`
    );

    return {
        nearbyShops,
        nearbyProducts,
    };
}
