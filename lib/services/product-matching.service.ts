import type { Product, ProductAlias } from '@/lib/types'

export interface ProductMatchResult {
  product: Product | null
  matchType: 'code' | 'exact' | 'alias' | 'fuzzy' | 'manual'
  confidence: number
  aliasId?: string
}

export interface UnmatchedProduct {
  extractedName: string
  extractedCode?: string
  suggestedMatches: Array<{ product: Product; confidence: number }>
}

/**
 * Product Matching Service
 * Implements priority-based matching: Code → Exact → Alias → Fuzzy → Manual
 */
export class ProductMatchingService {
  private products: Product[]
  private aliases: ProductAlias[]
  private fuzzyThreshold = 0.85

  constructor(products: Product[], aliases: ProductAlias[]) {
    this.products = products
    this.aliases = aliases
  }

  /**
   * Match a product from invoice to Product Master
   * Priority: Code → Exact → Alias → Fuzzy → Manual
   */
  matchProduct(extractedName: string, extractedCode?: string): ProductMatchResult {
    // 1. Match by Product Code/SKU (highest priority)
    if (extractedCode) {
      const codeMatch = this.matchByCode(extractedCode)
      if (codeMatch) {
        return {
          product: codeMatch,
          matchType: 'code',
          confidence: 1.0,
        }
      }
    }

    // 2. Match by Exact Product Name
    const exactMatch = this.matchExact(extractedName)
    if (exactMatch) {
      return {
        product: exactMatch,
        matchType: 'exact',
        confidence: 1.0,
      }
    }

    // 3. Match by Alias (check alias table first)
    const aliasMatch = this.matchByAlias(extractedName)
    if (aliasMatch) {
      this.updateAliasUsage(aliasMatch.aliasId)
      return {
        product: aliasMatch.product,
        matchType: 'alias',
        confidence: 0.95,
        aliasId: aliasMatch.aliasId,
      }
    }

    // 4. Fuzzy matching using RapidFuzz-like algorithm
    const fuzzyMatch = this.matchFuzzy(extractedName)
    if (fuzzyMatch && fuzzyMatch.confidence >= this.fuzzyThreshold) {
      return {
        product: fuzzyMatch.product,
        matchType: 'fuzzy',
        confidence: fuzzyMatch.confidence,
      }
    }

    // 5. No match - requires manual intervention
    return {
      product: null,
      matchType: 'manual',
      confidence: 0,
    }
  }

  /**
   * Match by product code/SKU
   */
  private matchByCode(code: string): Product | null {
    const normalizedCode = code.trim().toUpperCase()
    return (
      this.products.find(
        (p) => p.sku?.toUpperCase() === normalizedCode || p.id === normalizedCode
      ) || null
    )
  }

  /**
   * Match by exact product name
   */
  private matchExact(name: string): Product | null {
    const normalizedName = name.trim().toLowerCase()
    return (
      this.products.find((p) => p.name.toLowerCase() === normalizedName) || null
    )
  }

  /**
   * Match by alias (from Product Alias table)
   */
  private matchByAlias(name: string): { product: Product; aliasId: string } | null {
    const normalizedName = name.trim().toLowerCase()
    const alias = this.aliases.find((a) => a.aliasName.toLowerCase() === normalizedName)
    
    if (alias) {
      const product = this.products.find((p) => p.id === alias.productId)
      if (product) {
        return { product, aliasId: alias.id }
      }
    }
    
    return null
  }

  /**
   * Fuzzy matching using Levenshtein distance
   */
  private matchFuzzy(name: string): { product: Product; confidence: number } | null {
    const normalizedName = name.trim().toLowerCase()
    let bestMatch: { product: Product; confidence: number } | null = null

    for (const product of this.products) {
      const similarity = this.calculateSimilarity(
        normalizedName,
        product.name.toLowerCase()
      )

      if (similarity > this.fuzzyThreshold) {
        if (!bestMatch || similarity > bestMatch.confidence) {
          bestMatch = { product, confidence: similarity }
        }
      }
    }

    return bestMatch
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0))

    for (let i = 0; i <= len1; i++) matrix[i][0] = i
    for (let j = 0; j <= len2; j++) matrix[0][j] = j

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }

    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    return maxLen === 0 ? 1 : 1 - distance / maxLen
  }

  /**
   * Update alias usage statistics
   */
  private updateAliasUsage(aliasId: string): void {
    // This will be called from the service layer to update the alias
    // The actual update happens in the electrotrack service
  }

  /**
   * Get unmatched products for manual review
   */
  getUnmatchedProducts(extractedProducts: Array<{ name: string; code?: string }>): UnmatchedProduct[] {
    const unmatched: UnmatchedProduct[] = []

    for (const extracted of extractedProducts) {
      const result = this.matchProduct(extracted.name, extracted.code)
      
      if (result.matchType === 'manual' || result.confidence < this.fuzzyThreshold) {
        const suggestedMatches = this.getSuggestedMatches(extracted.name)
        unmatched.push({
          extractedName: extracted.name,
          extractedCode: extracted.code,
          suggestedMatches,
        })
      }
    }

    return unmatched
  }

  /**
   * Get suggested matches for manual review
   */
  private getSuggestedMatches(name: string): Array<{ product: Product; confidence: number }> {
    const normalizedName = name.trim().toLowerCase()
    const matches: Array<{ product: Product; confidence: number }> = []

    for (const product of this.products) {
      const similarity = this.calculateSimilarity(
        normalizedName,
        product.name.toLowerCase()
      )

      if (similarity >= 0.6) {
        matches.push({ product, confidence: similarity })
      }
    }

    // Sort by confidence and return top 5
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  /**
   * Create a new alias mapping
   */
  createAlias(
    aliasName: string,
    productId: string,
    productName: string,
    createdBy: string
  ): ProductAlias {
    return {
      id: `alias_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      aliasName: aliasName.trim(),
      productId,
      productName,
      createdBy,
      createdDate: new Date().toISOString(),
      lastUsedDate: new Date().toISOString(),
      usageCount: 0,
    }
  }

  /**
   * Update alias usage when used
   */
  incrementAliasUsage(alias: ProductAlias): ProductAlias {
    return {
      ...alias,
      lastUsedDate: new Date().toISOString(),
      usageCount: alias.usageCount + 1,
    }
  }
}

/**
 * Factory function to create product matching service
 */
export function createProductMatchingService(
  products: Product[],
  aliases: ProductAlias[]
): ProductMatchingService {
  return new ProductMatchingService(products, aliases)
}
