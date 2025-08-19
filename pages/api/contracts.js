import { abiConfig, getSupportedContracts } from '../../lib/rpcHandler';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

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
}