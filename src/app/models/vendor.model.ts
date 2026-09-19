export type StoreServiceType = 'pharmacy' | 'lab_test' | 'property' | 'restaurant' | 'grocery';

export interface StoreKPIs {
  todaySales: number;
  salesGrowth: string;
  activeOrders: number;
  completedToday: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface StoreOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  timeAgo: string;
  paymentMethod?: string;
  itemCount?: number;
}

export interface StoreCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  unit: string;
  sku?: string;
  image?: string;
}

export interface StoreSettlement {
  id: string;
  settlementDate: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  bankAccount: string;
  status: 'settled' | 'processing' | 'scheduled';
}

export interface VendorStore {
  id: string;
  _id?: string;
  name: string;
  city: string;
  serviceType: StoreServiceType;
  serviceLabel: string;
  serviceIcon: string;
  category: string;
  phone: string;
  email?: string;
  address: string;
  pincode: string;
  isOpen: boolean;
  rating: number;
  licenseType: string;
  licenseNumber: string;
  gstNumber?: string;
  bannerUrl?: string;
  logoUrl?: string;
  metrics: StoreKPIs;
  orders: StoreOrderItem[];
  catalogItems: StoreCatalogItem[];
  settlements: StoreSettlement[];
  createdAt?: string;
}

export interface VendorUser {
  _id?: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'vendor' | 'vendor_staff';
  store?: VendorStore;
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: VendorUser;
  isNewUser?: boolean;
}
