const Block = require('./Block');
const Transaction = require('./Transaction');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100; // CRX tokens for mining reward
        this.ticketRegistry = new Map(); // Map to track ticket ownership
    }

    /**
     * Creates the genesis block
     */
    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    /**
     * Returns the latest block in the chain
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Adds a new transaction to pending transactions
     */
    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        // Verify ticket ownership for transfers
        if (transaction.ticketId) {
            const currentOwner = this.ticketRegistry.get(transaction.ticketId);
            if (currentOwner && currentOwner !== transaction.fromAddress) {
                throw new Error('Sender does not own this ticket');
            }
        }

        this.pendingTransactions.push(transaction);
    }

    /**
     * Mines pending transactions and adds a new block
     */
    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(
            null,
            miningRewardAddress,
            null,
            this.miningReward
        );
        this.pendingTransactions.push(rewardTx);

        const block = new Block(
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );
        block.mineBlock(this.difficulty);

        console.log('Block mined!');
        this.chain.push(block);

        // Update ticket registry
        for (const tx of this.pendingTransactions) {
            if (tx.ticketId) {
                this.ticketRegistry.set(tx.ticketId, tx.toAddress);
            }
        }

        this.pendingTransactions = [];
    }

    /**
     * Issues a new ticket
     */
    issueTicket(organizerAddress, ticketId, initialOwner) {
        if (this.ticketRegistry.has(ticketId)) {
            throw new Error('Ticket ID already exists');
        }

        const transaction = new Transaction(
            organizerAddress,
            initialOwner,
            ticketId,
            0
        );
        this.addTransaction(transaction);
    }

    /**
     * Gets the owner of a ticket
     */
    getTicketOwner(ticketId) {
        return this.ticketRegistry.get(ticketId);
    }

    /**
     * Gets the balance of an address
     */
    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    /**
     * Validates the integrity of the blockchain
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Validate block's transactions
            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            // Validate block's hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            // Validate block's previous hash reference
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    /**
     * Gets all transactions for a specific ticket
     */
    getTicketHistory(ticketId) {
        const history = [];
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.ticketId === ticketId) {
                    history.push({
                        from: transaction.fromAddress,
                        to: transaction.toAddress,
                        timestamp: transaction.timestamp
                    });
                }
            }
        }
        return history;
    }

    /**
     * Gets all tickets owned by an address
     */
    getTicketsByOwner(ownerAddress) {
        const tickets = [];
        this.ticketRegistry.forEach((owner, ticketId) => {
            if (owner === ownerAddress) {
                tickets.push(ticketId);
            }
        });
        return tickets;
    }
}

module.exports = Blockchain;
