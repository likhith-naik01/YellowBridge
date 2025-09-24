import { useState, useEffect } from 'react'
import type { Address } from 'viem'
import styles from './ChannelManager.module.css'
import { useSession } from '../../hooks/useSession'
import type { SessionKey } from '../../lib/utils'
import type { ChannelInfo } from '../../lib/SessionManager'

interface ChannelManagerProps {
  senderAddress: Address
  sessionKey: SessionKey
  isAuthenticated: boolean
}

export function ChannelManager({ senderAddress, sessionKey, isAuthenticated }: ChannelManagerProps) {
  const { session, createChannel, resizeChannel, closeChannel, fetchBalances, isLoading, error } = useSession(senderAddress, sessionKey, isAuthenticated)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    amount: '',
    asset: 'ytest.usd'
  })

  const handleCreateChannel = async () => {
    if (!session || !createFormData.amount) return
    
    try {
      await createChannel({
        chainId: 80002, // Polygon Amoy
        tokenAddress: createFormData.asset,
        amount: createFormData.amount,
        participants: [senderAddress]
      })
      setShowCreateForm(false)
      setCreateFormData({ amount: '', asset: 'ytest.usd' })
    } catch (err) {
      console.error('Failed to create channel:', err)
    }
  }

  const handleResizeChannel = async (channelId: string, amount: string) => {
    if (!session) return
    
    try {
      await resizeChannel({
        channelId,
        allocateAmount: amount,
        resizeAmount: amount,
        fundsDestination: senderAddress
      })
    } catch (err) {
      console.error('Failed to resize channel:', err)
    }
  }

  const handleCloseChannel = async (channelId: string) => {
    if (!session) return
    
    try {
      await closeChannel({
        channelId,
        fundsDestination: senderAddress
      })
    } catch (err) {
      console.error('Failed to close channel:', err)
    }
  }

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#10b981'
      case 'closed': return '#6b7280'
      case 'joining': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Channel Management</h3>
        <button 
          onClick={() => setShowCreateForm(true)}
          className={styles.createButton}
          disabled={isLoading}
        >
          + Create Channel
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <h4>Create New Channel</h4>
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Amount</label>
              <input
                type="number"
                value={createFormData.amount}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="100.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Asset</label>
              <select
                value={createFormData.asset}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, asset: e.target.value }))}
              >
                <option value="ytest.usd">Yellow Test USD</option>
                <option value="usdc">USDC</option>
              </select>
            </div>
            <div className={styles.actions}>
              <button 
                onClick={() => setShowCreateForm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateChannel}
                disabled={!createFormData.amount || isLoading}
                className={styles.confirmButton}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.channelsList}>
        {session?.channels.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No channels found</p>
            <p>Create a channel to enable on-chain settlement</p>
          </div>
        ) : (
          session?.channels.map((channel) => (
            <div key={channel.channelId} className={styles.channelCard}>
              <div className={styles.channelHeader}>
                <div className={styles.channelInfo}>
                  <span className={styles.channelId}>
                    {channel.channelId.slice(0, 8)}...{channel.channelId.slice(-8)}
                  </span>
                  <span 
                    className={styles.status}
                    style={{ color: getStatusColor(channel.status) }}
                  >
                    {channel.status.toUpperCase()}
                  </span>
                </div>
                <div className={styles.amount}>
                  {formatAmount(channel.amount)} {channel.asset}
                </div>
              </div>
              
              <div className={styles.channelDetails}>
                <div className={styles.detailRow}>
                  <span>Chain ID:</span>
                  <span>{channel.chainId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Asset:</span>
                  <span>{channel.asset}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Participants:</span>
                  <span>{channel.participants.length}</span>
                </div>
              </div>

              {channel.status === 'open' && (
                <div className={styles.channelActions}>
                  <button 
                    onClick={() => handleResizeChannel(channel.channelId, '50')}
                    className={styles.actionButton}
                    disabled={isLoading}
                  >
                    Resize +50
                  </button>
                  <button 
                    onClick={() => handleCloseChannel(channel.channelId)}
                    className={styles.closeButton}
                    disabled={isLoading}
                  >
                    Close Channel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
