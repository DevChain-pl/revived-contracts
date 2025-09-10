# Revived Contracts

This repository contains the implementation and tests for two main contracts:

1. **Revived Token** - An ERC20 token with advanced features including burnable, pausable, and access control functionality
2. **Raffle Contract** - A contract that uses Chainlink VRF (Verifiable Random Function) v2.5 to select random winners from a list of participants

## Table of Contents

- [Revived Token Contract](#revived-token-contract)
- [Raffle Contract](#raffle-contract)
- [Installation](#installation)
- [Testing](#testing)
- [License](#license)

## Revived Token Contract

The Revived Token is an ERC20 token implementation with advanced features built on OpenZeppelin contracts. It provides a comprehensive token solution with security, flexibility, and governance features.

### Features

- **ERC20 Standard**: Full compliance with ERC20 token standard
- **Burnable**: Tokens can be burned by holders or approved accounts
- **Pausable**: Contract can be paused/unpaused by administrators
- **Access Control**: Role-based access control using OpenZeppelin's AccessControl
- **ERC20Permit**: Support for gasless approvals using EIP-2612
- **Initial Supply**: 1 billion tokens minted to the initial owner
- **Ownership Transfer**: Secure ownership transfer functionality

### Key Functions

- `transferOwnership(address newOwner)`: Transfer admin role to new owner
- `pause()` / `unpause()`: Pause/unpause token transfers
- `burn(uint256 value)`: Burn tokens from caller's balance
- `burnFrom(address account, uint256 value)`: Burn tokens from another account with allowance
- `permit(...)`: Gasless approval using EIP-2612

### Events

- `TokensMinted(address indexed recipient, uint256 amount)`: Emitted when tokens are minted
- `TokensBurned(address indexed account, uint256 amount)`: Emitted when tokens are burned
- `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`: Emitted when ownership is transferred

## Raffle Contract

The Raffle contract is designed to fairly select a specified number of winners from a list of participants. By leveraging Chainlink VRF, the contract ensures that the selection process is truly random and tamper-proof.

### Features

- Add participants to the raffle
- Request a random number from Chainlink VRF
- Select a specified number of unique winners based on the received random number
- Emit events for participant addition, randomness request, and winner selection

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/DevChain-pl/revived-contracts.git
   cd revived-contracts
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Compile the contracts:
   ```sh
   npx hardhat compile
   ```

## Usage

### Deploying Revived Token

Deploy the Revived token contract:

```sh
npx hardhat run scripts/deploy.js --network your-network
```

The contract will be deployed with the deployer as the initial owner and admin.

### Deploying Raffle Contract

Deploy the Raffle contract on your preferred Ethereum network:

1. Update the deployment script with the appropriate VRF Coordinator address and subscription ID.
2. Run the deployment script:
   ```sh
   npx hardhat run scripts/deploy.js --network your-network
   ```

## Testing

Run the tests to ensure both contracts behave as expected:

```sh
npx hardhat test
```

### Test Coverage

The project includes comprehensive test suites for both contracts:

#### Revived Token Tests (38 tests)
- **Deployment**: Name, symbol, decimals, initial supply, admin role, events
- **ERC20 Functionality**: Transfers, approvals, events
- **Access Control**: Ownership transfer, role management
- **Pause Functionality**: Pause/unpause, transfer restrictions
- **Burn Functionality**: Self-burn, burn from others, allowance checks
- **ERC20Permit**: Gasless approvals using EIP-2612
- **Edge Cases**: Zero amounts, error handling
- **Gas Optimization**: Gas cost measurements

#### Raffle Contract Tests (11 tests)
- **Deployment**: Owner verification
- **Participants Management**: Adding participants, event emission
- **Randomness Request**: VRF integration
- **Winner Selection**: Fair selection, event emission, error handling

## Technologies Used

- **Solidity**: 0.8.19 and 0.8.24
- **Hardhat**: Development framework
- **OpenZeppelin**: Secure smart contract libraries
- **Chainlink VRF**: Verifiable random function
- **Ethers.js**: Ethereum library
- **Chai**: Testing framework

## Dependencies

- `@openzeppelin/contracts`: Secure smart contract implementations
- `@chainlink/contracts`: Chainlink VRF integration
- `@nomicfoundation/hardhat-toolbox`: Hardhat development tools
- `ethers`: Ethereum JavaScript library
- `chai`: Assertion library for testing

## Randomness Handling

The Raffle contract ensures fair and verifiable random selection of winners by integrating with Chainlink VRF v2.5. Here’s how the contract deals with randomness:

1. **Requesting Randomness**:
   - The contract owner can call the `requestRandomNumber` function to request a random number from Chainlink VRF.
   - This function constructs a `RandomWordsRequest` struct with the necessary parameters and sends it to the VRF Coordinator.

2. **Receiving Randomness**:
   - Chainlink VRF responds with a random number, which is delivered to the contract via the `fulfillRandomWords` function.
   - To maintain security, `fulfillRandomWords` is defined as an internal function. An external function `rawFulfillRandomWords` is provided to simulate the VRF Coordinator's behavior during testing.

3. **Selecting Winners**:
   - Once the random number is received, the contract owner can call the `selectWinners` function.
   - This function uses the received random number to fairly and uniquely select the specified number of winners from the list of participants.

4. **Ensuring Security**:
   - The `fulfillRandomWords` function ensures that only the expected random number request is processed, preventing potential tampering.
   - By leveraging Chainlink VRF, the contract guarantees that the randomness is verifiable and not subject to manipulation.

## Security Features

### Revived Token Security
- **Access Control**: Role-based permissions using OpenZeppelin's AccessControl
- **Pausable**: Emergency stop functionality for transfers
- **Burnable**: Controlled token supply reduction
- **Input Validation**: Comprehensive parameter validation
- **Event Logging**: Complete audit trail of all operations

### Raffle Contract Security
- **VRF Integration**: Tamper-proof randomness from Chainlink
- **Access Control**: Owner-only critical functions
- **Input Validation**: Participant and winner count validation
- **Event Logging**: Transparent operation tracking

## Best Practices

- All contracts follow OpenZeppelin security standards
- Comprehensive test coverage (49 total tests)
- Gas optimization for cost efficiency
- Clear event emission for transparency
- Proper error handling and validation
- Documentation and code comments

## License

This project is licensed under the MIT License.
