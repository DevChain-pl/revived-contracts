// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface VRFConsumerBaseV2Plus {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

contract MockVRFCoordinator {
    uint256 private s_requestId;
    mapping(uint256 => address) public s_requests;

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    event RandomWordsRequested(uint256 requestId, address requester);

    function requestRandomWords(RandomWordsRequest calldata request) external returns (uint256) {
        s_requestId++;
        s_requests[s_requestId] = msg.sender;
        emit RandomWordsRequested(s_requestId, msg.sender);
        return s_requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = s_requests[requestId];
        require(consumer != address(0), "Request ID not found");
        VRFConsumerBaseV2Plus(consumer).rawFulfillRandomWords(requestId, randomWords);
    }
}
