import { handleRpcRequest } from '../../lib/rpcHandler';

/**
 * API Handler for RPC Requests
 *
 * This endpoint handles generic blockchain RPC requests and forwards them to the appropriate
 * blockchain network based on the provided chain ID. It supports all standard Ethereum RPC methods.
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
        const { chainId, request } = req.body;

        // Validate required parameters
        if (!chainId || !request) {
            return res.status(400).json({
                error: 'Missing required parameters',
                message: 'Both chainId and request parameters are required'
                // 缺少必要参数
                // 需要 chainId 和 request 参数
            });
        }

        // Process the RPC request
        const result = await handleRpcRequest(request, chainId);

        // Return successful response
        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('RPC request error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}