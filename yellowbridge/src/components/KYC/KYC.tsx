import { useState } from 'react'
import styles from './KYC.module.css'

interface KYCProps {
  onComplete: () => void
  onBack: () => void
}

export function KYC({ onComplete, onBack }: KYCProps) {
  const [step, setStep] = useState<'passport' | 'complete'>('passport')
  const [formData, setFormData] = useState({
    passportNumber: '',
    fullName: '',
    nationality: 'UAE',
    expiryDate: ''
  })

  const handlePassportSubmit = () => {
    if (formData.passportNumber && formData.fullName && formData.expiryDate) {
      setStep('complete')
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }

  const nationalities = [
    { code: 'UAE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' }
  ]

  return (
    <div className={styles.kycContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <h2>Passport Authentication</h2>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: step === 'passport' ? '50%' : '100%' }}
            />
          </div>
          <span className={styles.progressText}>
            {step === 'passport' ? '1/2' : '2/2'}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {step === 'passport' && (
          <div className={styles.step}>
            <h3>Passport Verification</h3>
            <p className={styles.stepDescription}>
              Upload your passport photo and enter details for verification
            </p>
            
            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Full Name (as on passport)</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ahmed Al-Rashid"
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Passport Number</label>
                <input
                  type="text"
                  value={formData.passportNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                  placeholder="A12345678"
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                >
                  {nationalities.map(nationality => (
                    <option key={nationality.code} value={nationality.code}>
                      {nationality.flag} {nationality.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.uploadArea}>
              <div className={styles.uploadIcon}>📷</div>
              <h4>Upload Passport Photo</h4>
              <p>Take a clear photo of your passport information page</p>
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
              />
              <button className={styles.uploadButton}>
                Choose Passport Photo
              </button>
            </div>
            
            <div className={styles.uploadTips}>
              <h4>Photo Requirements:</h4>
              <ul>
                <li>Clear, well-lit photo of passport information page</li>
                <li>All text must be readable</li>
                <li>Passport must be fully visible</li>
                <li>No shadows or glare</li>
              </ul>
            </div>

            <div className={styles.verificationNote}>
              <div className={styles.noteIcon}>🔍</div>
              <p>Your passport will be verified before final settlements. This usually takes 1-2 business days.</p>
            </div>
            
            <button 
              onClick={handlePassportSubmit}
              disabled={!formData.passportNumber || !formData.fullName || !formData.expiryDate}
              className={styles.primaryButton}
            >
              Submit for Verification
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className={styles.step}>
            <div className={styles.success}>
              <div className={styles.checkmark}>✓</div>
              <h3>Passport Submitted!</h3>
              <p>Your passport is being verified. You'll receive a notification once verification is complete.</p>
              <div className={styles.verifiedBadge}>
                <span className={styles.badgeIcon}>⏳</span>
                <span>Under Review</span>
              </div>
              <div className={styles.nextSteps}>
                <h4>Next Steps:</h4>
                <ul>
                  <li>Verification typically takes 1-2 business days</li>
                  <li>You'll receive an email notification when complete</li>
                  <li>You can start using the app once verified</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
