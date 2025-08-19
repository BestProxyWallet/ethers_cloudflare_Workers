const axios = require('axios');

// RPC 代理服务的基础 URL
const RPC_PROXY_URL = 'http://localhost:3000/api/rpc';
const CONTRACT_PROXY_URL = 'http://localhost:3000/api/contract/call';

// 支持的链 ID
const CHAIN_IDS = {
    ETHEREUM: 1,
    BSC: 56,
    POLYGON: 137,
    ARBITRUM: 42161,
    BASE: 8453,
    OPTIMISM: 10
};

// 发送 RPC 请求的通用函数
async function sendRpcRequest(chainId, method, params = []) {
    try {
        const response = await axios.post(RPC_PROXY_URL, {
            chainId,
            request: {
                method,
                params,
                id: 1,
                jsonrpc: '2.0'
            }
        });

        return response.data;
    } catch (error) {
        console.error('RPC 请求失败:', error.message);
        throw error;
    }
}

// 获取区块号
async function getBlockNumber(chainId) {
    const result = await sendRpcRequest(chainId, 'eth_blockNumber');
    return result.result;
}

// 获取账户余额
async function getBalance(chainId, address) {
    const result = await sendRpcRequest(chainId, 'eth_getBalance', [address, 'latest']);
    return result.result;
}

// 获取交易数量
async function getTransactionCount(chainId, address) {
    const result = await sendRpcRequest(chainId, 'eth_getTransactionCount', [address, 'latest']);
    return result.result;
}

// 获取交易信息
async function getTransaction(chainId, txHash) {
    const result = await sendRpcRequest(chainId, 'eth_getTransactionByHash', [txHash]);
    return result.result;
}

// 获取区块信息
async function getBlock(chainId, blockNumber) {
    const result = await sendRpcRequest(chainId, 'eth_getBlockByNumber', [blockNumber, false]);
    return result.result;
}

// 估算 Gas 费用
async function estimateGas(chainId, transaction) {
    const result = await sendRpcRequest(chainId, 'eth_estimateGas', [transaction]);
    return result.result;
}

// 获取链列表
async function getChains() {
    try {
        const response = await axios.get('http://localhost:3000/api/chains');
        return response.data;
    } catch (error) {
        console.error('获取链列表失败:', error.message);
        throw error;
    }
}

// 获取支持的合约列表
async function getSupportedContracts() {
    try {
        const response = await axios.get('http://localhost:3000/api/contracts');
        return response.data;
    } catch (error) {
        console.error('获取合约列表失败:', error.message);
        throw error;
    }
}

// 获取合约的函数列表
async function getContractFunctions(contractName) {
    try {
        const response = await axios.get(`http://localhost:3000/api/contracts/${contractName}/functions`);
        return response.data;
    } catch (error) {
        console.error(`获取合约 ${contractName} 函数列表失败:`, error.message);
        throw error;
    }
}

// 调用合约函数
async function callContractFunction(chainId, contractAddress, contractName, functionName, params = [], fromAddress = null, value = 0) {
    try {
        const response = await axios.post(CONTRACT_PROXY_URL, {
            chainId,
            contractAddress,
            contractName,
            functionName,
            params,
            fromAddress,
            value
        });
        return response.data;
    } catch (error) {
        console.error('合约调用失败:', error.message);
        throw error;
    }
}

// 使用示例
async function runExamples() {
    console.log('=== Ethers.js RPC 代理服务示例 ===\n');

    try {
        // 1. 获取支持的链列表
        console.log('1. 获取支持的链列表:');
        const chains = await getChains();
        console.log('支持的链数量:', chains.chains.length);
        console.log('前 3 个链:', chains.chains.slice(0, 3).map(c => `${c.name} (ID: ${c.chainId})`).join(', '));
        console.log('');

        // 2. 获取各网络的区块号
        console.log('2. 获取各网络的区块号:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const blockNumber = await getBlockNumber(chainId);
                console.log(`${name}: 区块号 ${blockNumber}`);
            } catch (error) {
                console.log(`${name}: 无法连接 - ${error.message}`);
            }
        }
        console.log('');

        // 3. 获取指定地址的余额
        const testAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // 示例地址
        console.log('3. 获取指定地址的余额:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const balance = await getBalance(chainId, testAddress);
                console.log(`${name}: 余额 ${balance} wei`);
            } catch (error) {
                console.log(`${name}: 无法获取余额 - ${error.message}`);
            }
        }
        console.log('');

        // 4. 获取交易数量
        console.log('4. 获取地址的交易数量:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const txCount = await getTransactionCount(chainId, testAddress);
                console.log(`${name}: 交易数量 ${txCount}`);
            } catch (error) {
                console.log(`${name}: 无法获取交易数量 - ${error.message}`);
            }
        }
        console.log('');

        // 5. 获取支持的合约列表
        console.log('5. 获取支持的合约列表:');
        const contracts = await getSupportedContracts();
        console.log('支持的合约数量:', contracts.contracts.length);
        console.log('支持的合约:', contracts.contracts.join(', '));
        console.log('');

        // 6. 获取合约的函数列表
        if (contracts.contracts.length > 0) {
            const firstContract = contracts.contracts[0];
            console.log(`6. 获取合约 ${firstContract} 的函数列表:`);
            const functions = await getContractFunctions(firstContract);
            console.log(`合约 ${firstContract} 的函数数量:`, functions.functions.length);
            console.log('前 3 个函数:', functions.functions.slice(0, 3).map(f => `${f.name}(${f.inputs.map(i => i.type).join(', ')})`).join(', '));
            console.log('');
        }

        // 7. 合约调用示例
        console.log('7. 合约调用示例:');
        if (contracts.contracts.length > 0) {
            const firstContract = contracts.contracts[0];
            const functions = await getContractFunctions(firstContract);

            // 查找一个 view/pure 函数进行调用
            const viewFunction = functions.functions.find(f =>
                f.stateMutability === 'view' || f.stateMutability === 'pure'
            );

            if (viewFunction) {
                console.log(`尝试调用合约 ${firstContract} 的 ${viewFunction.name} 函数:`);

                // 这里使用一个示例地址，实际使用时需要替换为真实的合约地址
                const exampleContractAddress = '0x1234567890123456789012345678901234567890';

                try {
                    const result = await callContractFunction(
                        1, // Ethereum Mainnet
                        exampleContractAddress,
                        firstContract,
                        viewFunction.name,
                        [] // 参数根据实际情况调整
                    );
                    console.log('调用结果:', result);
                } catch (error) {
                    console.log('调用失败:', error.message);
                }
            } else {
                console.log('未找到可调用的 view/pure 函数');
            }
        }
        console.log('');

        console.log('=== 示例完成 ===');

    } catch (error) {
        console.error('示例执行失败:', error.message);
    }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
    runExamples();
}

module.exports = {
    sendRpcRequest,
    getBlockNumber,
    getBalance,
    getTransactionCount,
    getTransaction,
    getBlock,
    estimateGas,
    getChains
};