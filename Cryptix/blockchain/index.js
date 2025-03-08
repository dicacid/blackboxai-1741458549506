const Blockchain = require('./Blockchain');
const Block = require('./Block');
const Transaction = require('./Transaction');
const CRXToken = require('./CRXToken');

class CryptixBlockchain {
    constructor() {
        this.blockchain = new Blockchain();
        this.crxToken = new CRXToken();
    }

    /**
     * Initialize the blockchain system
     */
    async initialize() {
        console.log('Initializing Cryptix Blockchain...');
        // Additional initialization logic can be added here
        return true;
    }

    /**
     * Issue a new ticket
     */
    issueTicket(organizerAddress, ticketId, initialOwner, price) {
        try {
            // Create ticket transaction
            this.blockchain.issueTicket(organizerAddress, ticketId, initialOwner);
            
            // Calculate and collect platform fee (2.5% of ticket price)
            const platformFee = price * 0.025;
            this.crxToken.transfer(organizerAddress, 'PLATFORM_RESERVE', platformFee);

            return {
                success: true,
                ticketId,
                owner: initialOwner,
                platformFee
            };
        } catch (error) {
            throw new Error(`Failed to issue ticket: ${error.message}`);
        }
    }

    /**
     * Transfer ticket ownership
     */
    transferTicket(fromAddress, toAddress, ticketId, price) {
        try {
            // Verify current ownership
            const currentOwner = this.blockchain.getTicketOwner(ticketId);
            if (currentOwner !== fromAddress) {
                throw new Error('Sender does not own this ticket');
            }

            // Create transfer transaction
            const transaction = new Transaction(fromAddress, toAddress, ticketId, price);
            this.blockchain.addTransaction(transaction);

            // Calculate and collect platform fee (1% of resale price)
            const platformFee = price * 0.01;
            this.crxToken.transfer(fromAddress, 'PLATFORM_RESERVE', platformFee);

            return {
                success: true,
                ticketId,
                newOwner: toAddress,
                platformFee
            };
        } catch (error) {
            throw new Error(`Failed to transfer ticket: ${error.message}`);
        }
    }

    /**
     * Get ticket details including ownership history
     */
    getTicketDetails(ticketId) {
        try {
            const currentOwner = this.blockchain.getTicketOwner(ticketId);
            const history = this.blockchain.getTicketHistory(ticketId);

            return {
                ticketId,
                currentOwner,
                history
            };
        } catch (error) {
            throw new Error(`Failed to get ticket details: ${error.message}`);
        }
    }

    /**
     * Get user's tickets
     */
    getUserTickets(address) {
        try {
            return this.blockchain.getTicketsByOwner(address);
        } catch (error) {
            throw new Error(`Failed to get user tickets: ${error.message}`);
        }
    }

    /**
     * Get CRX token balance
     */
    getTokenBalance(address) {
        try {
            return this.crxToken.balanceOf(address);
        } catch (error) {
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    /**
     * Stake CRX tokens
     */
    stakeTokens(address, amount) {
        try {
            return this.crxToken.stake(address, amount);
        } catch (error) {
            throw new Error(`Failed to stake tokens: ${error.message}`);
        }
    }

    /**
     * Get blockchain statistics
     */
    getStatistics() {
        return {
            chainLength: this.blockchain.chain.length,
            totalTransactions: this.blockchain.chain.reduce(
                (acc, block) => acc + block.transactions.length,
                0
            ),
            crxTotalSupply: this.crxToken.getTotalSupply(),
            crxCirculatingSupply: this.crxToken.getCirculatingSupply(),
            totalStaked: this.crxToken.getTotalStaked()
        };
    }

    /**
     * Validate the entire blockchain
     */
    validateChain() {
        return this.blockchain.isChainValid();
    }
}

// Export a singleton instance
const cryptixBlockchain = new CryptixBlockchain();

module.exports = {
    cryptixBlockchain,
    Block,
    Transaction,
    CRXToken,
    Blockchain
};
