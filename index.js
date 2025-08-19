const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ethers = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 加载 RPC 配置
const rpcConfig = require('./rpcs.json');

// 加载 ABI 配置
const abiConfig = require('./abi.json');

// 获取指定链的 RPC URL
function getRpcUrl(chainId) {
    const chain = rpcConfig.find(c => c.chainId === chainId || c.networkId === chainId);
    if (!chain) {
        throw new Error(`未找到链 ID ${chainId} 的配置`);
    }

    // 随机选择一个 RPC 节点
    const rpcUrls = chain.rpc.map(r => r.url);
    return rpcUrls[Math.floor(Math.random() * rpcUrls.length)];
}

// 创建 RPC 提供者
function createRpcProvider(chainId) {
    const rpcUrl = getRpcUrl(chainId);
    return new ethers.JsonRpcProvider(rpcUrl);
}

// 通用 RPC 请求处理
async function handleRpcRequest(rpcRequest, chainId) {
    try {
        const provider = createRpcProvider(chainId);

        // 根据不同的方法类型处理
        const { method, params } = rpcRequest;

        switch (method) {
            case 'eth_blockNumber':
                return await provider.getBlockNumber();

            case 'eth_getBalance':
                return await provider.getBalance(params[0], params[1]);

            case 'eth_getTransactionCount':
                return await provider.getTransactionCount(params[0], params[1]);

            case 'eth_getBlockByNumber':
                return await provider.getBlock(params[0], params[1]);

            case 'eth_getBlockByHash':
                return await provider.getBlock(params[0], params[1]);

            case 'eth_getTransactionByHash':
                return await provider.getTransaction(params[0]);

            case 'eth_getTransactionReceipt':
                return await provider.getTransactionReceipt(params[0]);

            case 'eth_call':
                return await provider.call(params[0], params[1]);

            case 'eth_estimateGas':
                return await provider.estimateGas(params[0]);

            case 'eth_sendRawTransaction':
                return await provider.send(params[0]);

            case 'eth_getCode':
                return await provider.getCode(params[0], params[1]);

            case 'eth_getStorageAt':
                return await provider.getStorage(params[0], params[1]);

            case 'eth_getLogs':
                return await provider.getLogs(params[0]);

            case 'eth_chainId':
                return await provider.getNetwork().then(network => network.chainId);

            case 'net_version':
                return await provider.getNetwork().then(network => network.chainId);

            case 'eth_gasPrice':
                return await provider.getGasPrice();

            case 'eth_maxPriorityFeePerGas':
                return await provider.getFeeData().then(feeData => feeData.maxPriorityFeePerGas);

            case 'eth_maxFeePerGas':
                return await provider.getFeeData().then(feeData => feeData.maxFeePerGas);

            default:
                // 对于其他方法，使用通用的 RPC 调用
                const rpcUrl = getRpcUrl(chainId);
                const response = await axios.post(rpcUrl, rpcRequest, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return response.data.result;
        }
    } catch (error) {
        console.error('RPC 请求错误:', error.message);
        throw error;
    }
}

// 合约调用处理函数
async function handleContractCall(chainId, contractAddress, contractName, functionName, params = [], fromAddress = null, value = 0) {
    try {
        const provider = createRpcProvider(chainId);

        // 获取合约 ABI
        const contractAbi = abiConfig[contractName];
        if (!contractAbi) {
            throw new Error(`未找到合约 ${contractName} 的 ABI 配置`);
        }

        // 创建合约实例
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        // 处理函数参数
        let processedParams = params;

        // 如果是写入操作，需要创建发送器
        if (fromAddress) {
            const wallet = new ethers.Wallet(fromAddress, provider);
            contract.connect(wallet);
        }

        // 调用合约函数
        let result;
        if (functionName === 'constructor') {
            throw new Error('不能直接调用构造函数');
        }

        // 检查函数是否存在
        const functionExists = contract.interface.getFunction(functionName);
        if (!functionExists) {
            throw new Error(`合约 ${contractName} 中不存在函数 ${functionName}`);
        }

        // 根据函数状态可变性选择调用方式
        const functionFragment = contract.interface.getFunction(functionName);
        if (functionFragment.stateMutability === 'view' || functionFragment.stateMutability === 'pure') {
            // 读取操作
            result = await contract[functionName](...processedParams);
        } else {
            // 写入操作 - 需要估算 gas 和发送交易
            if (!fromAddress) {
                throw new Error('写入操作需要提供 fromAddress');
            }

            // 估算 gas
            const gasEstimate = await contract[functionName].estimateGas(...processedParams, {
                value: value
            });

            // 发送交易
            const tx = await contract[functionName](...processedParams, {
                gasLimit: gasEstimate,
                value: value
            });

            result = {
                transactionHash: tx.hash,
                gasUsed: (await tx.wait()).gasUsed.toString(),
                blockNumber: tx.blockNumber
            };
        }

        return result;
    } catch (error) {
        console.error('合约调用错误:', error.message);
        throw error;
    }
}

// 获取支持的合约列表
function getSupportedContracts() {
    return Object.keys(abiConfig);
}

// 获取合约的函数列表
function getContractFunctions(contractName) {
    const contractAbi = abiConfig[contractName];
    if (!contractAbi) {
        return [];
    }

    return contractAbi
        .filter(item => item.type === 'function')
        .map(item => ({
            name: item.name,
            inputs: item.inputs,
            outputs: item.outputs,
            stateMutability: item.stateMutability
        }));
}

// API 路由
app.post('/api/rpc', async (req, res) => {
    try {
        const { chainId, request } = req.body;

        if (!chainId || !request) {
            return res.status(400).json({
                error: '缺少必要参数',
                message: '需要 chainId 和 request 参数'
            });
        }

        const result = await handleRpcRequest(request, chainId);

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取支持的链列表
app.get('/api/chains', (req, res) => {
    const chains = rpcConfig.map(chain => ({
        chainId: chain.chainId,
        name: chain.name,
        symbol: chain.nativeCurrency?.symbol,
        decimals: chain.nativeCurrency?.decimals,
        rpcUrls: chain.rpc.map(r => r.url)
    }));

    res.json({
        success: true,
        chains: chains
    });
});

// 获取支持的合约列表
app.get('/api/contracts', (req, res) => {
    try {
        const contracts = getSupportedContracts();
        res.json({
            success: true,
            contracts: contracts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取合约的函数列表
app.get('/api/contracts/:contractName/functions', (req, res) => {
    try {
        const { contractName } = req.params;
        const functions = getContractFunctions(contractName);

        if (functions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `未找到合约 ${contractName} 或该合约没有函数`
            });
        }

        res.json({
            success: true,
            contractName: contractName,
            functions: functions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 合约调用 API
app.post('/api/contract/call', async (req, res) => {
    try {
        const {
            chainId,
            contractAddress,
            contractName,
            functionName,
            params = [],
            fromAddress,
            value = 0
        } = req.body;

        // 验证必要参数
        if (!chainId || !contractAddress || !contractName || !functionName) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数',
                required: ['chainId', 'contractAddress', 'contractName', 'functionName']
            });
        }

        // 验证链ID
        const chainExists = rpcConfig.some(chain => chain.chainId === chainId || chain.networkId === chainId);
        if (!chainExists) {
            return res.status(400).json({
                success: false,
                error: `不支持的链ID: ${chainId}`
            });
        }

        // 验证合约是否存在
        const supportedContracts = getSupportedContracts();
        if (!supportedContracts.includes(contractName)) {
            return res.status(400).json({
                success: false,
                error: `不支持的合约: ${contractName}`,
                supportedContracts: supportedContracts
            });
        }

        // 调用合约
        const result = await handleContractCall(
            chainId,
            contractAddress,
            contractName,
            functionName,
            params,
            fromAddress,
            value
        );

        res.json({
            success: true,
            result: result,
            callInfo: {
                chainId: chainId,
                contractAddress: contractAddress,
                contractName: contractName,
                functionName: functionName,
                params: params,
                fromAddress: fromAddress,
                value: value
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`RPC 代理服务运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`链列表: http://localhost:${PORT}/api/chains`);
});

// Vercel 服务器导出
module.exports = app;