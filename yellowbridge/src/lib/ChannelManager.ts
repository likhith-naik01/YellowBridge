import type { Address } from 'viem'
import { createECDSAMessageSigner, createCreateChannelMessage, createResizeChannelMessage, createCloseChannelMessage, RPCMethod, parseAnyRPCResponse } from '@erc7824/nitrolite'
import { webSocketService } from './websocket'
import type { SessionKey } from './utils'
import type { ChannelInfo } from './SessionManager'

export interface ChannelConfig {
  chainId: number
  tokenAddress: string
  amount: string
  participants: Address[]
}

export interface ResizeConfig {
  channelId: string
  allocateAmount: string
  resizeAmount: string
  fundsDestination?: Address
}

export interface CloseConfig {
  channelId: string
  fundsDestination: Address
}

class ChannelManager {
  async createChannel(sessionKey: SessionKey, config: ChannelConfig): Promise<ChannelInfo> {
    const signer = createECDSAMessageSigner(sessionKey.privateKey)
    const payload = await createCreateChannelMessage(signer, {
      chainId: config.chainId,
      token: config.tokenAddress,
      amount: config.amount,
      participants: config.participants
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        webSocketService.removeMessageListener(listener)
        reject(new Error('Timeout waiting for channel creation'))
      }, 30000)

      const listener = (data: any) => {
        try {
          const response = parseAnyRPCResponse(JSON.stringify(data))
          const raw = data && data.res
          const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
          const rawParams: any = Array.isArray(raw) ? raw[2] : undefined
          
          if ((response && response.method === RPCMethod.CreateChannel) || rawMethod === 'create_channel') {
            clearTimeout(timeout)
            webSocketService.removeMessageListener(listener)
            
            const params: any = (response as any)?.params ?? rawParams
            const channelData = Array.isArray(params) ? params[0] : params
            
            const channelInfo: ChannelInfo = {
              channelId: channelData.channel_id,
              chainId: config.chainId,
              asset: config.tokenAddress,
              amount: config.amount,
              status: 'open',
              participants: config.participants
            }
            
            resolve(channelInfo)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      webSocketService.addMessageListener(listener)
      webSocketService.send(payload)
    })
  }

  async resizeChannel(sessionKey: SessionKey, config: ResizeConfig): Promise<boolean> {
    const signer = createECDSAMessageSigner(sessionKey.privateKey)
    const payload = await createResizeChannelMessage(signer, {
      channelId: config.channelId,
      allocateAmount: config.allocateAmount,
      resizeAmount: config.resizeAmount,
      fundsDestination: config.fundsDestination
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        webSocketService.removeMessageListener(listener)
        reject(new Error('Timeout waiting for channel resize'))
      }, 30000)

      const listener = (data: any) => {
        try {
          const response = parseAnyRPCResponse(JSON.stringify(data))
          const raw = data && data.res
          const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
          
          if ((response && response.method === RPCMethod.ResizeChannel) || rawMethod === 'resize_channel') {
            clearTimeout(timeout)
            webSocketService.removeMessageListener(listener)
            resolve(true)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      webSocketService.addMessageListener(listener)
      webSocketService.send(payload)
    })
  }

  async closeChannel(sessionKey: SessionKey, config: CloseConfig): Promise<boolean> {
    const signer = createECDSAMessageSigner(sessionKey.privateKey)
    const payload = await createCloseChannelMessage(signer, {
      channelId: config.channelId,
      fundsDestination: config.fundsDestination
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        webSocketService.removeMessageListener(listener)
        reject(new Error('Timeout waiting for channel close'))
      }, 30000)

      const listener = (data: any) => {
        try {
          const response = parseAnyRPCResponse(JSON.stringify(data))
          const raw = data && data.res
          const rawMethod: string | undefined = Array.isArray(raw) ? raw[1] : undefined
          
          if ((response && response.method === RPCMethod.CloseChannel) || rawMethod === 'close_channel') {
            clearTimeout(timeout)
            webSocketService.removeMessageListener(listener)
            resolve(true)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      webSocketService.addMessageListener(listener)
      webSocketService.send(payload)
    })
  }
}

export const channelManager = new ChannelManager()
