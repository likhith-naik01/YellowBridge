import type { Address } from 'viem'
import { createECDSAMessageSigner, createGetLedgerBalancesMessage, RPCMethod, parseAnyRPCResponse } from '@erc7824/nitrolite'
import { webSocketService } from './websocket'

/**
 * Fetch unified/off-chain ledger balances for a given address over the existing WebSocket connection.
 * Requires: an active WS connection and a session private key that is authorized.
 */
export async function getBalances(address: Address, sessionPrivateKey: `0x${string}`): Promise<Record<string, string>> {
  // Build signed request
  const signer = createECDSAMessageSigner(sessionPrivateKey)
  const payload = await createGetLedgerBalancesMessage(signer, address)

  // Await the next GetLedgerBalances response
  const result = await new Promise<Record<string, string>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      webSocketService.removeMessageListener(listener)
      reject(new Error('Timed out waiting for balances'))
    }, 15000)

    const listener = (data: any) => {
      try {
        const resp = parseAnyRPCResponse(JSON.stringify(data))
        const raw = data && data.res
        const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
        const rawParams: any = Array.isArray(raw) ? raw[2] : undefined
        if ((resp && resp.method === RPCMethod.GetLedgerBalances) || rawMethod === 'get_ledger_balances') {
          clearTimeout(timeout)
          webSocketService.removeMessageListener(listener)
          const params: any = (resp as any)?.params ?? rawParams
          const list: any[] = Array.isArray(params)
            ? params
            : (Array.isArray(params?.ledger_balances) ? params.ledger_balances : [])
          const map = Array.isArray(list) ? Object.fromEntries(list.map((b: any) => [b.asset, b.amount])) : {}
          resolve(map)
        }
      } catch (e) {
        // ignore non-JSON-RPC or unrelated messages
      }
    }

    webSocketService.addMessageListener(listener)
    webSocketService.send(payload)
  })

  return result
}

/**
 * Convenience helper to fetch balances for two addresses (sender and receiver).
 */
export async function getSenderReceiverBalances(
  sender: Address,
  receiver: Address,
  sessionPrivateKey: `0x${string}`
): Promise<{ sender: Record<string, string>; receiver: Record<string, string> }> {
  const [s, r] = await Promise.all([
    getBalances(sender, sessionPrivateKey),
    getBalances(receiver, sessionPrivateKey),
  ])
  return { sender: s, receiver: r }
}


