import { useState } from 'react'
import styles from './LandingPage.module.css'

interface LandingPageProps {
  onStartRegistration: () => void
}

export function LandingPage({ onStartRegistration }: LandingPageProps) {
  const [currentStep, setCurrentStep] = useState<'hero' | 'send-methods' | 'wallet-connect' | 'processing'>('hero')
  const [sendMethod, setSendMethod] = useState<'bank' | 'card' | 'wallet'>('bank')

  const handleStartFlow = () => {
    setCurrentStep('send-methods')
  }

  const handleSendMethodSelect = (method: 'bank' | 'card' | 'wallet') => {
    setSendMethod(method)
    setCurrentStep('wallet-connect')
  }

  const handleWalletConnect = () => {
    setCurrentStep('processing')
    // Simulate processing time
    setTimeout(() => {
      onStartRegistration()
    }, 3000)
  }

  if (currentStep === 'hero') {
    return (
      <div className={styles.landingPage}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Send money home instantly, earn yield automatically
            </h1>
            <div className={styles.valueProps}>
              <div className={styles.valueProp}>
                <span className={styles.valueNumber}>2%</span>
                <span className={styles.valueText}>fees vs 15% traditional</span>
              </div>
              <div className={styles.valueProp}>
                <span className={styles.valueNumber}>Instant</span>
                <span className={styles.valueText}>vs 3-7 days</span>
              </div>
            </div>
            <button 
              className={styles.ctaButton}
              onClick={handleStartFlow}
            >
              Send Money Now
            </button>
          </div>
            <div className={styles.heroVisual}>
              <div className={styles.visualCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Yellow Network</span>
                  <span className={styles.cardStatus}>Live</span>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.transferFlow}>
                    <div className={styles.transferStep}>
                      <span>Open Channel</span>
                    </div>
                    <div className={styles.arrow}>→</div>
                    <div className={styles.transferStep}>
                      <span>Instant Transfer</span>
                    </div>
                    <div className={styles.arrow}>→</div>
                    <div className={styles.transferStep}>
                      <span>Earn Yield</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>Yellow Network</h3>
            <p>Decentralized settlement layer for instant cross-border payments</p>
          </div>
          <div className={styles.feature}>
            <h3>Nitrolite ERC-7824</h3>
            <p>Gasless state channels for micro-transactions</p>
          </div>
          <div className={styles.feature}>
            <h3>Secure & Trustless</h3>
            <p>Cryptographic guarantees with Web3 security</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'send-methods') {
    return (
      <div className={styles.landingPage}>
        <div className={styles.sendMethods}>
          <div className={styles.methodsCard}>
            <h2>How do you want to send money?</h2>
            
            <div className={styles.methods}>
              <div 
                className={`${styles.method} ${sendMethod === 'bank' ? styles.selected : ''}`}
                onClick={() => setSendMethod('bank')}
              >
                <div className={styles.methodRadio}>
                  <div className={styles.radioDot}></div>
                </div>
                <div className={styles.methodContent}>
                  <div className={styles.methodTitle}>Bank Transfer</div>
                  <div className={styles.methodSubtitle}>Emirates NBD •••• 1234</div>
                  <div className={styles.methodFee}>Free</div>
                </div>
              </div>

              <div 
                className={`${styles.method} ${sendMethod === 'card' ? styles.selected : ''}`}
                onClick={() => setSendMethod('card')}
              >
                <div className={styles.methodRadio}>
                  <div className={styles.radioDot}></div>
                </div>
                <div className={styles.methodContent}>
                  <div className={styles.methodTitle}>Credit/Debit Card</div>
                  <div className={styles.methodSubtitle}>Visa •••• 5678</div>
                  <div className={styles.methodFee}>+1% fee</div>
                </div>
              </div>

              <div 
                className={`${styles.method} ${sendMethod === 'wallet' ? styles.selected : ''}`}
                onClick={() => setSendMethod('wallet')}
              >
                <div className={styles.methodRadio}>
                  <div className={styles.radioDot}></div>
                </div>
                <div className={styles.methodContent}>
                  <div className={styles.methodTitle}>MetaMask Wallet</div>
                  <div className={styles.methodSubtitle}>Connect wallet for crypto payment</div>
                  <div className={styles.methodFee}>Gas fees only</div>
                </div>
              </div>
            </div>

            <button 
              className={styles.continueButton}
              onClick={() => handleSendMethodSelect(sendMethod)}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'wallet-connect') {
    return (
      <div className={styles.landingPage}>
        <div className={styles.walletConnect}>
          <div className={styles.connectCard}>
            <h2>Connect Your Wallet</h2>
            <p className={styles.connectDescription}>
              Connect your MetaMask wallet to complete the transaction
            </p>
            
            <div className={styles.walletInfo}>
              <div className={styles.walletIcon}>MetaMask</div>
              <div className={styles.walletDetails}>
                <div className={styles.walletName}>MetaMask Wallet</div>
                <div className={styles.walletAddress}>0x1234...5678</div>
              </div>
            </div>

            <div className={styles.transactionSummary}>
              <h3>Transaction Summary:</h3>
              <div className={styles.summaryRow}>
                <span>Amount:</span>
                <span>1840 AED → ₹41,500</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Fee:</span>
                <span>37 AED</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Total:</span>
                <span>1877 AED</span>
              </div>
            </div>

            <button 
              className={styles.connectButton}
              onClick={handleWalletConnect}
            >
              Connect Wallet →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'processing') {
    return (
      <div className={styles.landingPage}>
        <div className={styles.processing}>
          <div className={styles.processingCard}>
            <div className={styles.processingHeader}>
              <h2>Processing...</h2>
            </div>

            <div className={styles.processingSteps}>
              <div className={styles.processingStep}>
                <div className={styles.stepIcon}>✓</div>
                <span>Transfer Initiated</span>
              </div>
              <div className={styles.processingStep}>
                <div className={styles.stepIcon}>⏳</div>
                <span>Bank Processing</span>
              </div>
              <div className={styles.processingStep}>
                <div className={styles.stepIcon}>⏳</div>
                <span>Confirmation Pending</span>
              </div>
            </div>

            <div className={styles.transferDetails}>
              <div className={styles.detailRow}>
                <span>To:</span>
                <span>State Bank of India</span>
              </div>
              <div className={styles.detailRow}>
                <span>Account:</span>
                <span>••••••••••••1234</span>
              </div>
              <div className={styles.detailRow}>
                <span>Amount:</span>
                <span>₹29,050</span>
              </div>
            </div>

            <div className={styles.processingNote}>
              <span>Usually takes 5-30 seconds</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
