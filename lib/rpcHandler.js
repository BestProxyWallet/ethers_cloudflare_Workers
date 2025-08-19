import axios from 'axios';
import { ethers } from 'ethers';

// 加载 RPC 配置
import rpcConfig from './rpcs.json';

// 加载 ABI 配置
import abiConfig from './abi.json';

// 检测 RPC 节点是否可用
async function isRpcAvailable(rpcUrl, timeout = 5000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        return response.data && response.data.result !== undefined;
    } catch (error) {
        return false;
    }
}

// 获取指定链的 RPC URL
async function getRpcUrl(chainId) {
    const chain = rpcConfig.find(c => c.chainId === chainId || c.networkId === chainId);
    if (!chain) {
        throw new Error(`未找到链 ID ${chainId} 的配置`);
    }

    // 获取所有 RPC 节点 URL
    const rpcUrls = chain.rpc.map(r => r.url);

    // 随机打乱 RPC 节点顺序
    const shuffledUrls = [...rpcUrls].sort(() => Math.random() - 0.5);

    // 依次检测每个 RPC 节点的可用性
    for (const url of shuffledUrls) {
        const isAvailable = await isRpcAvailable(url);
        if (isAvailable) {
            console.log(`✅ 找到可用 RPC 节点: ${url}`);
            return url;
        }
        console.log(`❌ RPC 节点不可用: ${url}`);
    }

    // 如果没有可用的 RPC 节点，抛出错误
    throw new Error(`链 ${chain.name} (${chainId}) 没有可用的 RPC 节点`);
}

// 创建 RPC 提供者
async function createRpcProvider(chainId) {
    const rpcUrl = await getRpcUrl(chainId);
    return new ethers.JsonRpcProvider(rpcUrl);
}

// 通用 RPC 请求处理
async function handleRpcRequest(rpcRequest, chainId) {
    try {
        const provider = await createRpcProvider(chainId);

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
                const rpcUrl = await getRpcUrl(chainId);
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
        const provider = await createRpcProvider(chainId);

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

        // 处理BigInt序列化问题
        const processBigInt = (value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            } else if (Array.isArray(value)) {
                return value.map(item => processBigInt(item));
            } else if (value && typeof value === 'object') {
                const processed = {};
                for (const key in value) {
                    processed[key] = processBigInt(value[key]);
                }
                return processed;
            }
            return value;
        };

        const processedResult = processBigInt(result);
        return processedResult;
    } catch (error) {
        console.error('合约调用错误rpc:', error.message);
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

export {
    rpcConfig,
    abiConfig,
    getRpcUrl,
    createRpcProvider,
    handleRpcRequest,
    handleContractCall,
    getSupportedContracts,
    getContractFunctions
};