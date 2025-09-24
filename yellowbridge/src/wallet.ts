import { createWalletClient, custom, type Address, type WalletClient } from 'viem'
import { polygon } from 'viem/chains'

export type ConnectResult = {
  account: Address
  walletClient: WalletClient
}

export async function connectWallet(): Promise<ConnectResult> {
  if (!(window as any).ethereum) {
    throw new Error('MetaMask not found')
  }
  // First request addresses to pick the active account
  const tempClient = createWalletClient({
    chain: polygon,
    transport: custom((window as any).ethereum),
  })
  const [address] = await tempClient.requestAddresses()

  // Recreate client with account configured so signTypedData has a default account
  const client = createWalletClient({
    account: address,
    chain: polygon,
    transport: custom((window as any).ethereum),
  })
  return { account: address, walletClient: client }
}


