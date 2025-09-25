import { useEffect, useState } from 'react'
import type { Address } from 'viem'
import { sessionManager, type UserSession, type TransferRequest } from '../lib/SessionManager'
import { channelManager, type ChannelConfig, type ResizeConfig, type CloseConfig } from '../lib/ChannelManager'
import { quoteService, type QuoteRequest } from '../lib/QuoteService'
import { appRegistry, type Application } from '../lib/AppRegistry'
import type { SessionKey } from '../lib/utils'

export function useSession(address: Address | null, sessionKey: SessionKey | null, isAuthenticated: boolean) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize session when wallet connects
  useEffect(() => {
    if (address && sessionKey && isAuthenticated) {
      let userSession = sessionManager.getSession(address)
      if (!userSession) {
        userSession = sessionManager.createSession(address, sessionKey)
      }
      sessionManager.updateSession(address, { isAuthenticated: true })
      setSession(userSession)
      setApplications(appRegistry.getAllApps())
    }
  }, [address, sessionKey, isAuthenticated])

  // Fetch balances
  const fetchBalances = async () => {
    if (!address) return
    setIsLoading(true)
    setError(null)
    try {
      const balances = await sessionManager.fetchBalances(address)
      setSession(prev => prev ? { ...prev, balances } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
    } finally {
      setIsLoading(false)
    }
  }

  // Transfer funds
  const transfer = async (request: TransferRequest) => {
    if (!address) throw new Error('No address')
    setIsLoading(true)
    setError(null)
    try {
      const result = await sessionManager.transfer(request, address)
      if (!result.success) {
        throw new Error(result.error || 'Transfer failed')
      }
      // Refresh balances after transfer
      await fetchBalances()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Create channel
  const createChannel = async (config: ChannelConfig) => {
    if (!sessionKey) throw new Error('No session key')
    setIsLoading(true)
    setError(null)
    try {
      const channelInfo = await channelManager.createChannel(sessionKey, config)
      setSession(prev => prev ? { 
        ...prev, 
        channels: [...prev.channels, channelInfo] 
      } : null)
      return channelInfo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Resize channel
  const resizeChannel = async (config: ResizeConfig) => {
    if (!sessionKey) throw new Error('No session key')
    setIsLoading(true)
    setError(null)
    try {
      await channelManager.resizeChannel(sessionKey, config)
      // Refresh balances after resize
      await fetchBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resize channel')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Close channel
  const closeChannel = async (config: CloseConfig) => {
    if (!sessionKey) throw new Error('No session key')
    setIsLoading(true)
    setError(null)
    try {
      await channelManager.closeChannel(sessionKey, config)
      setSession(prev => prev ? {
        ...prev,
        channels: prev.channels.map(ch => 
          ch.channelId === config.channelId 
            ? { ...ch, status: 'closed' as const }
            : ch
        )
      } : null)
      // Refresh balances after close
      await fetchBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close channel')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Get quote
  const getQuote = async (request: QuoteRequest) => {
    try {
      return await quoteService.getQuote(request)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote')
      throw err
    }
  }

  // Get live rate
  const getLiveRate = async (fromCurrency: string, toCurrency: string) => {
    try {
      return await quoteService.getLiveRate(fromCurrency, toCurrency)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get live rate')
      throw err
    }
  }

  // Get applications by category
  const getAppsByCategory = (category: string) => {
    return appRegistry.getAppsByCategory(category)
  }

  // Create application session
  const createAppSession = (appId: string, participants: Address[], initialState: Record<string, any> = {}) => {
    return appRegistry.createAppSession(appId, participants, initialState)
  }

  return {
    session,
    applications,
    isLoading,
    error,
    fetchBalances,
    transfer,
    createChannel,
    resizeChannel,
    closeChannel,
    getQuote,
    getLiveRate,
    getAppsByCategory,
    createAppSession
  }
}
