import { promises as fs } from 'fs';
import path from 'path';

const translations = {
    en: {
        // Main page content
        title: "Ethers RPC Proxy",
        subtitle: "A Vercel-deployable ethers.js RPC proxy service that provides unified RPC interface access to multiple blockchain networks.",
        subtitleChinese: "（支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。）",
        apiEndpoints: "API Endpoints",
        realTimeContractCall: "Real-time Contract Call",
        chainId: "Chain ID:",
        contractAddress: "Contract Address:",
        contractName: "Contract Name:",
        functionName: "Function Name:",
        parameters: "Parameters (comma separated):",
        calling: "Calling...",
        callContract: "Call Contract",
        error: "Error:",
        callResult: "Call Result:",
        usageExamples: "Usage Examples",
        rpcRequestExample: "RPC Request Example",
        contractCallExample: "Contract Call Example",
        healthCheck: "Health Check",
        healthCheckDescription: "Visit /api/health to check service status",
        healthCheckChinese: "（访问 /api/health 查看服务状态）",
        footer: "Ethers RPC Proxy service deployed on Vercel",
        footerChinese: "（部署在 Vercel 上的 Ethers RPC Proxy 服务）",
        networkError: "Network request failed: ",
        switchToChinese: "Switch to Chinese",
        switchToEnglish: "Switch to English"
    },
    zh: {
        // Main page content
        title: "Ethers RPC 代理服务",
        subtitle: "一个可在 Vercel 部署的 ethers.js RPC 代理服务，提供统一的 RPC 接口访问多个区块链网络。",
        subtitleChinese: "（支持在 Vercel 上部署的 ethers.js 调用中转服务，提供统一的 RPC 接口访问多个区块链网络。）",
        apiEndpoints: "API 端点",
        realTimeContractCall: "实时合约调用",
        chainId: "链 ID:",
        contractAddress: "合约地址:",
        contractName: "合约名称:",
        functionName: "函数名:",
        parameters: "参数 (用逗号分隔):",
        calling: "调用中...",
        callContract: "调用合约",
        error: "错误:",
        callResult: "调用结果:",
        usageExamples: "使用示例",
        rpcRequestExample: "RPC 请求示例",
        contractCallExample: "合约调用示例",
        healthCheck: "健康检查",
        healthCheckDescription: "访问 /api/health 查看服务状态",
        healthCheckChinese: "（访问 /api/health 查看服务状态）",
        footer: "部署在 Vercel 上的 Ethers RPC 代理服务",
        footerChinese: "（部署在 Vercel 上的 Ethers RPC Proxy 服务）",
        networkError: "网络请求失败: ",
        switchToChinese: "切换到中文",
        switchToEnglish: "Switch to English"
    }
};

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { lang } = req.query;
            const translation = translations[lang] || translations.en;
            res.status(200).json(translation);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch translations' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}