# Revived Contracts

This repository contains the implementation and tests for a Raffle contract that uses Chainlink VRF (Verifiable Random Function) v2.5 to select random winners from a list of participants. The contract ensures fairness and transparency by utilizing verifiable randomness provided by Chainlink.

## Table of Contents

- [Raffle Contract](#raffle-contract)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Testing](#testing)
  - [Randomness Handling](#randomness-handling)
  - [License](#license)

## Introduction

The Raffle contract is designed to fairly select a specified number of winners from a list of participants. By leveraging Chainlink VRF, the contract ensures that the selection process is truly random and tamper-proof.

## Features

- Add participants to the raffle.
- Request a random number from Chainlink VRF.
- Select a specified number of unique winners based on the received random number.
- Emit events for participant addition, randomness request, and winner selection.

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/raffle-contract.git
   cd raffle-contract
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

Deploy the Raffle contract on your preferred Ethereum network:

1. Update the deployment script with the appropriate VRF Coordinator address and subscription ID.
2. Run the deployment script:
   ```sh
   npx hardhat run scripts/deploy.js --network your-network
   ```

## Testing

Run the tests to ensure the contract behaves as expected:

```sh
npx hardhat test
```

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

## License

This project is licensed under the MIT License.
