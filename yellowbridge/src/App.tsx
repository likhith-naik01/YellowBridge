import { useEffect, useState } from 'react'
import './App.css'

import type { Address, WalletClient } from 'viem'
import { connectWallet } from './wallet'
import { webSocketService, type WsStatus } from './lib/websocket'
// Authentication imports
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  parseAnyRPCResponse,
  RPCMethod,
  type AuthChallengeResponse,
  type AuthRequestParams,
} from '@erc7824/nitrolite'
// Balance helpers
import {
  createECDSAMessageSigner,
  createGetLedgerBalancesMessage,
} from '@erc7824/nitrolite'
import {
  generateSessionKey,
  getStoredSessionKey,
  storeSessionKey,
  removeSessionKey,
  storeJWT,
  removeJWT,
  type SessionKey,
} from './lib/utils'
// UI Components
import { BalanceDisplay } from './components/BalanceDisplay/BalanceDisplay'
import { SandboxPanel } from './components/SandboxPanel/SandboxPanel'
import { RemittanceFlow } from './components/RemittanceFlow/RemittanceFlow'
import { ChannelManager } from './components/ChannelManager/ChannelManager'
import { AppSelector } from './components/AppSelector/AppSelector'
import { useSession } from './hooks/useSession'
import { useTransfer } from './hooks/useTransfer'

function App() {
  const [account, setAccount] = useState<Address | null>(null)
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected')
  // Authentication state
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthAttempted, setIsAuthAttempted] = useState(false)
  const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('')
  // Balances state (legacy - now handled by useSession)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferStatus, setTransferStatus] = useState<string | null>(null)
  // UI state
  const [currentView, setCurrentView] = useState<'dashboard' | 'remittance' | 'channels' | 'apps'>('dashboard')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  
  const { handleTransfer: transferFn } = useTransfer(sessionKey, isAuthenticated)
  const { session, applications, fetchBalances } = useSession(account, sessionKey, isAuthenticated)

  // Family recipient (from env)
  const FAMILY_RECIPIENT = (import.meta as any).env?.VITE_FAMILY_RECIPIENT as Address | undefined

  // CHAPTER 3: EIP-712 domain & constants
  const getAuthDomain = () => ({ name: 'YellowBridge' })
  const AUTH_SCOPE = 'yellowbridge.app'
  const APP_NAME = 'YellowBridge'
  const SESSION_DURATION = 3600

  useEffect(() => {
    // Session key persistence
    const existing = getStoredSessionKey()
    if (existing) setSessionKey(existing)
    else {
      const sk = generateSessionKey()
      storeSessionKey(sk)
      setSessionKey(sk)
    }

    webSocketService.addStatusListener(setWsStatus)
    webSocketService.connect()
    return () => {
      webSocketService.removeStatusListener(setWsStatus)
    }
  }, [])

  const onConnect = async () => {
    try {
      const { account: addr, walletClient: wc } = await connectWallet()
      setWalletClient(wc)
      setAccount(addr)
    } catch (err) {
      console.error('Failed to connect wallet', err)
      alert('Failed to connect wallet')
    }
  }

  const formatAddress = (addr: Address) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  // CHAPTER 3: Auto-auth when connected
  useEffect(() => {
    if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
      setIsAuthAttempted(true)
      const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION)
      setSessionExpireTimestamp(expireTimestamp)

      const authParams: AuthRequestParams = {
        address: account as `0x${string}`,
        session_key: sessionKey.address as `0x${string}`,
        app_name: APP_NAME,
        expire: expireTimestamp,
        scope: AUTH_SCOPE,
        application: account as `0x${string}`,
        allowances: [],
      }

      createAuthRequestMessage(authParams).then((payload) => {
        webSocketService.send(payload)
      })
    }
  }, [account, sessionKey, wsStatus, isAuthenticated, isAuthAttempted])

  // CHAPTER 3/4: Handle WS messages (auth, balances, transfers)
  useEffect(() => {
    const handleMessage = async (data: any) => {
      let response: any
      try {
        response = parseAnyRPCResponse(JSON.stringify(data))
      } catch {
        response = null
      }

      // Also support raw Clearnode shape: { res: [id, method, params, ts], sig: [] }
      const raw = data && data.res
      const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
      const rawParams: any = Array.isArray(raw) ? raw[2] : undefined

      if (
        ((response && response.method === RPCMethod.AuthChallenge) || rawMethod === 'auth_challenge') &&
        walletClient &&
        sessionKey &&
        account &&
        sessionExpireTimestamp
      ) {
        const challengeResponse = (response || {}) as AuthChallengeResponse
        const authParams = {
          scope: AUTH_SCOPE,
          application: (walletClient.account?.address as `0x${string}`) || (account as `0x${string}`),
          participant: sessionKey.address as `0x${string}`,
          expire: sessionExpireTimestamp,
          allowances: [],
        }
        const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain())
        try {
          const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse)
          webSocketService.send(authVerifyPayload)
        } catch (error) {
          alert('Signature rejected. Please try again.')
          setIsAuthAttempted(false)
        }
      }

      if ((response && response.method === RPCMethod.AuthVerify && (response as any).params?.success) || (rawMethod === 'auth_verify' && rawParams?.success)) {
        setIsAuthenticated(true)
        const jwt = (response as any)?.params?.jwtToken || rawParams?.jwt_token
        if (jwt) storeJWT(jwt)
      }

      // CHAPTER 4: Handle balances response
      if ((response && response.method === RPCMethod.GetLedgerBalances) || rawMethod === 'get_ledger_balances') {
        const params: any = (response as any)?.params ?? rawParams
        const list: any[] = Array.isArray(params)
          ? params
          : (Array.isArray(params?.ledger_balances) ? params.ledger_balances : [])
        if (list.length > 0) {
          const map = Object.fromEntries(list.map((b: any) => [b.asset, b.amount]))
          // SessionManager will handle this via its message listener
        } else {
          // SessionManager will handle this via its message listener
        }
        setIsLoadingBalances(false)
      }

      // CHAPTER 4: Handle live balance updates
      if ((response && response.method === RPCMethod.BalanceUpdate) || rawMethod === 'bu' || rawMethod === 'balance_updates') {
        const params: any = (response as any)?.params ?? rawParams
        const list: any[] = Array.isArray(params)
          ? params
          : (Array.isArray(params?.balance_updates) ? params.balance_updates : [])
        // SessionManager will handle this via its message listener
      }

      // FINAL: Handle transfer confirmation/notification
      if ((response && response.method === RPCMethod.Transfer) || rawMethod === 'transfer' || rawMethod === 'tr') {
        const p = (response as any)?.params ?? rawParams
        console.log('Transfer completed:', p)
        setIsTransferring(false)
        setTransferStatus(null)
        alert('Transfer completed successfully!')
      }

      if ((response && response.method === RPCMethod.Error) || rawMethod === 'error') {
        const errParams = (response as any)?.params ?? rawParams
        console.error('RPC Error:', errParams)
        if (isTransferring) {
          setIsTransferring(false)
          setTransferStatus(null)
          alert(`Transfer failed: ${errParams?.error || 'Unknown error'}`)
        } else {
          removeJWT()
          removeSessionKey()
          alert(`Authentication failed: ${errParams?.error || 'Unknown error'}`)
          setIsAuthAttempted(false)
        }
      }
    }

    webSocketService.addMessageListener(handleMessage)
    return () => webSocketService.removeMessageListener(handleMessage)
  }, [walletClient, sessionKey, sessionExpireTimestamp, account])

  // CHAPTER 4: Fetch balances once authenticated
  useEffect(() => {
    if (isAuthenticated && sessionKey && account) {
      setIsLoadingBalances(true)
      const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey)
      createGetLedgerBalancesMessage(sessionSigner, account)
        .then((payload: string) => webSocketService.send(payload))
        .catch(() => setIsLoadingBalances(false))
    }
  }, [isAuthenticated, sessionKey, account])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>YellowBridge</h1>
          <p>Instant Remittance with State Channels</p>
        </div>
        <div className="header-controls">
          {isAuthenticated && session && (
            <BalanceDisplay
              balance={isLoadingBalances ? 'Loading...' : (session.balances?.['ytest.usd'] ?? session.balances?.['usdc'] ?? '0.00')}
              symbol="USD"
            />
          )}
          <div className={`ws-status ${wsStatus.toLowerCase()}`}>
            <span className="dot" /> {wsStatus}
          </div>
          <div className="wallet-connector">
            {account ? (
              <div className="wallet-info">
                <span className="address">{formatAddress(account)}</span>
                {session && (
                  <span className="session-id">Session: {session.sessionId.slice(-8)}</span>
                )}
              </div>
            ) : (
              <button onClick={onConnect} className="connect-button">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {transferStatus && (
        <div className="transfer-status">{transferStatus}</div>
      )}

      {account && isAuthenticated ? (
        <main className="app-main">
          <nav className="app-nav">
            <button 
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={currentView === 'remittance' ? 'active' : ''}
              onClick={() => setCurrentView('remittance')}
            >
              Send Money
            </button>
            <button 
              className={currentView === 'channels' ? 'active' : ''}
              onClick={() => setCurrentView('channels')}
            >
              Channels
            </button>
            <button 
              className={currentView === 'apps' ? 'active' : ''}
              onClick={() => setCurrentView('apps')}
            >
              Applications
            </button>
          </nav>

          <div className="app-content">
            {currentView === 'dashboard' && (
              <div className="dashboard">
                <h2>Dashboard</h2>
                <div className="dashboard-grid">
                  <div className="dashboard-card">
                    <h3>Quick Actions</h3>
                    <button
                      onClick={async () => {
                        if (!account) return alert('Connect wallet first')
                        if (!isAuthenticated) return alert('Authenticating...')
                        if (!FAMILY_RECIPIENT) return alert('Missing VITE_FAMILY_RECIPIENT in .env.local')
                        setIsTransferring(true)
                        setTransferStatus('Sending $500 to family...')
                        const res = await transferFn(FAMILY_RECIPIENT as Address, '500')
                        if (!res.success) {
                          setIsTransferring(false)
                          setTransferStatus(null)
                          if (res.error) alert(res.error)
                        }
                      }}
                      disabled={!account || !isAuthenticated || isTransferring}
                      className="action-button"
                    >
                      {(!account && 'Connect Wallet') || (!isAuthenticated && 'Authenticating...') || (isTransferring ? 'Sending...' : 'Send $500 to Family')}
                    </button>
                    <button
                      onClick={() => setCurrentView('remittance')}
                      className="action-button secondary"
                    >
                      Custom Transfer
                    </button>
                    <button
                      onClick={() => setCurrentView('channels')}
                      className="action-button secondary"
                    >
                      Manage Channels
                    </button>
                  </div>
                  
                  <div className="dashboard-card">
                    <h3>Session Info</h3>
                    {session && (
                      <div className="session-info">
                        <p><strong>Session ID:</strong> {session.sessionId}</p>
                        <p><strong>Address:</strong> {formatAddress(session.address)}</p>
                        <p><strong>Status:</strong> {session.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
                        <p><strong>Last Activity:</strong> {new Date(session.lastActivity).toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card">
                    <h3>Balances</h3>
                    {session?.balances && Object.keys(session.balances).length > 0 ? (
                      <div className="balances">
                        {Object.entries(session.balances).map(([asset, amount]) => (
                          <div key={asset} className="balance-item">
                            <span className="asset">{asset}</span>
                            <span className="amount">{parseFloat(amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No balances found</p>
                    )}
                    <button onClick={fetchBalances} className="refresh-button">
                      Refresh Balances
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'remittance' && account && sessionKey && (
              <RemittanceFlow
                senderAddress={account}
                sessionKey={sessionKey}
                isAuthenticated={isAuthenticated}
                onComplete={(transactionId) => {
                  console.log('Transfer completed:', transactionId)
                  setCurrentView('dashboard')
                }}
              />
            )}

            {currentView === 'channels' && account && sessionKey && (
              <ChannelManager
                senderAddress={account}
                sessionKey={sessionKey}
                isAuthenticated={isAuthenticated}
              />
            )}

            {currentView === 'apps' && (
              <div className="apps-view">
                <h2>Applications</h2>
                <AppSelector
                  applications={applications}
                  onSelectApp={setSelectedApp}
                  selectedApp={selectedApp}
                />
                {selectedApp && (
                  <div className="selected-app">
                    <h3>{selectedApp.name}</h3>
                    <p>{selectedApp.description}</p>
                    <div className="app-actions">
                      <button className="action-button">
                        Launch {selectedApp.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>
        </main>
      ) : (
        <main className="app-main">
          <div className="welcome">
            <h2>Welcome to YellowBridge</h2>
            <p>Connect your wallet to start sending money instantly with state channels</p>
            <button onClick={onConnect} className="connect-button large">
              Connect Wallet to Continue
        </button>
          </div>
        </main>
      )}

      {account && sessionKey && (
        <SandboxPanel account={account} sessionKey={sessionKey} isAuthenticated={isAuthenticated} />
      )}
      </div>
  )
}

export default App
