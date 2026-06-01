export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  unit: string;
  hsn: string;
  stock: number;
  minStock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Sale {
  id: string;
  billNo: string;
  date: string;
  time: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'flat' | 'pct';
  total: number;
  payMode: string;
  amountPaid: number;
  paymentHistory?: PaymentRecord[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGst?: string;
  synced: boolean;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface Purchase {
  id: string;
  supplier: string;
  billNo: string;
  date: string;
  total: number;
  paymentStatus: 'paid' | 'pending';
  amountPaid?: number;
  paymentHistory?: PaymentRecord[];
  items: PurchaseItem[];
}

export interface AppSettings {
  googleWebAppUrl: string;
  sheetName: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopGst: string;
  printSize: 'a4' | 'thermal';
  enableCustomerDetails: boolean;
  enableCustomerGst: boolean;
  categories: string[];
}

export const INITIAL_CATEGORIES = ['बीज', 'खाद', 'कीटनाशक', 'सिंचाई', 'अन्य'];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'अंकुर 3028', category: 'बीज', price: 860, cost: 700, unit: 'bag', hsn: '12011000', stock: 50, minStock: 5 },
  { id: '2', name: 'चारू तूर', category: 'बीज', price: 310, cost: 250, unit: 'kg', hsn: '07131000', stock: 100, minStock: 10 },
  { id: '3', name: 'राशी 659', category: 'बीज', price: 880, cost: 720, unit: 'bag', hsn: '12011000', stock: 30, minStock: 5 },
  { id: '4', name: 'राशी 971', category: 'बीज', price: 880, cost: 720, unit: 'bag', hsn: '12011000', stock: 25, minStock: 5 },
  { id: '5', name: 'राशी 797', category: 'बीज', price: 880, cost: 720, unit: 'bag', hsn: '12011000', stock: 20, minStock: 5 },
  { id: '6', name: 'अंकुर किर्ती', category: 'बीज', price: 880, cost: 720, unit: 'bag', hsn: '12011000', stock: 15, minStock: 5 },
  { id: '7', name: 'रॉयल कोर्ट', category: 'बीज', price: 880, cost: 700, unit: 'bag', hsn: '12011000', stock: 40, minStock: 5 },
  { id: '8', name: 'पंगा', category: 'बीज', price: 880, cost: 710, unit: 'bag', hsn: '12011000', stock: 35, minStock: 5 },
  { id: '9', name: 'कबड्डी', category: 'बीज', price: 880, cost: 710, unit: 'bag', hsn: '12011000', stock: 28, minStock: 5 }
];

export const DEFAULT_SETTINGS: AppSettings = {
  googleWebAppUrl: '',
  sheetName: 'Sales',
  shopName: 'कृषि बीज भंडार',
  shopAddress: '',
  shopPhone: '',
  shopGst: '',
  printSize: 'thermal',
  enableCustomerDetails: false,
  enableCustomerGst: false,
  categories: INITIAL_CATEGORIES
};
