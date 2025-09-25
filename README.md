# YellowBridge - Instant Remittance with State Channels

A comprehensive remittance application built with Yellow Network, Nitrolite, and Clearnode API. This dApp demonstrates instant off-chain transfers using state channels with eventual on-chain settlement.

## 🚀 Features

### Core Functionality
- **Per-User Session Management**: Each user gets their own session ID for fast, authenticated operations
- **Instant P2P Transfers**: Send money instantly using session keys (no wallet popups)
- **Real-time Balance Updates**: Live balance tracking via WebSocket
- **Channel Management**: Create, resize, and close state channels for on-chain settlement
- **Multi-Application Support**: Registry system for different use cases (remittance, sponsorship, yield farming, gaming, social)
- **USD→INR Conversion**: Built-in quote system with fee calculation
- **Web3 Wallet Integration**: MetaMask support via viem

### Technical Architecture
- **State Channels**: Off-chain transactions with instant finality
- **Session Keys**: Temporary private keys for seamless UX
- **EIP-712 Authentication**: Secure, transparent wallet signing
- **WebSocket Communication**: Real-time updates from Clearnode
- **JWT Re-authentication**: Persistent sessions across page reloads

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nitrolite     │    │   Clearnode     │
│   (React/Vite)  │◄──►│   State Channels│◄──►│   WebSocket API │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   Session Keys  │    │   Ledger        │
│   (Wallet)      │    │   (ECDSA)       │    │   (Balances)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
src/
├── components/
│   ├── BalanceDisplay/          # Balance display component
│   ├── SandboxPanel/            # Clearnode sandbox tools
│   ├── RemittanceFlow/          # Send money flow
│   ├── ChannelManager/          # Channel lifecycle management
│   └── AppSelector/             # Multi-app selection
├── hooks/
│   ├── useSession.ts            # Session management hook
│   └── useTransfer.ts           # Transfer functionality hook
├── lib/
│   ├── SessionManager.ts        # Per-user session tracking
│   ├── ChannelManager.ts        # Channel operations
│   ├── AppRegistry.ts           # Multi-app registry
│   ├── QuoteService.ts          # USD→INR conversion
│   ├── websocket.ts             # WebSocket service
│   └── utils.ts                 # Session key utilities
└── App.tsx                      # Main application component
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd yellowbridge
npm install
```

### 2. Environment Configuration
Create `.env.local` file:
```env
# Nitrolite WebSocket URL (Sandbox)
VITE_NITROLITE_WS_URL=wss://clearnet-sandbox.yellow.com/ws

# Family recipient address for quick transfers
VITE_FAMILY_RECIPIENT=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6

# Sandbox asset (use ytest.usd for Clearnode Sandbox)
VITE_SANDBOX_ASSET=ytest.usd

# Optional: RPC URL for on-chain operations
VITE_RPC_URL=https://rpc-mumbai.maticvigil.com

# Optional: Network name
VITE_NETWORK=polygon-mumbai
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Get Test Funds
1. Open the app and connect your wallet
2. Go to the "Sandbox Tools" panel
3. Click "Faucet" to get Yellow Test USD
4. Your balance will appear in the header

## 🔄 User Flow

### 1. Wallet Connection
- User clicks "Connect Wallet"
- MetaMask prompts for connection
- App stores account + walletClient
- Automatic EIP-712 authentication begins

### 2. Authentication
- App generates session key (stored in localStorage)
- Sends auth_request to Clearnode
- User signs EIP-712 challenge
- Receives JWT token for re-authentication

### 3. Send Money Flow
```
User Input → Quote Calculation → Transfer Confirmation → Instant Settlement
     ↓              ↓                    ↓                    ↓
  $500 USD    →  ₹41,750 INR    →  EIP-712 Sign    →  Off-chain Update
```

### 4. Channel Management
- **Create Channel**: Deposit funds for on-chain settlement
- **Resize Channel**: Add/remove funds from channel
- **Close Channel**: Withdraw funds to on-chain wallet

## 🎯 Key Components

### SessionManager
- Tracks per-user sessions with unique session IDs
- Manages balances, channels, and activity timestamps
- Handles real-time WebSocket message routing
- Provides transfer functionality with session keys

### ChannelManager
- Creates state channels with configurable parameters
- Resizes channels for fund management
- Closes channels for on-chain settlement
- Integrates with Nitrolite SDK for signed operations

### AppRegistry
- Manages multiple application types
- Supports remittance, sponsorship, yield farming, gaming, social
- Each app has configurable fees, limits, and supported assets
- Enables extensible multi-app architecture

### QuoteService
- Calculates USD→INR conversion rates
- Applies platform and network fees
- Provides delivery time estimates
- Simulates real-time rate updates

## 🔧 API Integration

### Clearnode Sandbox Endpoints
- **WebSocket**: `wss://clearnet-sandbox.yellow.com/ws`
- **Faucet**: `POST https://clearnet-sandbox.yellow.com/faucet/requestTokens`
- **Balances**: `get_ledger_balances` (signed)
- **Channels**: `get_channels`, `create_channel`, `resize_channel`, `close_channel`
- **Transfers**: `transfer` (signed)

### Nitrolite SDK Methods
- `createAuthRequestMessage()` - Authentication request
- `createAuthVerifyMessage()` - EIP-712 signature verification
- `createECDSAMessageSigner()` - Session key signer
- `createGetLedgerBalancesMessage()` - Balance queries
- `createTransferMessage()` - P2P transfers
- `createCreateChannelMessage()` - Channel creation
- `createResizeChannelMessage()` - Channel resizing
- `createCloseChannelMessage()` - Channel closure

## 🚦 State Management

### Session State
```typescript
interface UserSession {
  address: Address
  sessionKey: SessionKey
  isAuthenticated: boolean
  sessionId: string
  balances: Record<string, string>
  channels: ChannelInfo[]
  lastActivity: number
}
```

### Application State
- **Dashboard**: Quick actions, session info, balance display
- **Remittance**: Multi-step send money flow with quotes
- **Channels**: Channel lifecycle management
- **Apps**: Multi-application selection and launching

## 🔒 Security Features

### Authentication
- EIP-712 structured data signing
- Challenge-response flow prevents replay attacks
- JWT tokens for stateless re-authentication
- Session key rotation and cleanup

### Session Management
- Per-user session isolation
- Activity tracking and timeout
- Secure session key storage in localStorage
- Automatic cleanup on errors

### Transfer Security
- Session key signing (no repeated wallet prompts)
- Cryptographic proof of transfer authorization
- Real-time balance validation
- Error handling and rollback

## 🎨 UI/UX Features

### Modern Design
- Gradient backgrounds and glassmorphism effects
- Responsive grid layouts
- Smooth animations and transitions
- Professional color scheme

### User Experience
- One-click wallet connection
- Automatic authentication flow
- Real-time status indicators
- Intuitive navigation between features

### Accessibility
- Clear visual hierarchy
- Descriptive button states
- Error messaging and feedback
- Mobile-responsive design

## 🧪 Testing

### Sandbox Environment
- Use Clearnode Sandbox for safe testing
- Faucet provides unlimited test funds
- All operations are non-production
- Real WebSocket and API endpoints

### Test Scenarios
1. **Wallet Connection**: Connect MetaMask and verify authentication
2. **Balance Fetching**: Get test funds and verify balance display
3. **P2P Transfer**: Send money to another address
4. **Channel Operations**: Create, resize, and close channels
5. **Multi-App**: Test different application types

## 🚀 Deployment

### Production Considerations
- Replace sandbox URLs with production endpoints
- Implement proper error handling and logging
- Add rate limiting and abuse prevention
- Configure proper CORS and security headers

### Environment Variables
- `VITE_NITROLITE_WS_URL`: Production WebSocket URL
- `VITE_FAMILY_RECIPIENT`: Default recipient address
- `VITE_SANDBOX_ASSET`: Production asset symbol
- `VITE_RPC_URL`: Production RPC endpoint

## 📈 Performance

### Optimizations
- Session key caching in localStorage
- WebSocket connection pooling
- Real-time balance updates
- Efficient state management

### Scalability
- Per-user session isolation
- Stateless JWT authentication
- Horizontal scaling support
- Database-agnostic design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Yellow Network for state channel infrastructure
- Nitrolite SDK for client-side channel management
- Clearnode for WebSocket API and ledger services
- Viem for Web3 wallet integration
- React and Vite for the frontend framework

---

**Built with ❤️ for the future of instant, low-cost remittance**
