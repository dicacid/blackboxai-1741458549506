// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ICryptixMultiSig
 * @dev Interface for the CryptixMultiSig contract
 */
interface ICryptixMultiSig {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event Deposit(address indexed sender, uint256 amount);
    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event RequirementChanged(uint256 required);

    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (uint256);

    function confirmTransaction(uint256 txId) external;

    function executeTransaction(uint256 txId) external;

    function revokeConfirmation(uint256 txId) external;

    function addOwner(address owner) external;

    function removeOwner(address owner) external;

    function changeRequirement(uint256 required) external;

    function getTransactionCount() external view returns (uint256);

    function getOwners() external view returns (address[] memory);

    function isOwner(address owner) external view returns (bool);

    function isConfirmed(uint256 txId, address owner) external view returns (bool);

    function getTransaction(uint256 txId)
        external
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        );

    function numConfirmationsRequired() external view returns (uint256);

    // Receive function to accept ETH
    receive() external payable;
}
