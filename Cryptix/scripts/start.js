const concurrently = require('concurrently');
const path = require('path');

// Define colors for different processes
const colors = {
    blockchain: 'blue',
    server: 'green',
    frontend: 'magenta',
    analytics: 'yellow'
};

// Run all services concurrently
concurrently([
    {
        command: 'cd smart_contracts && npx hardhat node',
        name: 'blockchain',
        prefixColor: colors.blockchain
    },
    {
        command: 'node index.js',
        name: 'server',
        prefixColor: colors.server
    },
    {
        command: 'cd frontend && npm start',
        name: 'frontend',
        prefixColor: colors.frontend
    },
    {
        // Wait for server to start before deploying contracts
        command: 'sleep 5 && cd smart_contracts && npx hardhat run scripts/deploy.js --network localhost',
        name: 'deploy',
        prefixColor: colors.blockchain
    }
], {
    prefix: 'name',
    timestampFormat: 'HH:mm:ss',
    restartTries: 3,
    restartDelay: 3000,
}).then(
    () => {
        console.log('All processes exited successfully');
    },
    (error) => {
        console.error('Error occurred:', error);
        process.exit(1);
    }
);
