/**
 * RPC Handler Module
 *
 * This module provides advanced RPC handling capabilities with automatic node selection,
 * health checking, and enhanced error handling for blockchain operations.
 */

import axios from 'axios';
import { ethers } from 'ethers';

// Load RPC configuration
import rpcConfig from './rpcs.json';

// Load ABI configuration
import abiConfig from './abi.json';

/**
 * Check if an RPC node is available and responsive
 * @param {string} rpcUrl - The RPC URL to check
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if the RPC node is available
 */
async function isRpcAvailable(rpcUrl, timeout = 1000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // 使用动态ID避免并发请求冲突
        const dynamicId = Date.now() + Math.random();

        const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: dynamicId
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'BestProxyWallet/1.0'
            },
            signal: controller.signal,
            timeout: timeout
        });

        clearTimeout(timeoutId);

        // 检查响应ID是否匹配
        if (response.data.id !== dynamicId) {
            console.warn(`RPC node ${rpcUrl} returned ID mismatch - marking as unavailable`);
            return false;
        }

        // 检查成功响应
        if (response.status === 200 && response.data && response.data.result !== undefined) {
            return true;
        }

        // 处理特定错误情况
        if (response.status === 406) {
            console.warn(`RPC node ${rpcUrl} returned 406 Not Acceptable - marking as unavailable`);
        } else if (response.status === 402) {
            console.warn(`RPC node ${rpcUrl} returned 402 Payment Required - marking as unavailable`);
        } else if (response.status === 400) {
            console.warn(`RPC node ${rpcUrl} returned 400 Bad Request - marking as unavailable`);
        } else if (response.status >= 400) {
            console.warn(`RPC node ${rpcUrl} returned HTTP ${response.status} - marking as unavailable`);
        }

        return false;
    } catch (error) {
        // 处理不同类型的错误
        if (error.code === 'ECONNABORTED') {
            console.warn(`RPC node ${rpcUrl} timeout - marking as unavailable`);
        } else if (error.response) {
            // HTTP错误响应
            const status = error.response.status;
            if (status === 406) {
                console.warn(`RPC node ${rpcUrl} returned 406 Not Acceptable - marking as unavailable`);
            } else if (status === 402) {
                console.warn(`RPC node ${rpcUrl} returned 402 Payment Required - marking as unavailable`);
            } else if (status === 400) {
                console.warn(`RPC node ${rpcUrl} returned 400 Bad Request - marking as unavailable`);
            } else if (status >= 400) {
                console.warn(`RPC node ${rpcUrl} returned HTTP ${status} - marking as unavailable`);
            }
        } else if (error.request) {
            // 网络错误
            console.warn(`RPC node ${rpcUrl} network error - marking as unavailable`);
        } else {
            // 其他错误
            console.warn(`RPC node ${rpcUrl} error: ${error.message} - marking as unavailable`);
        }
        return false;
    }
}

/**
 * Get RPC URL for a specific chain with automatic node selection
 * @param {number|string} chainId - The chain ID or network ID
 * @returns {Promise<string>} The available RPC URL
 * @throws {Error} If no available RPC nodes are found
 */
async function getRpcUrl(chainId) {
    const chain = rpcConfig.find(c => c.chainId === chainId || c.networkId === chainId);
    if (!chain) {
        throw new Error(`Configuration not found for chain ID ${chainId}`);
    }

    // Get all RPC node URLs
    const rpcUrls = chain.rpc.map(r => r.url);

    // Randomly shuffle RPC node order for load balancing
    const shuffledUrls = [...rpcUrls].sort(() => Math.random() - 0.5);

    // Concurrent check for 3 RPC nodes
    const checkNodes = async () => {
        // Take first 3 nodes for concurrent checking
        const nodesToCheck = shuffledUrls.slice(0, 3);

        // Create promises for all 3 nodes
        const promises = nodesToCheck.map(async (url) => {
            try {
                const isAvailable = await isRpcAvailable(url);
                return { url, available: isAvailable };
            } catch (error) {
                return { url, available: false };
            }
        });

        // Wait for all checks to complete
        const results = await Promise.allSettled(promises);

        // Find first available node
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { url, available } = result.value;
                if (available) {
                    console.log(`✅ Found available RPC node (concurrent): ${url}`);
                    return url;
                }
                console.log(`❌ RPC node not available (concurrent): ${url}`);
            }
        }

        return null;
    };

    // First try concurrent check with 3 nodes
    const availableUrl = await checkNodes();
    if (availableUrl) {
        return availableUrl;
    }

    // If none of the first 3 are available, check remaining nodes sequentially
    for (const url of shuffledUrls.slice(3)) {
        const isAvailable = await isRpcAvailable(url);
        if (isAvailable) {
            console.log(`✅ Found available RPC node (fallback): ${url}`);
            return url;
        }
        console.log(`❌ RPC node not available (fallback): ${url}`);
    }

    // If no available RPC nodes are found, throw error
    throw new Error(`No available RPC nodes for chain ${chain.name} (${chainId})`);
}

/**
 * Create ethers.js JsonRpcProvider with automatic node selection
 * @param {number|string} chainId - The chain ID or network ID
 * @returns {Promise<ethers.JsonRpcProvider>} The RPC provider instance
 */
async function createRpcProvider(chainId) {
    const rpcUrl = await getRpcUrl(chainId);
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Handle generic RPC requests with automatic node selection
 * @param {Object} rpcRequest - The RPC request object containing method and params
 * @param {number|string} chainId - The chain ID or network ID to process the request on
 * @returns {Promise<any>} The result of the RPC call
 * @throws {Error} If the RPC request fails
 */
async function handleRpcRequest(rpcRequest, chainId) {
    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const provider = await createRpcProvider(chainId);

            // Process different method types
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
                    // For other methods, use generic RPC call with better error handling
                    const rpcUrl = await getRpcUrl(chainId);
                    try {
                        const response = await axios.post(rpcUrl, rpcRequest, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'User-Agent': 'BestProxyWallet/1.0'
                            },
                            timeout: 10000
                        });
                        return response.data.result;
                    } catch (axiosError) {
                        console.error('Generic RPC call failed:', axiosError.message);
                        if (axiosError.response && axiosError.response.status === 406) {
                            console.error('RPC node returned 406 Not Acceptable, trying next available node...');
                            // Force retry with next available node
                            const newRpcUrl = await getRpcUrl(chainId);
                            const retryResponse = await axios.post(newRpcUrl, rpcRequest, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'User-Agent': 'BestProxyWallet/1.0'
                                },
                                timeout: 10000
                            });
                            return retryResponse.data.result;
                        }
                        throw axiosError;
                    }
            }
        } catch (error) {
            lastError = error;
            console.error(`RPC request error (attempt ${attempt}/${maxRetries}):`, error.message);

            // 如果是节点错误，尝试切换到下一个节点
            if (error.message.includes('406 Not Acceptable') ||
                error.message.includes('402 Payment Required') ||
                error.message.includes('network error') ||
                error.message.includes('timeout') ||
                error.message.includes('400 Bad Request') ||
                error.message.includes('SERVER_ERROR')) {
                console.log(`RPC node failed, trying next available node...`);
                // 继续循环，会自动选择下一个节点
                continue;
            }

            // 如果是其他错误，直接抛出
            throw error;
        }
    }

    // 如果所有重试都失败了，抛出最后一个错误
    throw lastError;
}

/**
 * Handle contract function calls with automatic node selection and BigInt serialization
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} contractAddress - The address of the contract to call
 * @param {string} contractName - The name of the contract (must match ABI configuration)
 * @param {string} functionName - The name of the function to call
 * @param {Array} params - Array of parameters for the function call
 * @param {string} fromAddress - Optional sender address for write operations
 * @param {number} value - Optional value to send with the transaction (in wei)
 * @returns {Promise<any>} The result of the contract call with BigInt serialized
 * @throws {Error} If the contract call fails
 */
async function handleContractCall(chainId, contractAddress, contractName, functionName, params = [], fromAddress = null, value = 0) {
    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const provider = await createRpcProvider(chainId);

            // Get contract ABI from configuration
            const contractAbi = abiConfig[contractName];
            if (!contractAbi) {
                throw new Error(`ABI configuration not found for contract ${contractName}`);
            }

            // Create contract instance
            const contract = new ethers.Contract(contractAddress, contractAbi, provider);

            // Process function parameters
            let processedParams = params;

            // For write operations, create a sender wallet
            if (fromAddress) {
                const wallet = new ethers.Wallet(fromAddress, provider);
                contract.connect(wallet);
            }

            // Call contract function
            let result;
            if (functionName === 'constructor') {
                throw new Error('Cannot directly call constructor');
            }

            // Check if function exists
            const functionExists = contract.interface.getFunction(functionName);
            if (!functionExists) {
                throw new Error(`Function ${functionName} does not exist in contract ${contractName}`);
            }

            // Choose call method based on function mutability
            const functionFragment = contract.interface.getFunction(functionName);
            if (functionFragment.stateMutability === 'view' || functionFragment.stateMutability === 'pure') {
                // Read operation
                result = await contract[functionName](...processedParams);
            } else {
                // Write operation - need to estimate gas and send transaction
                if (!fromAddress) {
                    throw new Error('Write operations require fromAddress');
                }

                // Estimate gas
                const gasEstimate = await contract[functionName].estimateGas(...processedParams, {
                    value: value
                });

                // Send transaction
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

            // Handle BigInt serialization issues
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
            lastError = error;
            console.error(`Contract call error rpc (attempt ${attempt}/${maxRetries}):`, error.message);

            // 如果是节点错误，尝试切换到下一个节点
            if (error.message.includes('406 Not Acceptable') ||
                error.message.includes('402 Payment Required') ||
                error.message.includes('network error') ||
                error.message.includes('timeout') ||
                error.message.includes('JsonRpcProvider failed to detect network') ||
                error.message.includes('400 Bad Request') ||
                error.message.includes('SERVER_ERROR')) {
                console.log(`RPC node failed, trying next available node...`);
                // 继续循环，会自动选择下一个节点
                continue;
            }

            // 如果是其他错误，直接抛出
            throw error;
        }
    }

    // 如果所有重试都失败了，抛出最后一个错误
    throw lastError;
}

/**
 * Get list of supported contracts from ABI configuration
 * @returns {Array<string>} Array of contract names
 */
function getSupportedContracts() {
    return Object.keys(abiConfig);
}

/**
 * Get list of functions for a specific contract
 * @param {string} contractName - The name of the contract
 * @returns {Array<Object>} Array of function objects with metadata
 */
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

// Export all functions and configurations
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