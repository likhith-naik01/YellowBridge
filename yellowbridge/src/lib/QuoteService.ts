export interface QuoteRequest {
  fromAmount: string
  fromCurrency: string
  toCurrency: string
  recipientCountry?: string
}

export interface QuoteResponse {
  fromAmount: string
  fromCurrency: string
  toAmount: string
  toCurrency: string
  exchangeRate: number
  fees: {
    platform: string
    network: string
    total: string
  }
  estimatedDelivery: string
  recipientCountry?: string
}

class QuoteService {
  private readonly FIXED_RATE_USD_TO_INR = 83.5 // Demo rate
  private readonly PLATFORM_FEE_PERCENT = 2.0
  private readonly NETWORK_FEE_FIXED = 0.5

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const fromAmount = parseFloat(request.fromAmount)
    const exchangeRate = this.FIXED_RATE_USD_TO_INR
    
    // Calculate fees
    const platformFee = (fromAmount * this.PLATFORM_FEE_PERCENT) / 100
    const networkFee = this.NETWORK_FEE_FIXED
    const totalFees = platformFee + networkFee
    
    // Calculate final amount after fees
    const netAmount = fromAmount - totalFees
    const toAmount = (netAmount * exchangeRate).toFixed(2)
    
    // Estimate delivery time based on recipient country
    const estimatedDelivery = this.getEstimatedDelivery(request.recipientCountry)
    
    return {
      fromAmount: request.fromAmount,
      fromCurrency: request.fromCurrency,
      toAmount,
      toCurrency: request.toCurrency,
      exchangeRate,
      fees: {
        platform: platformFee.toFixed(2),
        network: networkFee.toFixed(2),
        total: totalFees.toFixed(2)
      },
      estimatedDelivery,
      recipientCountry: request.recipientCountry
    }
  }

  private getEstimatedDelivery(country?: string): string {
    const deliveryTimes: Record<string, string> = {
      'IN': 'Instant (off-chain)',
      'US': '2-5 minutes',
      'UK': '2-5 minutes',
      'CA': '2-5 minutes',
      'AU': '5-10 minutes',
      'DE': '2-5 minutes',
      'FR': '2-5 minutes',
      'JP': '5-10 minutes',
      'BR': '5-10 minutes',
      'MX': '5-10 minutes'
    }
    
    return deliveryTimes[country || 'IN'] || '2-5 minutes'
  }

  // For demo purposes, simulate real-time rate updates
  async getLiveRate(_fromCurrency: string, _toCurrency: string): Promise<number> {
    // In production, this would call a real FX API
    const baseRate = this.FIXED_RATE_USD_TO_INR
    const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
    return baseRate + (baseRate * variation)
  }
}

export const quoteService = new QuoteService()
