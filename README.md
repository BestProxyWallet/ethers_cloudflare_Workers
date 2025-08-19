# Ethers RPC Proxy

A Vercel-deployable ethers.js RPC proxy service that provides unified RPC interface access to multiple blockchain networks.
（支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。）

## 🌟 Features

- **Multi-chain Support**: Supports 100+ blockchain networks including Ethereum, BSC, Polygon, Arbitrum, Optimism, etc.
- **Smart Routing**: Automatically detects and selects available RPC nodes for high availability
- **Contract Calls**: Supports predefined contract function calls including read and write operations
- **Easy Deployment**: Built on Next.js, easily deployable to Vercel and other platforms
- **RESTful API**: Provides standardized REST API interfaces
- **Health Check**: Built-in health check endpoint for service monitoring

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd ethers-cloudflare-Workers
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The service will start at `http://localhost:3000`.

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy the project**
```bash
vercel
```

Follow the prompts to complete the deployment configuration.

## 📚 API Documentation

### Generic RPC Request

**Endpoint**: `POST /api/rpc`

**Request Body**:
```json
{
  "chainId": 1,
  "request": {
    "method": "eth_blockNumber",
    "params": [],
    "id": 1,
    "jsonrpc": "2.0"
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": "0x12345678"
}
```

### Get Supported Chains List

**Endpoint**: `GET /api/chains`

**Response**:
```json
{
  "success": true,
  "chains": [
    {
      "chainId": 1,
      "name": "Ethereum Mainnet",
      "symbol": "ETH",
      "decimals": 18,
      "rpcUrls": ["https://..."]
    }
  ]
}
```

### Get Supported Contracts List

**Endpoint**: `GET /api/contracts`

**Response**:
```json
{
  "success": true,
  "contracts": ["Imputations", "token"]
}
```

### Get Contract Functions List

**Endpoint**: `GET /api/contracts/[contractName]/functions`

**Response**:
```json
{
  "success": true,
  "contractName": "token",
  "functions": [
    {
      "name": "balanceOf",
      "inputs": [{"type": "address", "name": "account"}],
      "outputs": [{"type": "uint256"}],
      "stateMutability": "view"
    }
  ]
}
```

### Contract Call

**Endpoint**: `POST /api/contract/call`

**Request Body**:
```json
{
  "chainId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "contractName": "token",
  "functionName": "balanceOf",
  "params": ["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"],
  "fromAddress": "0x...",
  "value": 0
}
```

**Response**:
```json
{
  "success": true,
  "result": "0x1234567890abcdef",
  "callInfo": {
    "chainId": 1,
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "contractName": "token",
    "functionName": "balanceOf",
    "params": ["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"],
    "fromAddress": "0x...",
    "value": 0
  }
}
```

### Health Check

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 🔧 Supported Blockchain Networks

The project supports the following blockchain networks (partial examples):

- **Ethereum Ecosystem**: Ethereum Mainnet, Goerli, Sepolia
- **Layer 2**: Arbitrum One, Optimism, Base, Polygon
- **Other L1 Chains**: BSC, Avalanche, Fantom, Cronos, Moonbeam
- **Testnets**: Corresponding testnets for each mainnet

Complete chain list can be obtained via the `/api/chains` endpoint.

## 📦 Supported Contracts

Currently supports the following contracts:

### 1. Imputations
A complex proxy contract that supports multiple operations:
- Wallet address management
- Token balance queries
- Batch operations
- Permission management

### 2. token
Standard ERC20 token contract supporting:
- Basic token operations (transfer, approve, allowance)
- Balance queries
- Token information retrieval

## 💡 Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Get latest Ethereum block number
async function getLatestBlock() {
  const response = await axios.post('http://localhost:3000/api/rpc', {
    chainId: 1,
    request: {
      method: 'eth_blockNumber',
      params: []
    }
  });
  return response.data.result;
}

// Get token balance
async function getTokenBalance() {
  const response = await axios.post('http://localhost:3000/api/contract/call', {
    chainId: 1,
    contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI contract
    contractName: 'token',
    functionName: 'balanceOf',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
  });
  return response.data.result;
}
```

### cURL

```bash
# RPC request
curl -X POST http://localhost:3000/api/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 1,
    "request": {
      "method": "eth_blockNumber",
      "params": []
    }
  }'

# Contract call
curl -X POST http://localhost:3000/api/contract/call \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 1,
    "contractAddress": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    "contractName": "token",
    "functionName": "balanceOf",
    "params": ["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"]
  }'
```

## 🛠️ Development Guide

### Project Structure

```
├── lib/                    # Core logic
│   ├── rpcHandler.js      # RPC handling logic
│   ├── rpcs.json          # RPC configuration
│   └── abi.json           # Contract ABI configuration
├── pages/                 # Next.js pages and API routes
│   ├── api/               # API routes
│   │   ├── rpc.js         # RPC API
│   │   ├── chains.js      # Chains list API
│   │   ├── contracts.js   # Contracts list API
│   │   ├── contract/      # Contract-related APIs
│   │   └── health.js      # Health check API
│   └── index.js           # Homepage
├── example.js             # Usage examples
├── next.config.js         # Next.js configuration
├── vercel.json            # Vercel deployment configuration
└── package.json           # Project dependencies
```

### Adding New Blockchain Networks

1. Add new chain configuration in `lib/rpcs.json`
2. Ensure necessary RPC node URLs are included
3. Update related frontend configurations if needed

### Adding New Contract Support

1. Add new contract ABI in `lib/abi.json`
2. Ensure contract names match configuration
3. Test contract function calls

## 🔍 Monitoring and Logging

The service provides the following monitoring features:

- **Health Check**: Regular service status checks
- **Error Handling**: Comprehensive error capture and response
- **Logging**: Detailed request and error logs

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues while using this service, please:

1. Check the documentation and examples
2. Search for existing issues
3. Create a new issue describing the problem

---

**Note**: This service is for learning and testing purposes only. Please ensure thorough testing and security assessment before using it in production environments.
（注意：本服务仅供学习和测试使用，在生产环境中使用前请确保充分测试和安全性评估。）