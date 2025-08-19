import { rpcConfig } from '../../lib/rpcHandler';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}