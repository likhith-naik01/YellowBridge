import type { Address } from 'viem'
import { createECDSAMessageSigner, createGetLedgerBalancesMessage, createTransferMessage, RPCMethod, parseAnyRPCResponse } from '@erc7824/nitrolite'
import { webSocketService } from './websocket'
import type { SessionKey } from './utils'

export interface UserSession {
  address: Address
  sessionKey: SessionKey
  isAuthenticated: boolean
  sessionId: string
  balances: Record<string, string>
  channels: ChannelInfo[]
  lastActivity: number
}

export interface ChannelInfo {
  channelId: string
  chainId: number
  asset: string
  amount: string
  status: 'open' | 'closed' | 'joining'
  participants: Address[]
}

export interface TransferRequest {
  to: Address
  amount: string
  asset: string
  memo?: string
  applicationId?: string
}

export interface TransferResult {
  success: boolean
  transactionId?: string
  error?: string
}

class SessionManager {
  private sessions = new Map<Address, UserSession>()
  private messageListeners = new Set<(data: any) => void>()

  constructor() {
    this.setupMessageHandling()
  }

  private setupMessageHandling() {
    const listener = (data: any) => {
      try {
        const response = parseAnyRPCResponse(JSON.stringify(data))
        const raw = data && data.res
        const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
        const rawParams: any = Array.isArray(raw) ? raw[2] : undefined

        // Handle balance updates
        if ((response && response.method === RPCMethod.GetLedgerBalances) || rawMethod === 'get_ledger_balances') {
          const params: any = (response as any)?.params ?? rawParams
          const list: any[] = Array.isArray(params) ? params : (Array.isArray(params?.ledger_balances) ? params.ledger_balances : [])
          const balances = Object.fromEntries(list.map((b: any) => [b.asset, b.amount]))
          
          // Update all sessions with this balance update
          this.sessions.forEach(session => {
            session.balances = { ...session.balances, ...balances }
            session.lastActivity = Date.now()
          })
        }

        // Handle channel updates
        if ((response && response.method === RPCMethod.GetChannels) || rawMethod === 'get_channels') {
          const params: any = (response as any)?.params ?? rawParams
          const channels: any[] = Array.isArray(params?.channels) ? params.channels : []
          
          // Update channels for all sessions
          this.sessions.forEach(session => {
            session.channels = channels.map((ch: any) => ({
              channelId: ch.channel_id,
              chainId: ch.chain_id,
              asset: ch.token,
              amount: ch.amount,
              status: ch.status,
              participants: ch.participants || [session.address]
            }))
            session.lastActivity = Date.now()
          })
        }

        // Handle transfer notifications
        if ((response && response.method === RPCMethod.Transfer) || rawMethod === 'transfer' || rawMethod === 'tr') {
          const params: any = (response as any)?.params ?? rawParams
          const transactions = Array.isArray(params?.transactions) ? params.transactions : []
          
          transactions.forEach((tx: any) => {
            // Update balances for both sender and receiver
            this.sessions.forEach(session => {
              if (session.address === tx.from_account || session.address === tx.to_account) {
                session.lastActivity = Date.now()
              }
            })
          })
        }

        // Notify all listeners
        this.messageListeners.forEach(listener => listener(data))
      } catch (e) {
        // Ignore parsing errors
      }
    }

    webSocketService.addMessageListener(listener)
  }

  createSession(address: Address, sessionKey: SessionKey): UserSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: UserSession = {
      address,
      sessionKey,
      isAuthenticated: false,
      sessionId,
      balances: {},
      channels: [],
      lastActivity: Date.now()
    }
    
    this.sessions.set(address, session)
    return session
  }

  getSession(address: Address): UserSession | null {
    return this.sessions.get(address) || null
  }

  updateSession(address: Address, updates: Partial<UserSession>): void {
    const session = this.sessions.get(address)
    if (session) {
      Object.assign(session, updates)
      session.lastActivity = Date.now()
    }
  }

  async fetchBalances(address: Address): Promise<Record<string, string>> {
    const session = this.getSession(address)
    if (!session) throw new Error('Session not found')

    const signer = createECDSAMessageSigner(session.sessionKey.privateKey)
    const payload = await createGetLedgerBalancesMessage(signer, address)
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        webSocketService.removeMessageListener(listener)
        reject(new Error('Timeout waiting for balances'))
      }, 15000)

      const listener = (data: any) => {
        try {
          const response = parseAnyRPCResponse(JSON.stringify(data))
          const raw = data && data.res
          const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
          const rawParams: any = Array.isArray(raw) ? raw[2] : undefined
          
          if ((response && response.method === RPCMethod.GetLedgerBalances) || rawMethod === 'get_ledger_balances') {
            clearTimeout(timeout)
            webSocketService.removeMessageListener(listener)
            const params: any = (response as any)?.params ?? rawParams
            const list: any[] = Array.isArray(params) ? params : (Array.isArray(params?.ledger_balances) ? params.ledger_balances : [])
            const balances = Object.fromEntries(list.map((b: any) => [b.asset, b.amount]))
            this.updateSession(address, { balances })
            resolve(balances)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      webSocketService.addMessageListener(listener)
      webSocketService.send(payload)
    })
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    const session = this.getSession(request.to)
    if (!session) throw new Error('Recipient session not found')

    const senderSession = this.sessions.get(request.to)
    if (!senderSession) throw new Error('Sender session not found')

    try {
      const signer = createECDSAMessageSigner(senderSession.sessionKey.privateKey)
      const payload = await createTransferMessage(signer, {
        destination: request.to,
        allocations: [{
          asset: request.asset,
          amount: request.amount
        }]
      })

      webSocketService.send(payload)
      
      return {
        success: true,
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      }
    }
  }

  addMessageListener(listener: (data: any) => void): void {
    this.messageListeners.add(listener)
  }

  removeMessageListener(listener: (data: any) => void): void {
    this.messageListeners.delete(listener)
  }

  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values())
  }

  cleanup(): void {
    this.sessions.clear()
    this.messageListeners.clear()
  }
}

export const sessionManager = new SessionManager()
