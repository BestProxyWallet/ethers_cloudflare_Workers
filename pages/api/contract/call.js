import { rpcConfig, abiConfig, getSupportedContracts, handleContractCall } from '../../lib/rpcHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

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

        // 验证必要参数
        if (!chainId || !contractAddress || !contractName || !functionName) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数',
                required: ['chainId', 'contractAddress', 'contractName', 'functionName']
            });
        }

        // 验证链ID
        const chainExists = rpcConfig.some(chain => chain.chainId === chainId || chain.networkId === chainId);
        if (!chainExists) {
            return res.status(400).json({
                success: false,
                error: `不支持的链ID: ${chainId}`
            });
        }

        // 验证合约是否存在
        const supportedContracts = getSupportedContracts();
        if (!supportedContracts.includes(contractName)) {
            return res.status(400).json({
                success: false,
                error: `不支持的合约: ${contractName}`,
                supportedContracts: supportedContracts
            });
        }

        // 调用合约
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
        console.error('合约调用错误:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}