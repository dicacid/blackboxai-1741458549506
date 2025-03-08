const Transaction = require('./Transaction');

class CRXToken {
    constructor() {
        this.totalSupply = 1000000000; // 1 billion tokens
        this.balances = new Map();
        this.stakes = new Map();
        this.stakingRewardRate = 0.05; // 5% annual return for staking
        this.minimumStake = 1000; // Minimum tokens required for staking
        
        // Initialize token distribution
        this.balances.set('PLATFORM_RESERVE', this.totalSupply);
    }

    /**
     * Transfer tokens from one address to another
     */
    transfer(fromAddress, toAddress, amount) {
        if (!fromAddress || !toAddress) {
            throw new Error('Invalid addresses for transfer');
        }

        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }

        const fromBalance = this.balances.get(fromAddress) || 0;
        if (fromBalance < amount) {
            throw new Error('Insufficient balance for transfer');
        }

        // Update balances
        this.balances.set(fromAddress, fromBalance - amount);
        const toBalance = this.balances.get(toAddress) || 0;
        this.balances.set(toAddress, toBalance + amount);

        return true;
    }

    /**
     * Stake tokens
     */
    stake(address, amount) {
        if (amount < this.minimumStake) {
            throw new Error(`Minimum stake requirement is ${this.minimumStake} CRX`);
        }

        const balance = this.balances.get(address) || 0;
        if (balance < amount) {
            throw new Error('Insufficient balance for staking');
        }

        // Update balances and stakes
        this.balances.set(address, balance - amount);
        const currentStake = this.stakes.get(address) || 0;
        this.stakes.set(address, currentStake + amount);

        return true;
    }

    /**
     * Unstake tokens
     */
    unstake(address, amount) {
        const stakedAmount = this.stakes.get(address) || 0;
        if (stakedAmount < amount) {
            throw new Error('Insufficient staked amount');
        }

        // Calculate rewards
        const reward = this.calculateStakingReward(address);

        // Update balances and stakes
        this.stakes.set(address, stakedAmount - amount);
        const currentBalance = this.balances.get(address) || 0;
        this.balances.set(address, currentBalance + amount + reward);

        return { amount, reward };
    }

    /**
     * Calculate staking reward
     */
    calculateStakingReward(address) {
        const stakedAmount = this.stakes.get(address) || 0;
        if (stakedAmount === 0) return 0;

        // Simple reward calculation (can be made more sophisticated)
        const timeStaked = Date.now() - (this.stakingStartTime.get(address) || Date.now());
        const yearInMilliseconds = 365 * 24 * 60 * 60 * 1000;
        const reward = (stakedAmount * this.stakingRewardRate * timeStaked) / yearInMilliseconds;

        return Math.floor(reward);
    }

    /**
     * Get balance of an address
     */
    balanceOf(address) {
        return this.balances.get(address) || 0;
    }

    /**
     * Get staked amount of an address
     */
    stakedAmount(address) {
        return this.stakes.get(address) || 0;
    }

    /**
     * Check if an address has sufficient stake for premium features
     */
    hasSufficientStakeForPremium(address) {
        const stakedAmount = this.stakes.get(address) || 0;
        return stakedAmount >= this.minimumStake;
    }

    /**
     * Mint new tokens (restricted to platform)
     */
    mint(toAddress, amount) {
        if (amount <= 0) {
            throw new Error('Mint amount must be positive');
        }

        if (this.totalSupply + amount > 1000000000) {
            throw new Error('Cannot exceed maximum supply of 1 billion tokens');
        }

        const currentBalance = this.balances.get(toAddress) || 0;
        this.balances.set(toAddress, currentBalance + amount);
        this.totalSupply += amount;

        return true;
    }

    /**
     * Burn tokens
     */
    burn(fromAddress, amount) {
        if (amount <= 0) {
            throw new Error('Burn amount must be positive');
        }

        const currentBalance = this.balances.get(fromAddress) || 0;
        if (currentBalance < amount) {
            throw new Error('Insufficient balance for burning');
        }

        this.balances.set(fromAddress, currentBalance - amount);
        this.totalSupply -= amount;

        return true;
    }

    /**
     * Get total supply
     */
    getTotalSupply() {
        return this.totalSupply;
    }

    /**
     * Get circulating supply
     */
    getCirculatingSupply() {
        let circulating = 0;
        this.balances.forEach((balance, address) => {
            if (address !== 'PLATFORM_RESERVE') {
                circulating += balance;
            }
        });
        return circulating;
    }

    /**
     * Get total staked amount
     */
    getTotalStaked() {
        let total = 0;
        this.stakes.forEach(stake => {
            total += stake;
        });
        return total;
    }
}

module.exports = CRXToken;
