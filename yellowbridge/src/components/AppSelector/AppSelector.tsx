import { useState } from 'react'
import styles from './AppSelector.module.css'
import type { Application } from '../../lib/AppRegistry'

interface AppSelectorProps {
  applications: Application[]
  onSelectApp: (app: Application) => void
  selectedApp?: Application | null
}

export function AppSelector({ applications, onSelectApp, selectedApp }: AppSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredApps = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'remittance': return '#3b82f6'
      case 'sponsorship': return '#8b5cf6'
      case 'yield': return '#10b981'
      case 'gaming': return '#f59e0b'
      case 'social': return '#ec4899'
      default: return '#6b7280'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'remittance': return '🌍'
      case 'sponsorship': return '💝'
      case 'yield': return '🌾'
      case 'gaming': return '🎮'
      case 'social': return '👥'
      default: return '📱'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Select Application</h3>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.appsGrid}>
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className={`${styles.appCard} ${selectedApp?.id === app.id ? styles.selected : ''}`}
            onClick={() => onSelectApp(app)}
          >
            <div className={styles.appIcon}>
              {app.icon}
            </div>
            <div className={styles.appInfo}>
              <h4 className={styles.appName}>{app.name}</h4>
              <p className={styles.appDescription}>{app.description}</p>
              <div className={styles.appMeta}>
                <span 
                  className={styles.category}
                  style={{ backgroundColor: getCategoryColor(app.category) }}
                >
                  {getCategoryIcon(app.category)} {app.category}
                </span>
                <span className={styles.status}>
                  {app.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
            </div>
            <div className={styles.appConfig}>
              <div className={styles.configRow}>
                <span>Min:</span>
                <span>${app.config.minAmount}</span>
              </div>
              <div className={styles.configRow}>
                <span>Max:</span>
                <span>${app.config.maxAmount}</span>
              </div>
              <div className={styles.configRow}>
                <span>Fees:</span>
                <span>{app.config.fees.percentage}% + ${app.config.fees.fixed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className={styles.emptyState}>
          <p>No applications found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}
