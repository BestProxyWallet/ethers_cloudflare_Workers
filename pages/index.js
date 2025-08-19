export default function Home() {
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            lineHeight: '1.6'
        }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>Ethers RPC Proxy</h1>

            <p style={{ color: '#666', marginBottom: '30px' }}>
                一个支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。
            </p>

            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>API 端点</h2>
                <ul style={{ color: '#666', paddingLeft: '20px' }}>
                    <li><strong>POST /api/rpc</strong> - 通用 RPC 请求</li>
                    <li><strong>GET /api/chains</strong> - 获取支持的链列表</li>
                    <li><strong>GET /api/contracts</strong> - 获取支持的合约列表</li>
                    <li><strong>GET /api/contracts/[contractName]/functions</strong> - 获取合约函数列表</li>
                    <li><strong>POST /api/contract/call</strong> - 合约调用</li>
                    <li><strong>GET /api/health</strong> - 健康检查</li>
                </ul>
            </div>

            <div style={{ backgroundColor: '#e8f4f8', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>使用示例</h2>
                <h3 style={{ color: '#555', marginBottom: '10px' }}>RPC 请求示例</h3>
                <pre style={{
                    backgroundColor: '#fff',
                    padding: '15px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '14px'
                }}>
                    {`curl -X POST http://localhost:3000/api/rpc \\
  -H "Content-Type: application/json" \\
  -d '{
    "chainId": 1,
    "request": {
      "method": "eth_blockNumber",
      "params": []
    }
  }'`}
                </pre>

                <h3 style={{ color: '#555', marginBottom: '10px', marginTop: '20px' }}>合约调用示例</h3>
                <pre style={{
                    backgroundColor: '#fff',
                    padding: '15px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '14px'
                }}>
                    {`curl -X POST http://localhost:3000/api/contract/call \\
  -H "Content-Type: application/json" \\
  -d '{
    "chainId": 1,
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "contractName": "ERC20",
    "functionName": "balanceOf",
    "params": ["0x1234567890123456789012345678901234567890"]
  }'`}
                </pre>
            </div>

            <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>健康检查</h2>
                <p style={{ color: '#666' }}>
                    访问 <a href="/api/health" style={{ color: '#007bff' }}>/api/health</a> 查看服务状态
                </p>
            </div>

            <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                <p>部署在 Vercel 上的 Ethers RPC Proxy 服务</p>
            </div>
        </div>
    );
}