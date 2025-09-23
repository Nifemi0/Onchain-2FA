# Drosera Authenticator Frontend

A modern, responsive web application built with Next.js that provides a Google Authenticator-like interface powered by Drosera Trap smart contracts.

## 🎨 Features

- **Real-time Code Display**: Shows current 6-digit code with automatic refresh
- **Countdown Timer**: Displays time until next code rotation
- **Copy to Clipboard**: One-click code copying with visual feedback
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Network Detection**: Automatically detects and displays current network
- **Error Handling**: Graceful error handling with retry functionality

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Viem for blockchain interactions
- **State Management**: TanStack Query for server state
- **Icons**: Heroicons (SVG)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Deployed Drosera Trap smart contract

### Installation

```bash
cd frontend
npm install
```

### Configuration

1. **Update Contract Addresses**:

   Edit `/src/lib/config.ts`:

   ```typescript
   export const APP_CONFIG = {
     contracts: {
       sepolia: '0x...' as `0x${string}`, // Your deployed contract address
       localhost: '0x...' as `0x${string}`, // Local contract address
     },
     // ... other config
   };
   ```

2. **Environment Variables** (optional):

   Create `.env.local`:

   ```env
   NEXT_PUBLIC_DEFAULT_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
   ```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Component Structure

```
src/
├── app/
│   ├── page.tsx          # Main page component
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/
│   └── Authenticator.tsx # Main authenticator component
└── lib/
    ├── contracts.ts      # Contract ABI and configuration
    ├── web3.ts          # Web3 utilities and contract interactions
    └── config.ts        # App configuration
```

### Key Components

#### Authenticator Component

The main component that:
- Fetches current code from smart contract
- Displays code with countdown timer
- Handles copy-to-clipboard functionality
- Shows error states and loading indicators

#### Web3 Integration

- **Viem**: Modern Web3 library for Ethereum interactions
- **Public Clients**: Read-only blockchain access
- **Contract ABI**: Type-safe contract interactions
- **Error Handling**: Graceful fallbacks for network issues

## 🎯 Usage

### Basic Usage

1. **Automatic Mode**: The app automatically connects to the configured contract
2. **Custom Contract**: Users can input a custom contract address
3. **Code Display**: Current 6-digit code is shown prominently
4. **Copy Function**: Click "Copy Code" to copy to clipboard
5. **Timer**: Countdown shows time until next code rotation

### Custom Contract Address

Users can:
1. Check "Use custom contract address"
2. Enter a valid Ethereum address
3. The app will connect to that specific Drosera Trap contract

## 🔧 Configuration

### Network Configuration

The app supports multiple networks:

```typescript
export const CONTRACT_CONFIG = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/...',
    contractAddress: '0x...',
  },
  localhost: {
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    contractAddress: '0x...',
  }
};
```

### App Settings

```typescript
export const APP_CONFIG = {
  settings: {
    refreshInterval: 2000, // 2 seconds
    blockTime: 12, // Estimated seconds per block
    rotationInterval: 5, // Blocks between rotations
  },
  ui: {
    animationDuration: 200, // ms
    copyFeedbackDuration: 2000, // ms
  }
};
```

## 🎨 Styling

### Design System

- **Colors**: Purple accent color (#7c3aed) with gray scale
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind's scale
- **Components**: Reusable component patterns

### Dark Mode

The app automatically detects system theme preference and applies:
- Dark backgrounds and light text
- Adjusted color schemes
- Proper contrast ratios

### Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: Tailwind's responsive breakpoints
- **Touch Friendly**: Large touch targets for mobile

## 🔍 API Integration

### Contract Interactions

```typescript
// Get current code
const code = await getCurrentCode(contractAddress);

// Get code with metadata
const { code, blockNumber, nextRotationBlock } = 
  await getCurrentCodeWithMetadata(contractAddress);

// Verify code
const isValid = await verifyCode(contractAddress, code);
```

### Error Handling

- **Network Errors**: Graceful fallbacks with retry options
- **Contract Errors**: Clear error messages for users
- **Loading States**: Smooth loading indicators

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

- Component rendering
- User interactions
- Error states
- Responsive behavior

## 📱 Mobile Optimization

### Features

- **Touch Gestures**: Optimized for touch interactions
- **Viewport**: Proper viewport configuration
- **Performance**: Optimized for mobile networks
- **Accessibility**: Screen reader support

### PWA Support

The app can be installed as a Progressive Web App:
- Add to home screen
- Offline functionality (cached data)
- App-like experience

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Configure environment variables

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Development

### Code Style

- **ESLint**: Configured for Next.js and TypeScript
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking

### Performance

- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Use `npm run analyze` to analyze bundle size

### Debugging

- **React DevTools**: Browser extension for React debugging
- **Next.js DevTools**: Built-in development tools
- **Console Logging**: Comprehensive logging for development

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Viem Documentation](https://viem.sh/docs)
- [TanStack Query](https://tanstack.com/query/latest)