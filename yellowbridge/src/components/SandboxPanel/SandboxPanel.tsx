import { useEffect, useMemo, useState } from 'react'
import type { Address } from 'viem'
import styles from './SandboxPanel.module.css'
import { webSocketService } from '../../lib/websocket'
import { getBalances } from '../../lib/getbalance'
import { useTransfer } from '../../hooks/useTransfer'
import type { SessionKey } from '../../lib/utils'

type WsResp = any

interface SandboxPanelProps {
  account: Address
  sessionKey: SessionKey
  isAuthenticated: boolean
}

export function SandboxPanel({ account, sessionKey, isAuthenticated }: SandboxPanelProps) {
  const [isMinimized, setIsMinimized] = useState(true)
  const [log, setLog] = useState<string>('')
  const [assets, setAssets] = useState<any[] | null>(null)
  const [channels, setChannels] = useState<any[] | null>(null)
  const [balances, setBalances] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Inputs
  const [chainId, setChainId] = useState<string>('80002')
  const [tokenAddress, setTokenAddress] = useState<string>('')
  const [channelId, setChannelId] = useState<string>('')
  const [resizeAmount, setResizeAmount] = useState<string>('10')
  const familyRecipient = useMemo(() => (import.meta as any).env?.VITE_FAMILY_RECIPIENT as Address | undefined, [])
  const { handleTransfer } = useTransfer(sessionKey, isAuthenticated)
  const sandboxAsset = (import.meta as any).env?.VITE_SANDBOX_ASSET || 'ytest.usd'

  useEffect(() => {
    const listener = (data: WsResp) => {
      try {
        const method = Array.isArray(data?.res) ? data.res[1] : undefined
        if (method === 'get_assets') {
          const params = data.res[2]
          setAssets(params?.assets || [])
          setLog((l) => l + `\nget_assets: ${JSON.stringify(params)}`)
        }
        if (method === 'get_channels') {
          const params = data.res[2]
          setChannels(params?.channels || [])
          setLog((l) => l + `\nget_channels: ${JSON.stringify(params)}`)
        }
        // Channel ops are disabled until signed helpers are added
        if (method === 'error') {
          setLog((l) => l + `\nerror: ${JSON.stringify(data.res?.[2])}`)
        }
      } catch {}
    }
    webSocketService.addMessageListener(listener)
    return () => webSocketService.removeMessageListener(listener)
  }, [])

  const doFaucet = async () => {
    setLoading('faucet')
    try {
      const res = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: account }),
      })
      const j = await res.json().catch(() => ({}))
      setLog((l) => l + `\nfaucet: ${res.status} ${JSON.stringify(j)}`)
    } catch (e: any) {
      setLog((l) => l + `\nfaucet error: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }

  const doGetAssets = async () => {
    setLoading('get_assets')
    webSocketService.send(JSON.stringify({ req: [Date.now(), 'get_assets', { chain_id: Number(chainId) }, Date.now()], sig: [] }))
    setLoading(null)
  }

  const doGetChannels = async () => {
    setLoading('get_channels')
    webSocketService.send(JSON.stringify({ req: [Date.now(), 'get_channels', { participant: account, status: 'open', sort: 'desc' }, Date.now()], sig: [] }))
    setLoading(null)
  }

  const doGetBalances = async () => {
    setLoading('balances')
    try {
      const b = await getBalances(account, sessionKey.privateKey)
      setBalances(b)
      setLog((l) => l + `\nbalances: ${JSON.stringify(b)}`)
    } catch (e: any) {
      setLog((l) => l + `\nbalances error: ${e?.message || e}`)
    } finally {
      setLoading(null)
    }
  }

  // Channel ops removed: require signed RPC builders from SDK

  const doTransfer500 = async () => {
    if (!familyRecipient) return alert('Set VITE_FAMILY_RECIPIENT in .env.local')
    setLoading('transfer')
    try {
      const res = await handleTransfer(familyRecipient, '500', sandboxAsset)
      if (!res.success) alert(res.error || 'transfer failed')
      else setLog((l) => l + `\ntransfer: 500 usdc to ${familyRecipient}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsMinimized(!isMinimized)}>
        <h3>Sandbox Tools</h3>
        <button className={styles.toggleButton}>
          {isMinimized ? '▼' : '▲'}
        </button>
      </div>
      
      {!isMinimized && (
        <div className={styles.content}>
          <div className={styles.row}>
            <button onClick={doFaucet} disabled={!isAuthenticated || loading!==null}>Faucet → Unified</button>
            <button onClick={doGetBalances} disabled={!isAuthenticated || loading!==null}>Get Balances</button>
            <button onClick={doTransfer500} disabled={!isAuthenticated || loading!==null}>Send $500 to Family</button>
          </div>
          <div className={styles.row}>
            <label>Chain ID
              <input value={chainId} onChange={(e)=>setChainId(e.target.value)} placeholder="80002" />
            </label>
            <button onClick={doGetAssets} disabled={!isAuthenticated || loading!==null}>Get Assets</button>
          </div>
          <div className={styles.note}>
            Channel operations (create/resize/close) require signed RPC payloads. We've disabled those buttons until we wire the SDK helpers. Use Faucet, Get Balances, Get Assets, and Send $500 for now.
          </div>

          <div className={styles.cols}>
            <div>
              <h4>Balances</h4>
              <pre className={styles.pre}>{balances ? JSON.stringify(balances, null, 2) : '—'}</pre>
            </div>
            <div>
              <h4>Assets</h4>
              <pre className={styles.pre}>{assets ? JSON.stringify(assets, null, 2) : '—'}</pre>
            </div>
            <div>
              <h4>Channels</h4>
              <pre className={styles.pre}>{channels ? JSON.stringify(channels, null, 2) : '—'}</pre>
            </div>
          </div>

          <h4>Log</h4>
          <pre className={styles.pre}>{log || '—'}</pre>
        </div>
      )}
    </div>
  )
}


