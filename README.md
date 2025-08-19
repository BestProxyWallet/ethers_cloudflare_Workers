# Ethers RPC Proxy

一个支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。

## 🌟 特性

- **多链支持**: 支持 100+ 区块链网络，包括以太坊、BSC、Polygon、Arbitrum、Optimism 等
- **智能路由**: 自动检测并选择可用的 RPC 节点，提供高可用性
- **合约调用**: 支持预定义合约的函数调用，包括读取和写入操作
- **易于部署**: 基于 Next.js 构建，可轻松部署到 Vercel 等平台
- **RESTful API**: 提供标准化的 REST API 接口
- **健康检查**: 内置健康检查端点，便于监控服务状态

## 🚀 快速开始

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd ethers-cloudflare-Workers
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动。

### 部署到 Vercel

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **部署项目**
```bash
vercel
```

按照提示完成部署配置。

## 📚 API 文档

### 通用 RPC 请求

**端点**: `POST /api/rpc`

**请求体**:
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

**响应**:
```json
{
  "success": true,
  "result": "0x12345678"
}
```

### 获取支持的链列表

**端点**: `GET /api/chains`

**响应**:
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

### 获取支持的合约列表

**端点**: `GET /api/contracts`

**响应**:
```json
{
  "success": true,
  "contracts": ["Imputations", "token"]
}
```

### 获取合约函数列表

**端点**: `GET /api/contracts/[contractName]/functions`

**响应**:
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

### 合约调用

**端点**: `POST /api/contract/call`

**请求体**:
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

**响应**:
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

### 健康检查

**端点**: `GET /api/health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 🔧 支持的区块链网络

项目支持以下区块链网络（部分示例）：

- **以太坊生态**: Ethereum Mainnet, Goerli, Sepolia
- **Layer 2**: Arbitrum One, Optimism, Base, Polygon
- **其他公链**: BSC, Avalanche, Fantom, Cronos, Moonbeam
- **测试网**: 各主网的对应测试网

完整的链列表可通过 `/api/chains` 端点获取。

## 📦 支持的合约

目前支持以下合约：

### 1. Imputations
一个复杂的代理合约，支持多种操作：
- 钱包地址管理
- 代币余额查询
- 批量操作
- 权限管理

### 2. token
标准的 ERC20 代币合约，支持：
- 基本代币操作（transfer, approve, allowance）
- 余额查询
- 代币信息获取

## 💡 使用示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

// 获取以太坊最新区块号
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

// 获取代币余额
async function getTokenBalance() {
  const response = await axios.post('http://localhost:3000/api/contract/call', {
    chainId: 1,
    contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI 合约
    contractName: 'token',
    functionName: 'balanceOf',
    params: ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']
  });
  return response.data.result;
}
```

### cURL

```bash
# RPC 请求
curl -X POST http://localhost:3000/api/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 1,
    "request": {
      "method": "eth_blockNumber",
      "params": []
    }
  }'

# 合约调用
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

## 🛠️ 开发指南

### 项目结构

```
├── lib/                    # 核心逻辑
│   ├── rpcHandler.js      # RPC 处理逻辑
│   ├── rpcs.json          # RPC 配置
│   └── abi.json           # 合约 ABI 配置
├── pages/                 # Next.js 页面和 API 路由
│   ├── api/               # API 路由
│   │   ├── rpc.js         # RPC API
│   │   ├── chains.js      # 链列表 API
│   │   ├── contracts.js   # 合约列表 API
│   │   ├── contract/      # 合约相关 API
│   │   └── health.js      # 健康检查 API
│   └── index.js           # 主页
├── example.js             # 使用示例
├── next.config.js         # Next.js 配置
├── vercel.json            # Vercel 部署配置
└── package.json           # 项目依赖
```

### 添加新的区块链网络

1. 在 `lib/rpcs.json` 中添加新的链配置
2. 确保包含必要的 RPC 节点 URL
3. 如果需要，更新相关的前端配置

### 添加新的合约支持

1. 在 `lib/abi.json` 中添加新的合约 ABI
2. 确保合约名称与配置一致
3. 测试合约函数调用

## 🔍 监控和日志

服务提供以下监控功能：

- **健康检查**: 定期检查服务状态
- **错误处理**: 完善的错误捕获和响应
- **日志记录**: 详细的请求和错误日志

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看文档和示例
2. 搜索现有的 Issue
3. 创建新的 Issue 描述问题

---

**注意**: 本服务仅供学习和测试使用，在生产环境中使用前请确保充分测试和安全性评估。