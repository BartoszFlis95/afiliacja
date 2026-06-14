import type {
  Product,
  BrandProfile,
  AffiliateLink,
  InfluencerProfile,
} from "@prisma/client";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ProductWithBrand = Product & {
  brandProfile: BrandProfile;
};

export type AffiliateLinkWithDetails = AffiliateLink & {
  product: Product;
  influencerProfile: InfluencerProfile;
};

export type ClickStats = {
  date: string;
  clicks: number;
};

export type ConversionStats = {
  date: string;
  conversions: number;
  revenue: number;
};

export type DashboardStats = {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
};
