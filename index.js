/**
 * Ethers RPC Proxy Server
 * A middleware service for blockchain RPC calls with multi-chain support and contract interaction capabilities
 *
 * This server provides a unified interface to access multiple blockchain networks through RPC endpoints,
 * with support for both standard RPC calls and predefined contract interactions.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ethers = require('ethers');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
// Enable CORS for cross-origin requests
app.use(cors());
// Enable JSON body parsing for incoming requests
app.use(express.json());

// Load configuration files
// RPC network configuration containing supported blockchain networks and their endpoints
const rpcConfig = require('./rpcs.json');
// Contract ABI configuration containing predefined contract interfaces
const abiConfig = require('./abi.json');

/**
 * Get RPC URL for a specific chain
 * @param {number|string} chainId - The chain ID or network ID to get RPC URL for
 * @returns {string} The RPC URL for the specified chain
 * @throws {Error} If chain configuration is not found
 */
function getRpcUrl(chainId) {
    // Find chain configuration by chainId or networkId
    const chain = rpcConfig.find(c => c.chainId === chainId || c.networkId === chainId);
    if (!chain) {
        throw new Error(`Configuration not found for chain ID ${chainId}`);
    }

    // Randomly select one RPC node from available endpoints for load balancing
    const rpcUrls = chain.rpc.map(r => r.url);
    return rpcUrls[Math.floor(Math.random() * rpcUrls.length)];
}

/**
 * Create ethers.js JsonRpcProvider for a specific chain
 * @param {number|string} chainId - The chain ID or network ID to create provider for
 * @returns {ethers.JsonRpcProvider} The RPC provider instance
 */
function createRpcProvider(chainId) {
    const rpcUrl = getRpcUrl(chainId);
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Handle generic RPC requests
 * @param {Object} rpcRequest - The RPC request object containing method and params
 * @param {number|string} chainId - The chain ID or network ID to process the request on
 * @returns {Promise<any>} The result of the RPC call
 * @throws {Error} If the RPC request fails
 */
async function handleRpcRequest(rpcRequest, chainId) {
    try {
        const provider = createRpcProvider(chainId);

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
                // For other methods, use generic RPC call
                const rpcUrl = getRpcUrl(chainId);
                const response = await axios.post(rpcUrl, rpcRequest, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                return response.data.result;
        }
    } catch (error) {
        console.error('RPC request error:', error.message);
        throw error;
    }
}

/**
 * Handle contract function calls
 * @param {number|string} chainId - The chain ID or network ID to call the contract on
 * @param {string} contractAddress - The address of the contract to call
 * @param {string} contractName - The name of the contract (must match ABI configuration)
 * @param {string} functionName - The name of the function to call
 * @param {Array} params - Array of parameters for the function call
 * @param {string} fromAddress - Optional sender address for write operations
 * @param {number} value - Optional value to send with the transaction (in wei)
 * @returns {Promise<any>} The result of the contract call
 * @throws {Error} If the contract call fails
 */
async function handleContractCall(chainId, contractAddress, contractName, functionName, params = [], fromAddress = null, value = 0) {
    try {
        const provider = createRpcProvider(chainId);

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

        return result;
    } catch (error) {
        console.error('Contract call error index:', error.message);
        throw error;
    }
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

// API Routes

/**
 * Handle generic RPC requests
 * POST /api/rpc
 * Request body: { chainId: number|string, request: { method: string, params: Array } }
 */
app.post('/api/rpc', async (req, res) => {
    try {
        const { chainId, request } = req.body;

        if (!chainId || !request) {
            return res.status(400).json({
                error: 'Missing required parameters',
                message: 'chainId and request parameters are required'
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

/**
 * Get list of supported blockchain networks
 * GET /api/chains
 * Returns: { success: boolean, chains: Array<{ chainId, name, symbol, decimals, rpcUrls }> }
 */
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

/**
 * Get list of supported contracts
 * GET /api/contracts
 * Returns: { success: boolean, contracts: Array<string> }
 */
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

/**
 * Get list of functions for a specific contract
 * GET /api/contracts/:contractName/functions
 * Returns: { success: boolean, contractName: string, functions: Array<{ name, inputs, outputs, stateMutability }> }
 */
app.get('/api/contracts/:contractName/functions', (req, res) => {
    try {
        const { contractName } = req.params;
        const functions = getContractFunctions(contractName);

        if (functions.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Contract ${contractName} not found or has no functions`
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

/**
 * Handle contract function calls
 * POST /api/contract/call
 * Request body: { chainId, contractAddress, contractName, functionName, params?, fromAddress?, value? }
 */
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

        // Validate required parameters
        if (!chainId || !contractAddress || !contractName || !functionName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                required: ['chainId', 'contractAddress', 'contractName', 'functionName']
            });
        }

        // Validate chain ID
        const chainExists = rpcConfig.some(chain => chain.chainId === chainId || chain.networkId === chainId);
        if (!chainExists) {
            return res.status(400).json({
                success: false,
                error: `Unsupported chain ID: ${chainId}`
            });
        }

        // Validate contract existence
        const supportedContracts = getSupportedContracts();
        if (!supportedContracts.includes(contractName)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported contract: ${contractName}`,
                supportedContracts: supportedContracts
            });
        }

        // Call contract function
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

/**
 * Health check endpoint
 * GET /health
 * Returns: { status: string, timestamp: string, version: string }
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`RPC proxy service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Chains list: http://localhost:${PORT}/api/chains`);
});

// Export for Vercel serverless deployment
module.exports = app;