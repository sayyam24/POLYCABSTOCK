import type { Product } from '@/lib/types'
import { getCatalogProducts } from '@/lib/catalog/products'

export const DEMO_PASSWORD = 'Demo@2024'
export const DEMO_EMAIL_DOMAIN = 'demo.electrotrack.com'
export const DEMO_DATA_VERSION = 'v1'
export const DEMO_ID_PREFIX = 'demo'

export const DEMO_COUNTS = {
  distributors: 10,
  subDistributors: 20,
  retailers: 50,
} as const

export const DEMO_PRODUCT_CATALOG: Omit<Product, 'id'>[] = getCatalogProducts().map(
  ({ id: _id, ...rest }) => rest,
)

export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Surat',
  'Nagpur',
  'Indore',
  'Kochi',
  'Coimbatore',
]

export const BUSINESS_PREFIXES = [
  'Metro',
  'Prime',
  'National',
  'City',
  'United',
  'Royal',
  'Global',
  'Sunrise',
  'Power',
  'Elite',
]

export const ROLE_SUFFIX: Record<string, string> = {
  distributor: 'Distributors',
  sub_distributor: 'Sub Distribution',
  retailer: 'Retail',
}
