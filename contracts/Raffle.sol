// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

// Import Chainlink VRF v2.5
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @title Winner Selection Contract
/// @author Damian Gądziak <damian@devchain.pl>
/// @notice This contract uses Chainlink VRF v2.5 to select random winners from a list of participants.
/// @dev The contract requests a single random number from Chainlink VRF and uses it to select multiple unique winners.
//
//         ██████                                 ███                             ████████
// ████████████████   █████                     ██████                      █████  ██████████████
//  ████████████████  █████████  █████           █████      █    ██████  █████████    ████████████
//            ██████  █████████   █████   █████         ██████   █████  ███████████         ███████
//       ███   █████  █████  ███  ██████  █████  ██████  █████  █████  ██████        ███     ███████
//    ██████   █████  █████        █████  ████   ██████  █████ ██████  █████        █████     ██████
//     █████████████  █████████    ███████████   █████   █████ █████  █████████     ██████    ██████
//     ████████████   ██████████    ██████████   █████   ██████████  ██████████     ██████   ██████
//     ████████████    █████████     █████████   █████   ██████████  █████████      ██████   ██████
//     █████████████   █████   ████  █████████   █████    ████████  ██████         ███████  ██████
//     █████  ██████   █████████████  ████████   █████    ████████  █████████████  ███████████████
//     █████   █████   ██████████████  ██████    █████    ███████  ██████████████  ███████████████
//     █████   █████    ██                        ████                        ███  █████████████
//     █████                                         ██                                   ███
//

contract Raffle is VRFConsumerBaseV2Plus {
    using VRFV2PlusClient for VRFV2PlusClient.RandomWordsRequest;

    /// @notice Chainlink VRF subscription ID
    uint256 public subscriptionId;
    /// @notice Key hash for Chainlink VRF
    bytes32 public keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    /// @notice Callback gas limit for Chainlink VRF
    uint32 public callbackGasLimit = 200000;
    /// @notice Request confirmations for Chainlink VRF
    uint16 public requestConfirmations = 3;

    /// @notice List of participants
    address[] public participants;
    /// @notice List of winners
    address[] public winners;
    /// @notice ID of the random words request
    uint256 public requestId;
    /// @notice Single random word received from Chainlink VRF
    uint256 public randomWord;
    /// @notice Number of winners to be selected
    uint32 public numWinners;
    /// @notice Mapping to track used indices for winner selection
    mapping(uint256 => bool) private usedIndicesMapping;

    /// @notice Emitted when participants are added
    /// @param participants Array of participant addresses
    event ParticipantsAdded(address[] participants);
    /// @notice Emitted when winners are selected
    /// @param winners Array of winner addresses
    event WinnersSelected(address[] winners);
    /// @notice Emitted when randomness is requested
    /// @param requestId ID of the randomness request
    event RandomnessRequested(uint256 requestId);

    /// @notice Constructor to initialize the contract
    /// @param vrfCoordinator Address of the VRF Coordinator
    /// @param _subscriptionId Chainlink VRF subscription ID
    /// @param _numWinners Number of winners to be selected
    constructor(address vrfCoordinator, uint256 _subscriptionId, uint32 _numWinners) VRFConsumerBaseV2Plus(vrfCoordinator) { // replace with actual coordinator address
        subscriptionId = _subscriptionId;
        numWinners = _numWinners;
    }

    /// @notice Adds participants to the list
    /// @param _participants Array of participant addresses
    function addParticipants(address[] calldata _participants) external onlyOwner {
        require(requestId == 0, "Raffle already started");
        require(_participants.length > 0, "Participants list cannot be empty");
        for (uint256 i = 0; i < _participants.length; i++) {
            participants.push(_participants[i]);
        }
        emit ParticipantsAdded(_participants);
    }

    /// @notice Requests a random number from Chainlink VRF
    /// @return requestId ID of the randomness request
    function requestRandomNumber() external onlyOwner returns (uint256) {
        require(requestId == 0, "Request ID already defined");
        require(participants.length >= numWinners, "Not enough participants");

        /// @dev We are asking only for one random word to optimzie used gas
        VRFV2PlusClient.RandomWordsRequest memory request = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        });

        requestId = s_vrfCoordinator.requestRandomWords(request);
        emit RandomnessRequested(requestId);
        return requestId;
    }

    /// @notice Callback function used by Chainlink VRF Coordinator to deliver randomness
    /// @param _requestId ID of the randomness request
    /// @param randomWords Array containing the random word(s)
    function fulfillRandomWords(uint256 _requestId, uint256[] calldata randomWords) internal override {
        require(_requestId == requestId, "Request ID does not match.");
        require(randomWord == 0, "Random Word already defined");
        randomWord = randomWords[0];
    }

    /// @notice Selects winners from the list of participants using the received random number
    function selectWinners() external onlyOwner {
        require(winners.length == 0, "Winners already selected");
        require(randomWord != 0, "Random Word not defined");

        uint256 uniqueCount = 0;
        uint256 randomValue = randomWord;

        for (uint256 i = 0; uniqueCount < numWinners; i++) {
            uint256 index = randomValue % participants.length;

            /// @dev Check if this index has not been used before
            if (!usedIndicesMapping[index]) {
                usedIndicesMapping[index] = true;
                winners.push(participants[index]);
                uniqueCount++;
            }
            /// @dev Use current randomValue to generate next one
            randomValue = uint256(keccak256(abi.encode(randomValue)));
        }

        emit WinnersSelected(winners);
    }

    // Function to set number of random words
    function setNumWinners(uint32 _numWinners) external onlyOwner {
        require(_numWinners > 0, "Number of winners must be greater than 0.");
        numWinners = _numWinners;
    }

    /// @notice Returns the list of winners
    /// @return Array of winner addresses
    function getWinners() external view returns (address[] memory) {
        return winners;
    }
}
