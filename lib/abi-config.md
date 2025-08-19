# ABI Configuration Documentation

## Overview

This file contains Application Binary Interface (ABI) configurations for supported smart contracts. The ABI is used by the RPC proxy service to interact with smart contracts on different blockchain networks.

## Structure

The JSON file contains an object where keys are contract names and values are arrays of ABI items.

### Contract Names
- **Imputations**: Main imputation contract for handling token distributions and treasury management
- **token**: Standard ERC20 token contract implementation

### ABI Item Types

#### Functions
- **type**: "function"
- **name**: Function name
- **inputs**: Array of input parameters
- **outputs**: Array of return values
- **stateMutability**: "view", "pure", "nonpayable", or "payable"

#### Events
- **type**: "event"
- **name**: Event name
- **inputs**: Array of event parameters
- **anonymous**: Boolean indicating if the event is anonymous

#### Errors
- **type**: "error"
- **name**: Error name
- **inputs**: Array of error parameters

#### Constructor
- **type**: "constructor"
- **inputs**: Array of constructor parameters
- **stateMutability**: "nonpayable"

### Parameter Structure

Each parameter contains:
- **name**: Parameter name
- **type**: Data type (e.g., "address", "uint256", "string", "bytes32")
- **internalType**: Internal type specification (e.g., "contract IERC20")
- **indexed**: Boolean for event parameters (only indexed parameters can be filtered)

### State Mutability

- **view**: Function reads data but doesn't modify state
- **pure**: Function reads no data and doesn't modify state
- **nonpayable**: Function can modify state but cannot receive Ether
- **payable**: Function can modify state and can receive Ether

## Usage

The ABI configuration is used by the RPC handler to:
1. Create contract instances for interaction
2. Validate function calls and parameters
3. Parse function return values
4. Handle events and errors
5. Generate function metadata for API documentation

## Key Contracts

### Imputations Contract
This is the main contract for handling:
- Token imputation and distribution
- Treasury management
- Wallet address generation
- Affiliate system
- Token swaps and transfers

**Key Functions:**
- `get_total_balances()`: Get comprehensive balance information
- `gettokenbalance()`: Get balance for specific token and path
- `imputationtoken()`: Perform token imputation
- `imputationtokenandswap()`: Perform token imputation with swap
- `getwalletadd()`: Generate wallet addresses
- `pi_token()`: Perform token transfers

### Token Contract
Standard ERC20 token implementation with:
- Basic token operations (transfer, approve, transferFrom)
- Balance and allowance queries
- Token metadata (name, symbol, decimals)

## Adding New Contracts

To add a new contract:
1. Add a new key-value pair to the JSON object
2. Use the contract name as the key
3. Provide the complete ABI array as the value
4. Ensure all function signatures match the deployed contract

## Notes

- JSON files cannot contain comments, so documentation is provided separately
- The ABI must match exactly with the deployed contract bytecode
- Function signatures should be consistent across different contract versions
- Events should be included for comprehensive event handling