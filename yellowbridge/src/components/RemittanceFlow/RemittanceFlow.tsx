import { useState, useEffect } from 'react'
import type { Address } from 'viem'
import styles from './RemittanceFlow.module.css'
import { useSession } from '../../hooks/useSession'
import type { SessionKey } from '../../lib/utils'
import type { QuoteResponse } from '../../lib/QuoteService'

interface RemittanceFlowProps {
  senderAddress: Address
  sessionKey: SessionKey
  isAuthenticated: boolean
  onComplete?: (transactionId: string) => void
}

export function RemittanceFlow({ senderAddress, sessionKey, isAuthenticated, onComplete }: RemittanceFlowProps) {
  const { session, transfer, getQuote, isLoading, error } = useSession(senderAddress, sessionKey, isAuthenticated)
  const [step, setStep] = useState<'amount' | 'quote' | 'confirm' | 'processing' | 'complete'>('amount')
  const [formData, setFormData] = useState({
    amount: '',
    recipientCountry: 'IN',
    recipientAddress: '',
    memo: ''
  })
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const countries = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
  ]

  const handleAmountSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return
    
    try {
      const quoteResponse = await getQuote({
        fromAmount: formData.amount,
        fromCurrency: 'USD',
        toCurrency: 'INR',
        recipientCountry: formData.recipientCountry
      })
      setQuote(quoteResponse)
      setStep('quote')
    } catch (err) {
      console.error('Failed to get quote:', err)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!quote) return
    
    setStep('processing')
    try {
      const result = await transfer({
        to: formData.recipientAddress as Address,
        amount: formData.amount,
        asset: 'ytest.usd',
        memo: formData.memo
      })
      
      if (result.success) {
        setTransactionId(result.transactionId || '')
        setStep('complete')
        onComplete?.(result.transactionId || '')
      }
    } catch (err) {
      console.error('Transfer failed:', err)
      setStep('quote')
    }
  }

  const resetFlow = () => {
    setStep('amount')
    setFormData({
      amount: '',
      recipientCountry: 'IN',
      recipientAddress: '',
      memo: ''
    })
    setQuote(null)
    setTransactionId(null)
  }

  if (!session) return null

  return (
    <div className={styles.container}>
      <h2>Send Money to Family</h2>
      
      {step === 'amount' && (
        <div className={styles.step}>
          <h3>Enter Amount</h3>
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Amount (USD)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="500.00"
                min="1"
                step="0.01"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Recipient Country</label>
              <select
                value={formData.recipientCountry}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientCountry: e.target.value }))}
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Recipient Address</label>
              <input
                type="text"
                value={formData.recipientAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                placeholder="0x..."
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Memo (Optional)</label>
              <input
                type="text"
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="For family expenses"
              />
            </div>
            
            <button 
              onClick={handleAmountSubmit}
              disabled={!formData.amount || !formData.recipientAddress || isLoading}
              className={styles.primaryButton}
            >
              Get Quote
            </button>
          </div>
        </div>
      )}

      {step === 'quote' && quote && (
        <div className={styles.step}>
          <h3>🟡 Review Your Transfer</h3>
          <p style={{ color: '#cccccc', textAlign: 'center', marginBottom: '20px' }}>
            Powered by Yellow Network + Nitrolite ERC-7824
          </p>
          <div className={styles.quoteCard}>
            <div className={styles.quoteRow}>
              <span>You send:</span>
              <span>${quote.fromAmount} USD</span>
            </div>
            <div className={styles.quoteRow}>
              <span>They receive:</span>
              <span>₹{quote.toAmount} INR</span>
            </div>
            <div className={styles.quoteRow}>
              <span>Exchange rate:</span>
              <span>1 USD = ₹{quote.exchangeRate}</span>
            </div>
            <div className={styles.fees}>
              <h4>Fees Breakdown</h4>
              <div className={styles.quoteRow}>
                <span>Platform fee (0.1%):</span>
                <span>${quote.fees.platform}</span>
              </div>
              <div className={styles.quoteRow}>
                <span>Network fee:</span>
                <span>Free (Gasless)</span>
              </div>
              <div className={styles.quoteRow}>
                <span>Total fees:</span>
                <span>${quote.fees.total}</span>
              </div>
              <div className={styles.gaslessNote}>
                ⚡ Powered by Yellow Network + Nitrolite ERC-7824
              </div>
            </div>
            <div className={styles.quoteRow}>
              <span>Delivery time:</span>
              <span>Instant (Off-chain)</span>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button onClick={() => setStep('amount')} className={styles.secondaryButton}>
              Back
            </button>
            <button 
              onClick={handleConfirmTransfer}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className={styles.step}>
          <div className={styles.processing}>
            <div className={styles.spinner}></div>
            <h3>Processing Transfer...</h3>
            <p>This usually takes a few seconds</p>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className={styles.step}>
          <div className={styles.success}>
            <div className={styles.checkmark}>✓</div>
            <h3>Transfer Complete!</h3>
            <p>Your money has been sent successfully</p>
            {transactionId && (
              <div className={styles.transactionId}>
                Transaction ID: {transactionId}
              </div>
            )}
            <button onClick={resetFlow} className={styles.primaryButton}>
              Send Another
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
