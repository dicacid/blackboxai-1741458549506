const crypto = require('crypto');

class Transaction {
    constructor(fromAddress, toAddress, ticketId, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.ticketId = ticketId;
        this.amount = amount;
        this.timestamp = Date.now();
        this.signature = '';
    }

    /**
     * Calculate the hash of the transaction
     */
    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.fromAddress +
                this.toAddress +
                this.ticketId +
                this.amount +
                this.timestamp
            )
            .digest('hex');
    }

    /**
     * Sign the transaction with the given signing key
     */
    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    /**
     * Validate the transaction
     */
    isValid() {
        // Mining reward transaction
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = crypto.createPublicKey(this.fromAddress);
        return crypto.verify(
            'sha256',
            Buffer.from(this.calculateHash()),
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(this.signature, 'hex')
        );
    }

    /**
     * Convert transaction to string format
     */
    toString() {
        return JSON.stringify({
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
            ticketId: this.ticketId,
            amount: this.amount,
            timestamp: this.timestamp
        });
    }
}

module.exports = Transaction;
