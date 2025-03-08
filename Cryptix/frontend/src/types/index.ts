// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Event Types
export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  venue: {
    name: string;
    sections: VenueSection[];
  };
  imageUrl?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags?: string[];
  price: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface VenueSection {
  id: string;
  name: string;
  capacity: number;
  price: number;
  available: number;
}

// Analytics Types
export interface TimeRange {
  start: string;
  end: string;
}

export interface AnalyticsFilter {
  metrics?: string[];
  segments?: string[];
  [key: string]: any;
}

export interface AnalyticsPreferences {
  defaultTimeRange: TimeRange;
  defaultFilters: AnalyticsFilter;
  theme: 'light' | 'dark';
  timezone: string;
  notifications: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// Market Types
export interface MarketListing {
  id: string;
  eventId: string;
  sellerId: string;
  price: number;
  quantity: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

export interface MarketStats {
  totalVolume: number;
  activeListings: number;
  averagePrice: number;
  recentSales: number;
  priceChange24h: number;
}

// Ticket Types
export interface Ticket {
  id: string;
  eventId: string;
  sectionId: string;
  ownerId: string;
  status: 'valid' | 'used' | 'expired' | 'transferred';
  purchaseDate: string;
  transferHistory?: {
    from: string;
    to: string;
    date: string;
  }[];
}

// Web3 Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  currency: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface SmartContractInteraction {
  contract: string;
  method: string;
  params: any[];
  value?: string;
}

export interface Web3State {
  account: string | null;
  chainId: number | null;
  active: boolean;
  error: Error | null;
}

// Theme Config
export interface ThemeConfig {
  palette: {
    primary: {
      main: string;
      light?: string;
      dark?: string;
    };
    secondary: {
      main: string;
      light?: string;
      dark?: string;
    };
  };
  typography: {
    fontFamily: string;
  };
}
