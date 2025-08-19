/**
 * Example usage of the Ethers RPC Proxy Service
 *
 * This file demonstrates how to use the RPC proxy service for various blockchain operations
 * including basic RPC calls, contract interactions, and utility functions.
 */

const axios = require('axios');

// Base URLs for the RPC proxy service
const RPC_PROXY_URL = 'http://localhost:3000/api/rpc';
const CONTRACT_PROXY_URL = 'http://localhost:3000/api/contract/call';

// Supported chain IDs mapping
const CHAIN_IDS = {
    ETHEREUM: 1,
    BSC: 56,
    POLYGON: 137,
    ARBITRUM: 42161,
    BASE: 8453,
    OPTIMISM: 10
};

/**
 * Send generic RPC request through the proxy
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} method - The RPC method to call
 * @param {Array} params - Array of parameters for the method
 * @returns {Promise<Object>} The response data from the RPC call
 * @throws {Error} If the RPC request fails
 */
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
        console.error('RPC request failed:', error.message);
        throw error;
    }
}

/**
 * Get the latest block number for a specific chain
 * @param {number|string} chainId - The chain ID or network ID
 * @returns {Promise<string>} The block number as hex string
 */
async function getBlockNumber(chainId) {
    const result = await sendRpcRequest(chainId, 'eth_blockNumber');
    return result.result;
}

/**
 * Get the balance of an address
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} address - The Ethereum address to check
 * @returns {Promise<string>} The balance in wei as hex string
 */
async function getBalance(chainId, address) {
    const result = await sendRpcRequest(chainId, 'eth_getBalance', [address, 'latest']);
    return result.result;
}

/**
 * Get the transaction count (nonce) of an address
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} address - The Ethereum address to check
 * @returns {Promise<number>} The transaction count
 */
async function getTransactionCount(chainId, address) {
    const result = await sendRpcRequest(chainId, 'eth_getTransactionCount', [address, 'latest']);
    return result.result;
}

/**
 * Get transaction information by hash
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} txHash - The transaction hash
 * @returns {Promise<Object>} The transaction object
 */
async function getTransaction(chainId, txHash) {
    const result = await sendRpcRequest(chainId, 'eth_getTransactionByHash', [txHash]);
    return result.result;
}

/**
 * Get block information by block number
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string|number} blockNumber - The block number (can be hex or decimal)
 * @returns {Promise<Object>} The block object
 */
async function getBlock(chainId, blockNumber) {
    const result = await sendRpcRequest(chainId, 'eth_getBlockByNumber', [blockNumber, false]);
    return result.result;
}

/**
 * Estimate gas cost for a transaction
 * @param {number|string} chainId - The chain ID or network ID
 * @param {Object} transaction - The transaction object
 * @returns {Promise<string>} Estimated gas limit as hex string
 */
async function estimateGas(chainId, transaction) {
    const result = await sendRpcRequest(chainId, 'eth_estimateGas', [transaction]);
    return result.result;
}

/**
 * Get list of supported blockchain networks
 * @returns {Promise<Object>} Object containing chains array
 */
async function getChains() {
    try {
        const response = await axios.get('http://localhost:3000/api/chains');
        return response.data;
    } catch (error) {
        console.error('Failed to get chains list:', error.message);
        throw error;
    }
}

/**
 * Get list of supported contracts
 * @returns {Promise<Object>} Object containing contracts array
 */
async function getSupportedContracts() {
    try {
        const response = await axios.get('http://localhost:3000/api/contracts');
        return response.data;
    } catch (error) {
        console.error('Failed to get contracts list:', error.message);
        throw error;
    }
}

/**
 * Get list of functions for a specific contract
 * @param {string} contractName - The name of the contract
 * @returns {Promise<Object>} Object containing contract functions
 */
async function getContractFunctions(contractName) {
    try {
        const response = await axios.get(`http://localhost:3000/api/contracts/${contractName}/functions`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get functions for contract ${contractName}:`, error.message);
        throw error;
    }
}

/**
 * Call a contract function through the proxy
 * @param {number|string} chainId - The chain ID or network ID
 * @param {string} contractAddress - The contract address
 * @param {string} contractName - The contract name (must match ABI configuration)
 * @param {string} functionName - The function name to call
 * @param {Array} params - Array of function parameters
 * @param {string} fromAddress - Optional sender address for write operations
 * @param {number} value - Optional value to send with the transaction (in wei)
 * @returns {Promise<Object>} The result of the contract call
 */
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
        console.error('Contract call failed:', error.message);
        throw error;
    }
}

/**
 * Run comprehensive examples demonstrating the RPC proxy service capabilities
 * This function showcases various blockchain operations including:
 * - Getting supported chains
 * - Fetching block numbers across networks
 * - Checking account balances
 * - Getting transaction counts
 * - Listing supported contracts
 * - Demonstrating contract function calls
 */
async function runExamples() {
    console.log('=== Ethers.js RPC Proxy Service Examples ===\n');

    try {
        // 1. Get supported chains list
        console.log('1. Getting supported chains list:');
        const chains = await getChains();
        console.log('Number of supported chains:', chains.chains.length);
        console.log('First 3 chains:', chains.chains.slice(0, 3).map(c => `${c.name} (ID: ${c.chainId})`).join(', '));
        console.log('');

        // 2. Get block numbers for different networks
        console.log('2. Getting block numbers for different networks:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const blockNumber = await getBlockNumber(chainId);
                console.log(`${name}: Block number ${blockNumber}`);
            } catch (error) {
                console.log(`${name}: Connection failed - ${error.message}`);
            }
        }
        console.log('');

        // 3. Get balance for a specific address
        const testAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // Example address
        console.log('3. Getting balance for a specific address:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const balance = await getBalance(chainId, testAddress);
                console.log(`${name}: Balance ${balance} wei`);
            } catch (error) {
                console.log(`${name}: Failed to get balance - ${error.message}`);
            }
        }
        console.log('');

        // 4. Get transaction count for an address
        console.log('4. Getting transaction count for an address:');
        for (const [name, chainId] of Object.entries(CHAIN_IDS)) {
            try {
                const txCount = await getTransactionCount(chainId, testAddress);
                console.log(`${name}: Transaction count ${txCount}`);
            } catch (error) {
                console.log(`${name}: Failed to get transaction count - ${error.message}`);
            }
        }
        console.log('');

        // 5. Get supported contracts list
        console.log('5. Getting supported contracts list:');
        const contracts = await getSupportedContracts();
        console.log('Number of supported contracts:', contracts.contracts.length);
        console.log('Supported contracts:', contracts.contracts.join(', '));
        console.log('');

        // 6. Get functions for a specific contract
        if (contracts.contracts.length > 0) {
            const firstContract = contracts.contracts[0];
            console.log(`6. Getting functions for contract ${firstContract}:`);
            const functions = await getContractFunctions(firstContract);
            console.log(`Number of functions in ${firstContract}:`, functions.functions.length);
            console.log('First 3 functions:', functions.functions.slice(0, 3).map(f => `${f.name}(${f.inputs.map(i => i.type).join(', ')})`).join(', '));
            console.log('');
        }

        // 7. Contract call example
        console.log('7. Contract call example:');
        if (contracts.contracts.length > 0) {
            const firstContract = contracts.contracts[0];
            const functions = await getContractFunctions(firstContract);

            // Find a view/pure function to call
            const viewFunction = functions.functions.find(f =>
                f.stateMutability === 'view' || f.stateMutability === 'pure'
            );

            if (viewFunction) {
                console.log(`Attempting to call ${viewFunction.name} function in contract ${firstContract}:`);

                // Using example address, replace with real contract address in production
                const exampleContractAddress = '0x1234567890123456789012345678901234567890';

                try {
                    const result = await callContractFunction(
                        1, // Ethereum Mainnet
                        exampleContractAddress,
                        firstContract,
                        viewFunction.name,
                        [] // Adjust parameters based on actual function requirements
                    );
                    console.log('Call result:', result);
                } catch (error) {
                    console.log('Call failed:', error.message);
                }
            } else {
                console.log('No view/pure functions found for calling');
            }
        }
        console.log('');

        console.log('=== Examples completed ===');

    } catch (error) {
        console.error('Examples execution failed:', error.message);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples();
}

// Export utility functions for use in other modules
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