/**
 * ShipAny API Service
 * Used for SoloBoard physical asset shipping
 *
 * Note: This service does not modify the ShipAny core structure,
 * it only serves as a calling wrapper following the ShipAny API spec.
 */

import { envConfigs } from '@/config';

// ============================================
// TypeScript type definitions (based on ShipAny API spec)
// ============================================

/**
 * ShipAny create order request payload
 * Strictly follows the ShipAny API documentation structure
 */
export interface ShipAnyCreateOrderPayload {
  // Courier ID (must match ShipAny supported couriers)
  courierId: string; // 'sf_express' | 'dhl' | 'fedex' | etc.

  // Order type (prepaid mode, cost deducted from platform account)
  type: 'prepaid';

  // Sender info (your warehouse/office address)
  sender: {
    name: string;
    phone: string;
    email?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      countryCode: string;
    };
  };

  // Recipient info (beneficiary address)
  receiver: {
    name: string;
    phone: string;
    email?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zipCode: string;
      countryCode: string;
    };
  };

  // Parcel info (must be an array even for a single parcel)
  parcels: Array<{
    weight: number; // Weight in kg, suggest 0.1-0.5kg for physical cards/backups
    container_type?: string; // 'BOX' | 'ENVELOPE' | etc.
    content: string; // Item description
    dimensions?: { // Dimensions in cm (optional)
      length: number;
      width: number;
      height: number;
    };
  }>;

  // Customs declaration (recommended even for domestic shipments)
  customs_declaration?: {
    currency: string; // 'HKD' | 'CNY' | 'USD'
    total_declared_value: number; // Symbolic declaration, suggest ~10.0
  };

  insurance?: boolean; // Whether to purchase insurance
  cod_amount?: number; // Cash on delivery amount (if needed)
  reference_number?: string; // Merchant order number (for correlation)
}

/**
 * ShipAny API response
 */
export interface ShipAnyOrderResponse {
  // ShipAny internal order number (important)
  uid: string;

  // Express tracking number (important)
  tracking_number: string;

  tracking_url?: string;

  // Shipping label URL (PDF)
  label_url?: string;

  // Shipping label Base64 (alternative)
  label_base64?: string;

  // Order status
  status: string;

  estimated_delivery_date?: string;

  shipping_cost?: number;
  currency?: string;

  // Raw response data (for debugging)
  raw_response?: any;
}

/**
 * ShipAny API error response
 */
export interface ShipAnyErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// ShipAny API configuration
// ============================================

/**
 * Get ShipAny API configuration
 */
function getShipAnyConfig() {
  // In Node.js environment (Next.js API Routes)
  const apiKey = process.env.SHIPANY_API_KEY;
  // In Edge Function environment (Deno):
  // const apiKey = Deno.env.get('SHIPANY_API_KEY');

  const apiUrl = process.env.SHIPANY_API_URL || 'https://api.shipany.io/v1';
  const merchandiseId = process.env.SHIPANY_MERCHANDISE_ID;
  const shopId = process.env.SHIPANY_SHOP_ID; // if API requires it

  if (!apiKey) {
    throw new Error('SHIPANY_API_KEY environment variable is not set. Please configure it in .env.local');
  }

  if (!merchandiseId) {
    throw new Error('SHIPANY_MERCHANDISE_ID environment variable is not set. Please configure it in .env.local');
  }

  return {
    apiKey,
    apiUrl,
    merchandiseId, // ShipAny Merchandise ID (used to associate merchandise when creating order)
    shopId,
  };
}

/**
 * Get default sender info (from environment variables or config file)
 */
function getDefaultSender() {
  return {
    name: process.env.SHIPANY_SENDER_NAME || 'SoloBoard Vault',
    phone: process.env.SHIPANY_SENDER_PHONE || '',
    email: process.env.SHIPANY_SENDER_EMAIL,
    address: {
      line1: process.env.SHIPANY_SENDER_ADDRESS_LINE1 || '',
      line2: process.env.SHIPANY_SENDER_ADDRESS_LINE2,
      city: process.env.SHIPANY_SENDER_CITY || 'Hong Kong',
      state: process.env.SHIPANY_SENDER_STATE,
      zipCode: process.env.SHIPANY_SENDER_ZIP_CODE || '',
      countryCode: process.env.SHIPANY_SENDER_COUNTRY_CODE || 'HKG',
    },
  };
}

// ============================================
// ShipAny API client
// ============================================

/**
 * Create a ShipAny logistics order
 * Strictly follows the ShipAny API documentation spec
 *
 * @param payload Order payload
 * @returns ShipAny order response
 * @throws Error if API call fails
 */
export async function createShipAnyOrder(
  payload: ShipAnyCreateOrderPayload
): Promise<ShipAnyOrderResponse> {
  const config = getShipAnyConfig();

  try {
    // Build request URL (adjust based on actual ShipAny API endpoint)
    const url = `${config.apiUrl}/orders/create`;
    // Alternative: `${config.apiUrl}/create_order`
    // Alternative: `${config.apiUrl}/v1/shipments/create`

    // Validate required fields
    if (!payload.courierId) {
      throw new Error('courierId is required');
    }
    if (!payload.parcels || !Array.isArray(payload.parcels) || payload.parcels.length === 0) {
      throw new Error('parcels must be a non-empty array');
    }
    if (!payload.receiver || !payload.receiver.address) {
      throw new Error('receiver address is required');
    }

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      // Or per ShipAny docs: 'X-API-Key': config.apiKey
    };

    // If API requires Shop ID
    if (config.shopId) {
      headers['X-Shop-Id'] = config.shopId;
    }

    // Build request body (strictly per ShipAny API documentation)
    const requestBody: any = {
      // Courier ID (required)
      courier_id: payload.courierId,
      // Alternative: courierId (camelCase, confirm per ShipAny docs)

      // Order type (required)
      type: payload.type || 'prepaid',

      // Sender info
      sender: {
        name: payload.sender.name,
        phone: payload.sender.phone,
        email: payload.sender.email,
        address: {
          line1: payload.sender.address.line1,
          line2: payload.sender.address.line2,
          city: payload.sender.address.city,
          state: payload.sender.address.state,
          zip_code: payload.sender.address.zipCode,
          country_code: payload.sender.address.countryCode,
        },
      },

      // Receiver info
      receiver: {
        name: payload.receiver.name,
        phone: payload.receiver.phone,
        email: payload.receiver.email,
        address: {
          line1: payload.receiver.address.line1,
          line2: payload.receiver.address.line2,
          city: payload.receiver.address.city,
          state: payload.receiver.address.state,
          zip_code: payload.receiver.address.zipCode,
          country_code: payload.receiver.address.countryCode,
        },
      },

      // Parcel info (must be array, even for a single parcel)
      parcels: payload.parcels.map(parcel => ({
        weight: parcel.weight,
        container_type: parcel.container_type || 'BOX',
        content: parcel.content,
        ...(parcel.dimensions && {
          length: parcel.dimensions.length,
          width: parcel.dimensions.width,
          height: parcel.dimensions.height,
        }),
      })),

      // Customs declaration (recommended even for domestic shipments)
      ...(payload.customs_declaration && {
        customs_declaration: {
          currency: payload.customs_declaration.currency || 'HKD',
          total_declared_value: payload.customs_declaration.total_declared_value || 10.0,
        },
      }),

      ...(payload.insurance !== undefined && { insurance: payload.insurance }),
      ...(payload.cod_amount !== undefined && { cod_amount: payload.cod_amount }),
      ...(payload.reference_number && { reference_number: payload.reference_number }),
    };

    // Remove undefined fields (ensure JSON serialization is correct)
    const cleanRequestBody = JSON.parse(JSON.stringify(requestBody));

    console.log(`[ShipAny] Creating order with courier: ${payload.courierId}`);
    console.log(`[ShipAny] Request URL: ${url}`);
    console.log(`[ShipAny] Parcels count: ${payload.parcels.length}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanRequestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error: ShipAnyErrorResponse = responseData;
      console.error(`[ShipAny] API Error (${response.status}):`, error);
      throw new Error(
        `ShipAny API Error: ${error.error?.message || response.statusText} (Code: ${error.error?.code || response.status})`
      );
    }

    // Parse success response (capture uid and tracking_number)
    // Note: field names may need adjustment based on actual ShipAny response
    const result: ShipAnyOrderResponse = {
      uid: responseData.uid || responseData.id || responseData.order_id,
      tracking_number: responseData.tracking_number || responseData.trackingNumber || responseData.tracking,
      tracking_url: responseData.tracking_url || responseData.trackingUrl,
      label_url: responseData.label_url || responseData.labelUrl || responseData.shipping_label_url,
      label_base64: responseData.label_base64 || responseData.labelBase64,
      status: responseData.status || responseData.order_status || 'created',
      estimated_delivery_date: responseData.estimated_delivery_date || responseData.estimatedDeliveryDate,
      shipping_cost: responseData.shipping_cost || responseData.cost,
      currency: responseData.currency || 'HKD',
      raw_response: responseData,
    };

    if (!result.uid) {
      console.warn('[ShipAny] Response missing uid field');
    }
    if (!result.tracking_number) {
      console.warn('[ShipAny] Response missing tracking_number field');
    }

    console.log(`[ShipAny] Order created successfully:`);
    console.log(`  - UID: ${result.uid}`);
    console.log(`  - Tracking Number: ${result.tracking_number}`);
    console.log(`  - Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error('[ShipAny] Failed to create order:', error);
    // Re-throw error for caller to handle
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`ShipAny API call failed: ${String(error)}`);
  }
}

/**
 * Query ShipAny order status
 *
 * @param orderUid ShipAny order UID or tracking number
 * @returns Order status info
 */
export async function getShipAnyOrderStatus(
  orderUid: string
): Promise<ShipAnyOrderResponse> {
  const config = getShipAnyConfig();

  try {
    const url = `${config.apiUrl}/orders/${orderUid}`;
    // Alternative: `${config.apiUrl}/track/${orderUid}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ShipAny API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      uid: data.uid || data.id,
      tracking_number: data.tracking_number || data.tracking,
      status: data.status,
      tracking_url: data.tracking_url,
    };
  } catch (error) {
    console.error(`[ShipAny] Failed to get order status: ${orderUid}`, error);
    throw error;
  }
}

// ============================================
// SoloBoard-specific wrapper functions
// ============================================

/**
 * Create a logistics order for SoloBoard
 * Wraps the conversion from beneficiary info to ShipAny order
 *
 * @param beneficiary Beneficiary info (from database)
 * @param assetDescription Physical asset description
 * @param courierId Courier ID (default: 'sf_express')
 * @returns ShipAny order response
 */
export async function createLegacyAssetShipment(
  beneficiary: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    receiverName?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    zipCode?: string | null;
    countryCode?: string | null;
    physicalAssetDescription?: string | null;
  },
  assetDescription?: string,
  courierId: string = 'sf_express'
): Promise<ShipAnyOrderResponse> {
  if (!beneficiary.receiverName || !beneficiary.addressLine1 || !beneficiary.city ||
      !beneficiary.zipCode || !beneficiary.countryCode) {
    throw new Error('Incomplete recipient address information');
  }

  if (!beneficiary.phone) {
    throw new Error('Recipient phone number is required');
  }

  const sender = getDefaultSender();

  if (!sender.address.line1 || !sender.address.city || !sender.address.zipCode) {
    throw new Error('Sender address configuration is incomplete. Please set SHIPANY_SENDER_* environment variables.');
  }

  const payload: ShipAnyCreateOrderPayload = {
    courierId: courierId,
    type: 'prepaid',

    sender: sender,

    receiver: {
      name: beneficiary.receiverName,
      phone: beneficiary.phone,
      email: beneficiary.email,
      address: {
        line1: beneficiary.addressLine1,
        city: beneficiary.city,
        zipCode: beneficiary.zipCode,
        countryCode: beneficiary.countryCode || 'HKG',
      },
    },

    // Parcel info (must be array structure)
    parcels: [
      {
        weight: 0.5, // Default 0.5kg for physical cards/USB drives
        container_type: 'BOX',
        content: assetDescription || beneficiary.physicalAssetDescription || 'Legacy Asset: Encrypted Recovery Kit',
      },
    ],

    customs_declaration: {
      currency: 'HKD',
      total_declared_value: 10.0, // Symbolic declaration
    },

    insurance: true,

    reference_number: `HEIR-${Date.now()}-${beneficiary.id.substring(0, 8)}`,
  };

  return createShipAnyOrder(payload);
}
