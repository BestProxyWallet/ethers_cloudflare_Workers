import { abiConfig, getContractFunctions } from '../../../lib/rpcHandler';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { contractName } = req.query;
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
}