// 合约读调用中转服务
// 支持通过链ID、合约名称、函数名和函数入参调用合约读方法

// 缓存数据
const abiCache = null;
const rpcCache = null;

// 从 KV 存储获取 ABI 数据
async function getAbi() {
    if (abiCache) return abiCache;

    try {
        // 在实际部署中，这里应该从 KV 存储获取
        // const abi = await CONTRACTS.get('abi');
        // if (abi) return JSON.parse(abi);

        // 开发环境直接读取本地文件
        const response = await fetch('https://ethers-cloudflare-workers.data/abi.json');
        if (!response.ok) {
            throw new Error('Failed to fetch ABI');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching ABI:', error);
        throw error;
    }
}

// 从 KV 存储获取 RPC 数据
async function getRpcData() {
    if (rpcCache) return rpcCache;

    try {
        // 在实际部署中，这里应该从 KV 存储获取
        // const rpcs = await RPCS.get('rpcs');
        // if (rpcs) return JSON.parse(rpcs);

        // 开发环境直接读取本地文件
        const response = await fetch('https://ethers-cloudflare-workers.data/rpcs.json');
        if (!response.ok) {
            throw new Error('Failed to fetch RPC data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching RPC data:', error);
        throw error;
    }
}

// 根据链ID获取RPC URL
async function getRpcUrl(chainId) {
    const rpcData = await getRpcData();
    const chain = rpcData.find(c => c.chainId === parseInt(chainId));

    if (!chain) {
        throw new Error(`Chain with ID ${chainId} not found`);
    }

    // 返回第一个可用的RPC URL
    if (chain.rpc && chain.rpc.length > 0) {
        return chain.rpc[0].url;
    }

    throw new Error(`No RPC available for chain ${chainId}`);
}

// 验证函数参数
function validateFunctionParams(abi, functionName, params) {
    const functionAbi = abi.find(f => f.name === functionName);

    if (!functionAbi) {
        throw new Error(`Function ${functionName} not found in ABI`);
    }

    if (functionAbi.stateMutability !== 'view') {
        throw new Error(`Function ${functionName} is not a view function`);
    }

    const expectedParams = functionAbi.inputs || [];
    const providedParams = params || [];

    if (expectedParams.length !== providedParams.length) {
        throw new Error(`Function ${functionName} expects ${expectedParams.length} parameters, got ${providedParams.length}`);
    }

    return functionAbi;
}

// 将参数转换为Solidity格式
function formatParamsForSolidity(params, paramTypes) {
    return params.map((param, index) => {
        const type = paramTypes[index];

        if (type.type === 'address') {
            return `"${param.toLowerCase()}"`;
        } else if (type.type === 'uint256' || type.type === 'int256') {
            return param.toString();
        } else if (type.type === 'string') {
            return `"${param}"`;
        } else if (type.type === 'bool') {
            return param ? 'true' : 'false';
        } else if (type.type === 'bytes32') {
            return `"${param}"`;
        } else if (type.type === 'bytes') {
            return `"${param}"`;
        } else if (type.type.startsWith('uint') || type.type.startsWith('int')) {
            return param.toString();
        } else {
            // 复杂类型，直接返回
            return param;
        }
    });
}

// 构建JSON-RPC请求
function buildJsonRpcRequest(rpcUrl, method, params) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: method,
            params: params,
        }),
    };
}

// 调用合约方法
async function callContractMethod(chainId, contractAddress, functionName, params) {
    try {
        // 获取RPC URL
        const rpcUrl = await getRpcUrl(chainId);

        // 获取ABI
        const abi = await getAbi();

        // 验证函数参数
        const functionAbi = validateFunctionParams(abi, functionName, params);

        // 格式化参数
        const formattedParams = formatParamsForSolidity(params || [], functionAbi.inputs);

        // 构建调用数据
        const callData = {
            to: contractAddress,
            data: `${functionName}(${functionAbi.inputs.map(i => i.type).join(',')})(${formattedParams.join(',')})`
        };

        // 构建JSON-RPC请求
        const request = buildJsonRpcRequest(rpcUrl, 'eth_call', [
            callData,
            'latest' // 使用最新区块
        ]);

        // 发送请求
        const response = await fetch(rpcUrl, request);

        if (!response.ok) {
            throw new Error(`RPC request failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(`RPC error: ${result.error.message}`);
        }

        return {
            success: true,
            data: result.result,
            chainId: chainId,
            contractAddress: contractAddress,
            functionName: functionName
        };

    } catch (error) {
        console.error('Error calling contract method:', error);
        return {
            success: false,
            error: error.message,
            chainId: chainId,
            contractAddress: contractAddress,
            functionName: functionName
        };
    }
}

// 主处理函数
export default {
    async fetch(request, env, ctx) {
        // 处理CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // 处理OPTIONS请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders,
            });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // 健康检查
            if (path === '/health') {
                return new Response(JSON.stringify({ status: 'ok' }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            // 合约调用接口
            if (path === '/call') {
                if (request.method !== 'POST') {
                    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                        status: 405,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders,
                        },
                    });
                }

                const body = await request.json();

                // 验证必需参数
                const requiredParams = ['chainId', 'contractAddress', 'functionName'];
                for (const param of requiredParams) {
                    if (!body[param]) {
                        return new Response(JSON.stringify({ error: `Missing required parameter: ${param}` }), {
                            status: 400,
                            headers: {
                                'Content-Type': 'application/json',
                                ...corsHeaders,
                            },
                        });
                    }
                }

                const { chainId, contractAddress, functionName, params } = body;

                // 调用合约方法
                const result = await callContractMethod(chainId, contractAddress, functionName, params);

                return new Response(JSON.stringify(result), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            // 获取支持的链列表
            if (path === '/chains') {
                const rpcData = await getRpcData();
                const chains = rpcData.map(chain => ({
                    chainId: chain.chainId,
                    name: chain.name,
                    symbol: chain.nativeCurrency?.symbol,
                    rpcCount: chain.rpc?.length || 0,
                }));

                return new Response(JSON.stringify({ chains }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            // 获取ABI信息
            if (path === '/abi') {
                const abi = await getAbi();
                const functions = abi.filter(item => item.type === 'function' && item.stateMutability === 'view');

                return new Response(JSON.stringify({
                    functions: functions.map(f => ({
                        name: f.name,
                        inputs: f.inputs,
                        outputs: f.outputs,
                    }))
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            // 404
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });

        } catch (error) {
            console.error('Request error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }
    },
};