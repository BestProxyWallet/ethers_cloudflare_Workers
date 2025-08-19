# Ethers RPC Proxy (Next.js 版本)

一个支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。

## 功能特性

- 🚀 基于 Next.js 构建，完美支持 Vercel 部署
- 🔗 支持多个区块链网络的 RPC 请求转发
- 📜 支持常见合约的调用（ERC20, ERC721 等）
- 🔄 自动负载均衡，随机选择 RPC 节点
- 🛡️ 内置错误处理和参数验证
- 📊 健康检查端点

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

## API 端点

### 1. 通用 RPC 请求

**POST** `/api/rpc`

```json
{
  "chainId": 1,
  "request": {
    "method": "eth_blockNumber",
    "params": []
  }
}
```

### 2. 获取支持的链列表

**GET** `/api/chains`

### 3. 获取支持的合约列表

**GET** `/api/contracts`

### 4. 获取合约函数列表

**GET** `/api/contracts/[contractName]/functions`

### 5. 合约调用

**POST** `/api/contract/call`

```json
{
  "chainId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "contractName": "ERC20",
  "functionName": "balanceOf",
  "params": ["0x1234567890123456789012345678901234567890"]
}
```

### 6. 健康检查

**GET** `/api/health`

## 配置文件

### RPC 配置

编辑 `rpcs.json` 文件来添加或修改支持的区块链网络：

```json
{
  "chainId": 1,
  "name": "Ethereum Mainnet",
  "networkId": 1,
  "nativeCurrency": {
    "symbol": "ETH",
    "decimals": 18
  },
  "rpc": [
    {
      "url": "https://eth.public-rpc.com",
      "weight": 1
    }
  ]
}
```

### ABI 配置

编辑 `abi.json` 文件来添加或修改支持的合约 ABI：

```json
{
  "ERC20": [
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
}
```

## Vercel 部署

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. Framework Preset 选择 **Next.js**
4. 自动部署即可

## 环境变量

在 Vercel 项目设置中可以配置以下环境变量：

- `NODE_ENV`: 运行环境（自动设置）

## 许可证

MIT