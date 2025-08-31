import React from 'react';

/**
 * Home Page Component
 *
 * This is the main landing page for the Ethers RPC Proxy service.
 * It provides documentation, API endpoints, and usage examples.
 *
 * @returns {JSX.Element} The home page component
 */
export default function Home() {
    const [contractCall, setContractCall] = React.useState({
        chainId: 1,
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        contractName: "token",
        functionName: "balanceOf",
        params: "0xF977814e90dA44bFA03b6295A0616a897441aceC"
    });
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContractCall(prev => ({
            ...prev,
            [name]: name === 'params' ? value : name === 'chainId' ? Number(value) : value
        }));
    };

    const handleContractCall = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/contract/call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...contractCall,
                    params: contractCall.params ? contractCall.params.split(',').map(p => p.trim()) : []
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('网络请求失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
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
                <h2 style={{ color: '#333', marginBottom: '15px' }}>实时合约调用</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Chain ID:</label>
                        <input
                            type="number"
                            name="chainId"
                            value={contractCall.chainId}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>合约地址:</label>
                        <input
                            type="text"
                            name="contractAddress"
                            value={contractCall.contractAddress}
                            onChange={handleInputChange}
                            placeholder="0x..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>合约名称:</label>
                        <input
                            type="text"
                            name="contractName"
                            value={contractCall.contractName}
                            onChange={handleInputChange}
                            placeholder="token, erc20, etc."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>函数名:</label>
                        <input
                            type="text"
                            name="functionName"
                            value={contractCall.functionName}
                            onChange={handleInputChange}
                            placeholder="balanceOf, transfer, etc."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>参数 (用逗号分隔):</label>
                        <input
                            type="text"
                            name="params"
                            value={contractCall.params}
                            onChange={handleInputChange}
                            placeholder="0xaddress, 100, etc."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>
                <button
                    onClick={handleContractCall}
                    disabled={loading}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {loading ? '调用中...' : '调用合约'}
                </button>

                {error && (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '10px',
                        borderRadius: '4px',
                        marginTop: '15px'
                    }}>
                        错误: {error}
                    </div>
                )}

                {result && (
                    <div style={{
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        padding: '15px',
                        borderRadius: '4px',
                        marginTop: '15px'
                    }}>
                        <h4 style={{ marginBottom: '10px' }}>调用结果:</h4>
                        <pre style={{
                            backgroundColor: '#f8f9fa',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '12px',
                            margin: 0
                        }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
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
    "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "contractName": "token",
    "functionName": "balanceOf",
    "params": ["0xF977814e90dA44bFA03b6295A0616a897441aceC"]
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