# RPC Configuration Documentation

## Overview

This file contains configuration for supported blockchain networks including:
- RPC endpoints for each network
- Network metadata (name, chain ID, native currency, etc.)
- Explorer URLs and other network information

## Structure

Each network configuration object contains the following fields:

### Required Fields
- **name**: Display name of the network (e.g., "Ethereum Mainnet")
- **chain**: Chain identifier (e.g., "ETH", "BSC", "POLYGON")
- **rpc**: Array of RPC endpoints with tracking information
- **chainId**: Unique chain identifier (integer)
- **networkId**: Alternative network identifier (integer)

### Optional Fields
- **icon**: Icon identifier for UI display
- **nativeCurrency**: Information about the native token
  - **name**: Token name (e.g., "Ethereum")
  - **symbol**: Token symbol (e.g., "ETH")
  - **decimals**: Number of decimals (usually 18)
- **explorers**: List of blockchain explorers
  - **name**: Explorer name
  - **url**: Explorer URL
  - **standard**: Explorer standard (e.g., "EIP3091")
  - **icon**: Explorer icon identifier
- **status**: Network status (e.g., "active", "deprecated")
- **faucets**: List of faucet URLs for testnets
- **infoURL**: Official network information URL
- **shortName**: Short name for the network
- **slip44**: SLIP-44 BIP32 coin type
- **features**: List of supported features (e.g., ["EIP155", "EIP1559"])

### RPC Endpoint Structure
Each RPC endpoint object contains:
- **url**: The RPC endpoint URL
- **tracking**: Tracking status ("none", "yes", "limited")
- **isOpenSource**: Whether the endpoint is open source (boolean)

## Usage

The RPC configuration is used by the RPC handler to:
1. Automatically select available RPC nodes
2. Load balance requests across multiple endpoints
3. Provide network information to clients
4. Validate chain IDs and network IDs

## Adding New Networks

To add a new network:
1. Add a new object to the array with all required fields
2. Include at least one RPC endpoint URL
3. Set appropriate chainId and networkId
4. Add explorer URLs if available
5. Include native currency information

## Notes

- JSON files cannot contain comments, so documentation is provided separately
- The RPC handler automatically shuffles and tests RPC endpoints for availability
- Testnets should include faucet URLs for easy testing
- Mainnets should prioritize stable, well-known RPC providers