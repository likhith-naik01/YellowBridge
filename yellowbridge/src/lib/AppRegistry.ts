import type { Address } from 'viem'

export interface Application {
  id: string
  name: string
  description: string
  icon: string
  category: 'remittance' | 'sponsorship' | 'yield' | 'gaming' | 'social'
  isActive: boolean
  config: {
    supportedAssets: string[]
    minAmount: string
    maxAmount: string
    fees: {
      fixed: string
      percentage: number
    }
  }
}

export interface ApplicationSession {
  appId: string
  sessionId: string
  participants: Address[]
  state: Record<string, any>
  createdAt: number
  lastActivity: number
}

class AppRegistry {
  private applications = new Map<string, Application>()
  private sessions = new Map<string, ApplicationSession>()

  constructor() {
    this.initializeDefaultApps()
  }

  private initializeDefaultApps() {
    // Remittance App
    this.registerApp({
      id: 'remittance',
      name: 'YellowBridge Remittance',
      description: 'Send money to family worldwide with instant settlement',
      icon: '🌍',
      category: 'remittance',
      isActive: true,
      config: {
        supportedAssets: ['usdc', 'ytest.usd'],
        minAmount: '1.00',
        maxAmount: '10000.00',
        fees: {
          fixed: '0.50',
          percentage: 2.0
        }
      }
    })

    // Sponsorship App
    this.registerApp({
      id: 'sponsorship',
      name: 'Content Sponsorship',
      description: 'Support creators with micro-payments',
      icon: '💝',
      category: 'sponsorship',
      isActive: true,
      config: {
        supportedAssets: ['usdc', 'ytest.usd'],
        minAmount: '0.01',
        maxAmount: '1000.00',
        fees: {
          fixed: '0.00',
          percentage: 0.0
        }
      }
    })

    // Yield Farming App
    this.registerApp({
      id: 'yield',
      name: 'Yield Vault',
      description: 'Earn interest on your stablecoins',
      icon: '🌾',
      category: 'yield',
      isActive: true,
      config: {
        supportedAssets: ['usdc', 'ytest.usd'],
        minAmount: '10.00',
        maxAmount: '1000000.00',
        fees: {
          fixed: '0.00',
          percentage: 0.5
        }
      }
    })

    // Gaming App
    this.registerApp({
      id: 'gaming',
      name: 'Game Credits',
      description: 'In-game currency and rewards',
      icon: '🎮',
      category: 'gaming',
      isActive: true,
      config: {
        supportedAssets: ['usdc', 'ytest.usd'],
        minAmount: '0.10',
        maxAmount: '500.00',
        fees: {
          fixed: '0.00',
          percentage: 0.0
        }
      }
    })
  }

  registerApp(app: Application): void {
    this.applications.set(app.id, app)
  }

  getApp(appId: string): Application | null {
    return this.applications.get(appId) || null
  }

  getAllApps(): Application[] {
    return Array.from(this.applications.values())
  }

  getAppsByCategory(category: string): Application[] {
    return Array.from(this.applications.values()).filter(app => app.category === category)
  }

  createAppSession(appId: string, participants: Address[], initialState: Record<string, any> = {}): ApplicationSession {
    const sessionId = `app_${appId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: ApplicationSession = {
      appId,
      sessionId,
      participants,
      state: initialState,
      createdAt: Date.now(),
      lastActivity: Date.now()
    }
    
    this.sessions.set(sessionId, session)
    return session
  }

  getAppSession(sessionId: string): ApplicationSession | null {
    return this.sessions.get(sessionId) || null
  }

  updateAppSession(sessionId: string, updates: Partial<ApplicationSession>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
      session.lastActivity = Date.now()
    }
  }

  getSessionsByApp(appId: string): ApplicationSession[] {
    return Array.from(this.sessions.values()).filter(session => session.appId === appId)
  }

  getSessionsByParticipant(participant: Address): ApplicationSession[] {
    return Array.from(this.sessions.values()).filter(session => 
      session.participants.includes(participant)
    )
  }

  cleanup(): void {
    this.sessions.clear()
  }
}

export const appRegistry = new AppRegistry()
