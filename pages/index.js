/**
 * Home Page Component
 *
 * This is the main landing page for the Ethers RPC Proxy service.
 * It provides documentation, API endpoints, and usage examples.
 *
 * @returns {JSX.Element} The home page component
 */
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
                A Vercel-deployable ethers.js RPC proxy service that provides unified RPC interface access to multiple blockchain networks.
                <br />
                <span style={{ color: '#999', fontSize: '14px' }}>（支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。）</span>
            </p>

            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>API Endpoints</h2>
                <ul style={{ color: '#666', paddingLeft: '20px' }}>
                    <li><strong>POST /api/rpc</strong> - Generic RPC request</li>
                    <li><strong>GET /api/chains</strong> - Get supported chains list</li>
                    <li><strong>GET /api/contracts</strong> - Get supported contracts list</li>
                    <li><strong>GET /api/contracts/[contractName]/functions</strong> - Get contract functions list</li>
                    <li><strong>POST /api/contract/call</strong> - Contract call</li>
                    <li><strong>GET /api/health</strong> - Health check</li>
                </ul>
            </div>

            <div style={{ backgroundColor: '#e8f4f8', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>Usage Examples</h2>
                <h3 style={{ color: '#555', marginBottom: '10px' }}>RPC Request Example</h3>
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

                <h3 style={{ color: '#555', marginBottom: '10px', marginTop: '20px' }}>Contract Call Example</h3>
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
                <h2 style={{ color: '#333', marginBottom: '15px' }}>Health Check</h2>
                <p style={{ color: '#666' }}>
                    Visit <a href="/api/health" style={{ color: '#007bff' }}>/api/health</a> to check service status
                    <br />
                    <span style={{ color: '#999', fontSize: '14px' }}>（访问 /api/health 查看服务状态）</span>
                </p>
            </div>

            <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                <p>Ethers RPC Proxy service deployed on Vercel</p>
                <p style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>（部署在 Vercel 上的 Ethers RPC Proxy 服务）</p>
            </div>
        </div>
    );
}