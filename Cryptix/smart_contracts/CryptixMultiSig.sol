// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CryptixMultiSig
 * @dev Multi-signature wallet implementation for Cryptix platform
 */
contract CryptixMultiSig is ReentrancyGuard {
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event Deposit(address indexed sender, uint256 amount);
    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event RequirementChanged(uint256 required);

    // Transaction structure
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        mapping(address => bool) isConfirmed;
    }

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;
    Transaction[] public transactions;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(!transactions[_txId].isConfirmed[msg.sender], "Transaction already confirmed");
        _;
    }

    /**
     * @dev Constructor
     * @param _owners Array of initial owners
     * @param _numConfirmationsRequired Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Submit a new transaction
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner returns (uint256) {
        uint256 txId = transactions.length;

        transactions.push();
        Transaction storage transaction = transactions[txId];
        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;
        transaction.executed = false;
        transaction.numConfirmations = 0;

        emit TransactionSubmitted(txId, _to, _value, _data);
        return txId;
    }

    /**
     * @dev Confirm a transaction
     */
    function confirmTransaction(uint256 _txId)
        public
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
        notConfirmed(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;

        emit TransactionConfirmed(_txId, msg.sender);
    }

    /**
     * @dev Execute a confirmed transaction
     */
    function executeTransaction(uint256 _txId)
        public
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
        nonReentrant
    {
        Transaction storage transaction = transactions[_txId];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Insufficient confirmations"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");

        emit TransactionExecuted(_txId);
    }

    /**
     * @dev Revoke a confirmation
     */
    function revokeConfirmation(uint256 _txId)
        public
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];

        require(transaction.isConfirmed[msg.sender], "Transaction not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit TransactionRevoked(_txId, msg.sender);
    }

    /**
     * @dev Add a new owner
     */
    function addOwner(address _owner)
        public
        onlyOwner
    {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Owner already exists");

        isOwner[_owner] = true;
        owners.push(_owner);

        emit OwnerAdded(_owner);
    }

    /**
     * @dev Remove an owner
     */
    function removeOwner(address _owner)
        public
        onlyOwner
    {
        require(isOwner[_owner], "Not an owner");
        require(owners.length - 1 >= numConfirmationsRequired, "Cannot remove owner");

        isOwner[_owner] = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    /**
     * @dev Change the number of required confirmations
     */
    function changeRequirement(uint256 _required)
        public
        onlyOwner
    {
        require(_required > 0 && _required <= owners.length, "Invalid required number of owners");
        numConfirmationsRequired = _required;
        emit RequirementChanged(_required);
    }

    /**
     * @dev Get transaction count
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    /**
     * @dev Get owners
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Get transaction confirmation status
     */
    function isConfirmed(uint256 _txId, address _owner)
        public
        view
        returns (bool)
    {
        require(_txId < transactions.length, "Transaction does not exist");
        return transactions[_txId].isConfirmed[_owner];
    }

    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 _txId)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        require(_txId < transactions.length, "Transaction does not exist");

        Transaction storage transaction = transactions[_txId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}
