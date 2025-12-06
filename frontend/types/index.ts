export interface Category {
  id?: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  _id?: string; // For backward compatibility if needed
  name: string;
  price: number;
  image_url: string;
  stock?: number;
  specifications?: Record<string, unknown>;
  category: Category | null;
  is_active?: boolean;
}

export interface TransactionItem {
  product_id: Product | string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  user_roblox_username: string;
  email: string;
  items: TransactionItem[];
  total_transfer: number;
  payment_deadline: Date;
  status: 'Pending' | 'Processing' | 'Success' | 'Failed' | 'Cancelled';
}
