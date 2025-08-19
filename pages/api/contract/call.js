import { rpcConfig, abiConfig, getSupportedContracts, handleContractCall } from '../../../lib/rpcHandler';

/**
 * API Handler for Contract Calls
 *
 * This endpoint handles smart contract function calls across different blockchain networks.
 * It validates parameters, checks contract support, and forwards the call to the appropriate
 * blockchain network based on the provided chain ID.
 *
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Extract request parameters
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
                // 缺少必要参数
                // 需要 chainId, contractAddress, contractName, functionName
            });
        }

        // Validate chain ID
        const chainExists = rpcConfig.some(chain => chain.chainId === chainId || chain.networkId === chainId);
        if (!chainExists) {
            return res.status(400).json({
                success: false,
                error: `Unsupported chain ID: ${chainId}`
                // 不支持的链ID
            });
        }

        // Validate contract support
        const supportedContracts = getSupportedContracts();
        if (!supportedContracts.includes(contractName)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported contract: ${contractName}`,
                supportedContracts: supportedContracts
                // 不支持的合约
            });
        }

        // Execute contract call
        const result = await handleContractCall(
            chainId,
            contractAddress,
            contractName,
            functionName,
            params,
            fromAddress,
            value
        );

        // Return successful response with call information
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
        console.error('Contract call error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}