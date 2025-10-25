import { ObjectId } from "mongodb";

// --- Tipos Fundamentales ---

export type DriverStatus = 'IDLE' | 'COLLECTING_BATCH' | 'ROUTING_TO_HUB' | 'DELIVERING_BATCH' | 'PERFORMING_DIRECT_ROUTE';
export type ShippingType = 'going_network' | 'self_delivery';

// --- Entidades Principales ---

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  lat?: number;
  lon?: number; // Opcional en la entrada, obligatorio en el sistema.
}

export interface GeocodedAddress extends Address {
  lat: number;
  lon: number;
}

export interface User {
  _id: ObjectId | string;
  fullName: string;
  addresses: Address[];
  email: string;
  avatar: string;
  joined: string;
  location: string;
  bio: string;
  website: string;
  twitter: string;
  x: string;
  instagram: string;
  telegram: string;
  facebook: string;
  isSeller: boolean;
  isDriver?: boolean;
  companyId?: string; // ID of the company this user owns/belongs to
  driverDetails?: {
    status?: DriverStatus;
    idleSince?: Date;
    vehicle?: Vehicle;
  };
  wishlist: string[];
  settings: {
    theme: "light" | "dark" | "system";
    currency: string;
    language: string;
  }
}

export interface ProductInDb extends Omit<NewProductPayload, 'images'> {
  _id: ObjectId;
  images: string[]; // URLs of images stored in the database
  pickupAddress: GeocodedAddress;
  mainImage: string;
}

export interface Product extends Omit<ProductInDb, '_id'> {
  _id: string; // For frontend usage, we convert ObjectId to string
}

export interface CartItem {
  _id: ObjectId | string; // El _id del producto
  name: string;
  price: number;
  mainImage: string;
  seller: string;
  addressWallet: string;
  currency: string;
  shippingType: ShippingType;
  pickupAddress: Address; // La dirección del producto se copia aquí.
  weight_kg?: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  estimatedDeliveryDays?: number;
  quantity: number;
  isOffer?: boolean;
  offerPercentage?: number;
}

export interface Order {
  _id?: ObjectId | string;
  date: Date;
  status: 'payment_pending' | 'processing' | 'completed' | 'cancelled';
  buyer: {
    walletAddress: string;
    _id?: string;
    address: Address; // La dirección del comprador puede no estar geocodificada aún.
  };
  sellers: string[];
  shipments: string[];
  signature: string;
  items: CartItem[];
}

// --- Modelos de Envío (Shipment) ---

export interface BaseShipment {
  orderId: string;
  sellerId: string;
  buyerId: string;
  shippingType: ShippingType;
  deliveryAddress: GeocodedAddress; // Obligatorio que esté geocodificada
  pickupAddress: GeocodedAddress;   // Obligatorio que esté geocodificada
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoingNetworkShipment extends BaseShipment {
  shippingType: 'going_network';
  status: 'pending' | 'ready_to_ship' | 'in_transit' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDetails?: {
    driverId: string;
    trackingNumber?: string;
    confirmedDeliveryDays?: number;
  };
}

export interface SelfDeliveryShipment extends BaseShipment {
  shippingType: 'self_delivery';
  status: 'shipped_by_seller' | 'completed' | 'cancelled' | 'dispute';
  deliveryDetails?: {
    confirmedDeliveryDays: number;
    trackingNumber?: string;
  };
}

export type Shipment = (GoingNetworkShipment | SelfDeliveryShipment) & {
  _id: string;
};

// Represents the Shipment object as it is stored in the database.
export type ShipmentInDb = Omit<Shipment, 'deliveryAddress'> & {
  _id: ObjectId;
  encryptedDeliveryAddress: EncryptedData;
};

// --- Logística y Tareas de Conductor ---

export interface Batch {
  _id?: ObjectId | string;
  batchId?: string; // Temporary ID for in-memory operations
  type: 'HYPER_LOCAL' | 'DIRECT' | 'HUB_AND_SPOKE';
  status: 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  shipments: (Shipment & { _id: ObjectId | string })[];
  assignedCollectorId?: string;
  assignedDelivererId?: string;
  hubLocation?: Coordinate;
  createdAt: Date;
}

export interface DriverTask {
  status: DriverStatus;
  batch?: Batch;
  hubLocation?: Coordinate;
  route?: Coordinate[];
}

// --- Modelos de Empresa (LaaS) ---

export interface ApiKey {
  key: string; // The public, identifiable part of the key
  hashedSecret: string; // The hashed secret, stored in the DB
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsed?: Date;
}

export interface Company {
  _id?: ObjectId | string;
  name: string;
  ownerUserId: string; // Links to the User who owns this company
  billingDetails?: { // Placeholder for Stripe Customer ID, etc.
    customerId?: string;
  };
  shippingCredits: number; // Balance for pre-paid model, in cents or smallest unit
  apiKeys: ApiKey[];
  createdAt: Date;
}

// --- Payloads y Tipos Auxiliares ---

export interface NewProductPayload {
  seller: string;
  name: string;
  addressWallet: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  shippingType: ShippingType;
  pickupAddress: Address; // En el producto, la dirección puede no estar geocodificada aún.
  publishStatus: "published" | "unpublished";
  images: Array< File>;

  stock: number;
  location?: string;
  condition?: string;
  tags?: string[];
  isService?: boolean;
  isFeatured?: boolean;
  isOffer?: boolean;
  offerPercentage: number;
  reviews?: string[];
  rating: number;
  subcategory?: string;
  createdAt?: Date;
  updatedAt?: Date;
  weight_kg?: number;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  isFragile?: boolean;
  estimatedDeliveryDays?: number;
}

export interface CheckoutPayload {
  date: Date;
  buyer: {
    walletAddress: string;
    _id?: string;
    address: Address;
  };
  sellers: string[];
  items: CartItem[];
}

export type NewOrderPayload = Omit<Order, '_id' | 'shipments' | 'signature'>;

export type Coordinate = { lat: number; lon: number };

export interface Vehicle {
  type: 'motorcycle' | 'car' | 'van';
  max_payload_kg: number;
  max_volume_m3: number;
}

export interface EncryptedData {
  iv: string;
  content: string;
  tag: string;
}

export interface DriverState {
  socketId: string;
  driverId: string;
  lat: number;
  lon: number;
  status: DriverStatus;
  idleSince: number;
  quadrantId: string;
}