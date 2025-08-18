# 合约读调用中转服务

这是一个基于 Cloudflare Workers 的合约读调用中转服务，支持通过链ID、合约地址、函数名和函数入参来调用智能合约的读方法。

## 功能特性

- 🚀 支持多个区块链网络（EVM兼容链）
- 🔧 自动参数验证和格式化
- 🛡️ 完善的错误处理机制
- 📊 支持查询支持的链列表和ABI信息
- 🌐 完整的CORS支持
- ⚡ 高性能的边缘计算

## 支持的区块链网络

服务支持以下区块链网络（基于 `data/rpcs.json`）：
- Ethereum Mainnet (Chain ID: 1)
- BNB Smart Chain Mainnet (Chain ID: 56)
- Base (Chain ID: 8453)
- Arbitrum One (Chain ID: 42161)
- Avalanche C-Chain (Chain ID: 43114)
- Polygon Mainnet (Chain ID: 137)
- 以及其他20+个EVM兼容链

## API 接口

### 1. 合约调用接口

**POST** `/call`

调用智能合约的读方法。

**请求参数：**
```json
{
  "chainId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "functionName": "balanceOf",
  "params": ["0x1234567890123456789012345678901234567890"]
}
```

**参数说明：**
- `chainId`: 区块链网络ID（必需）
- `contractAddress`: 合约地址（必需）
- `functionName`: 函数名（必需）
- `params`: 函数参数数组（可选）

**响应示例：**
```json
{
  "success": true,
  "data": "0x0000000000000000000000000000000000000000000000000000000000000001",
  "chainId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "functionName": "balanceOf"
}
```

### 2. 获取支持的链列表

**GET** `/chains`

获取所有支持的区块链网络信息。

**响应示例：**
```json
{
  "chains": [
    {
      "chainId": 1,
      "name": "Ethereum Mainnet",
      "symbol": "ETH",
      "rpcCount": 50
    },
    {
      "chainId": 56,
      "name": "BNB Smart Chain Mainnet",
      "symbol": "BNB",
      "rpcCount": 30
    }
  ]
}
```

### 3. 获取ABI信息

**GET** `/abi`

获取当前支持的合约ABI信息。

**响应示例：**
```json
{
  "functions": [
    {
      "name": "balanceOf",
      "inputs": [
        {
          "name": "account",
          "type": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ]
    }
  ]
}
```

### 4. 健康检查

**GET** `/health`

检查服务状态。

**响应示例：**
```json
{
  "status": "ok"
}
```

## 使用示例

### JavaScript/TypeScript

```javascript
// 调用合约方法
async function callContract() {
  const response = await fetch('https://your-worker-domain.workers.dev/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainId: 1,
      contractAddress: '0x1234567890123456789012345678901234567890',
      functionName: 'balanceOf',
      params: ['0x1234567890123456789012345678901234567890']
    })
  });
  
  const result = await response.json();
  console.log(result);
}

// 获取支持的链列表
async function getChains() {
  const response = await fetch('https://your-worker-domain.workers.dev/chains');
  const result = await response.json();
  console.log(result);
}
```

### Python

```python
import requests

# 调用合约方法
def call_contract():
    url = "https://your-worker-domain.workers.dev/call"
    data = {
        "chainId": 1,
        "contractAddress": "0x1234567890123456789012345678901234567890",
        "functionName": "balanceOf",
        "params": ["0x1234567890123456789012345678901234567890"]
    }
    
    response = requests.post(url, json=data)
    result = response.json()
    print(result)

# 获取支持的链列表
def get_chains():
    url = "https://your-worker-domain.workers.dev/chains"
    response = requests.get(url)
    result = response.json()
    print(result)
```

## 部署说明

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 部署到 Cloudflare Workers

```bash
# 登录 Cloudflare
npx wrangler login

# 部署到生产环境
npx wrangler deploy --env production

# 部署到测试环境
npx wrangler deploy --env staging
```

### 3. 配置 KV 存储（可选）

如果需要从 KV 存储获取 ABI 和 RPC 数据，需要在 `wrangler.toml` 中配置 KV 命名空间：

```toml
[[kv_namespaces]]
binding = "CONTRACTS"
id = "your-contracts-kv-namespace-id"

[[kv_namespaces]]
binding = "RPCS"
id = "your-rpcs-kv-namespace-id"
```

## 错误处理

服务会返回详细的错误信息：

```json
{
  "success": false,
  "error": "Function balanceOf not found in ABI",
  "chainId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "functionName": "balanceOf"
}
```

常见错误：
- `Chain with ID X not found`: 不支持的链ID
- `Function X not found in ABI`: 函数名在ABI中不存在
- `Function X is not a view function`: 函数不是读方法
- `Function X expects Y parameters, got Z`: 参数数量不匹配
- `RPC request failed`: RPC节点连接失败

## 注意事项

1. **仅支持读方法**：服务只支持 `view` 和 `pure` 类型的函数调用
2. **参数格式**：确保传入的参数格式正确（地址、数值、字符串等）
3. **网络限制**：某些RPC节点可能有访问频率限制
4. **数据缓存**：建议在生产环境中使用 KV 存储缓存 ABI 和 RPC 数据
5. **错误监控**：建议添加错误监控和日志记录

## 许可证

MIT License