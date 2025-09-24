// CHAPTER 4: Balance display component
import styles from './BalanceDisplay.module.css'

interface BalanceDisplayProps {
  balance: string | null
  symbol: string
}

export function BalanceDisplay({ balance, symbol }: BalanceDisplayProps) {
  const formattedBalance = balance && balance !== 'Loading...'
    ? Number.parseFloat(balance).toFixed(2)
    : (balance || '0.00')

  return (
    <div className={styles.balanceContainer}>
      <span className={styles.balanceAmount}>{formattedBalance}</span>
      <span className={styles.balanceSymbol}>{symbol}</span>
    </div>
  )
}


