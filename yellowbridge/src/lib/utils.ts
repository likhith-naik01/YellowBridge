import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { type Address } from 'viem'

export interface SessionKey {
  privateKey: `0x${string}`
  address: Address
}

// Storage keys
const SESSION_KEY_STORAGE = 'yellowbridge_session_key'
const JWT_KEY = 'yellowbridge_jwt_token'

export const generateSessionKey = (): SessionKey => {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  return { privateKey, address: account.address as Address }
}

export const getStoredSessionKey = (): SessionKey | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY_STORAGE)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (!parsed.privateKey || !parsed.address) return null
    return parsed as SessionKey
  } catch {
    return null
  }
}

export const storeSessionKey = (sessionKey: SessionKey): void => {
  try {
    localStorage.setItem(SESSION_KEY_STORAGE, JSON.stringify(sessionKey))
  } catch {}
}

export const removeSessionKey = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY_STORAGE)
  } catch {}
}

export const getStoredJWT = (): string | null => {
  try {
    return localStorage.getItem(JWT_KEY)
  } catch {
    return null
  }
}

export const storeJWT = (token: string): void => {
  try {
    localStorage.setItem(JWT_KEY, token)
  } catch {}
}

export const removeJWT = (): void => {
  try {
    localStorage.removeItem(JWT_KEY)
  } catch {}
}


