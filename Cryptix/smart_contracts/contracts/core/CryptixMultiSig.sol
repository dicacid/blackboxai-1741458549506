// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/ICryptixMultiSig.sol";

/**
 * @title CryptixMultiSig
 * @dev Multi-signature wallet implementation for Cryptix platform
 */
contract CryptixMultiSig is ICryptixMultiSig, ReentrancyGuard {
    // State variables
    address[] private _owners;
    mapping(address => bool) private _isOwner;
    uint256 private _numConfirmationsRequired;

    // Transaction structure
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        mapping(address => bool) isConfirmed;
    }

    // Transactions storage
    Transaction[] private _transactions;

    // Modifiers
    modifier onlyOwner() {
        require(_isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < _transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!_transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(!_transactions[_txId].isConfirmed[msg.sender], "Transaction already confirmed");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(address[] memory owners_, uint256 numConfirmationsRequired_) {
        require(owners_.length > 0, "Owners required");
        require(
            numConfirmationsRequired_ > 0 && numConfirmationsRequired_ <= owners_.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < owners_.length; i++) {
            address owner = owners_[i];
            require(owner != address(0), "Invalid owner");
            require(!_isOwner[owner], "Owner not unique");

            _isOwner[owner] = true;
            _owners.push(owner);
        }

        _numConfirmationsRequired = numConfirmationsRequired_;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable override {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Submit a new transaction
     */
    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) public override onlyOwner returns (uint256) {
        uint256 txId = _transactions.length;

        _transactions.push();
        Transaction storage transaction = _transactions[txId];
        transaction.to = to;
        transaction.value = value;
        transaction.data = data;
        transaction.executed = false;
        transaction.numConfirmations = 0;

        emit TransactionSubmitted(txId, to, value, data);
        return txId;
    }

    /**
     * @dev Confirm a transaction
     */
    function confirmTransaction(uint256 txId)
        public
        override
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        notConfirmed(txId)
    {
        Transaction storage transaction = _transactions[txId];
        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;

        emit TransactionConfirmed(txId, msg.sender);
    }

    /**
     * @dev Execute a confirmed transaction
     */
    function executeTransaction(uint256 txId)
        public
        override
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        nonReentrant
    {
        Transaction storage transaction = _transactions[txId];

        require(
            transaction.numConfirmations >= _numConfirmationsRequired,
            "Insufficient confirmations"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");

        emit TransactionExecuted(txId);
    }

    /**
     * @dev Revoke a confirmation
     */
    function revokeConfirmation(uint256 txId)
        public
        override
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage transaction = _transactions[txId];

        require(transaction.isConfirmed[msg.sender], "Transaction not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit TransactionRevoked(txId, msg.sender);
    }

    /**
     * @dev Add a new owner
     */
    function addOwner(address owner)
        public
        override
        onlyOwner
    {
        require(owner != address(0), "Invalid owner");
        require(!_isOwner[owner], "Owner already exists");

        _isOwner[owner] = true;
        _owners.push(owner);

        emit OwnerAdded(owner);
    }

    /**
     * @dev Remove an owner
     */
    function removeOwner(address owner)
        public
        override
        onlyOwner
    {
        require(_isOwner[owner], "Not an owner");
        require(_owners.length - 1 >= _numConfirmationsRequired, "Cannot remove owner");

        _isOwner[owner] = false;
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == owner) {
                _owners[i] = _owners[_owners.length - 1];
                _owners.pop();
                break;
            }
        }

        emit OwnerRemoved(owner);
    }

    /**
     * @dev Change the number of required confirmations
     */
    function changeRequirement(uint256 required)
        public
        override
        onlyOwner
    {
        require(required > 0 && required <= _owners.length, "Invalid required number of owners");
        _numConfirmationsRequired = required;
        emit RequirementChanged(required);
    }

    /**
     * @dev Get transaction count
     */
    function getTransactionCount() public view override returns (uint256) {
        return _transactions.length;
    }

    /**
     * @dev Get owners
     */
    function getOwners() public view override returns (address[] memory) {
        return _owners;
    }

    /**
     * @dev Check if address is owner
     */
    function isOwner(address owner) public view override returns (bool) {
        return _isOwner[owner];
    }

    /**
     * @dev Get transaction confirmation status
     */
    function isConfirmed(uint256 txId, address owner)
        public
        view
        override
        returns (bool)
    {
        require(txId < _transactions.length, "Transaction does not exist");
        return _transactions[txId].isConfirmed[owner];
    }

    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 txId)
        public
        view
        override
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        require(txId < _transactions.length, "Transaction does not exist");

        Transaction storage transaction = _transactions[txId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    /**
     * @dev Get required number of confirmations
     */
    function numConfirmationsRequired() public view override returns (uint256) {
        return _numConfirmationsRequired;
    }
}
