import { handleRpcRequest } from '../../lib/rpcHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

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
        console.error('RPC 请求错误:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}