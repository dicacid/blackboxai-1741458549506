# Cryptix Festival Ticketing Platform

## Overview
Cryptix is a revolutionary festival ticketing platform that leverages blockchain technology, AI-driven insights, and real-time analytics to create a secure and efficient ticketing solution. The platform includes a Flask API service for logging and monitoring system activities.

## Services

### Flask API Service
The Flask API service provides endpoints for system health monitoring and request logging:
- `/health`: Health check endpoint
- `/log`: Request logging endpoint that captures detailed request metadata

### API Documentation
Endpoints:
- GET `/health`: Returns the current health status of the service
- GET/POST `/log`: Logs and returns details about the incoming request

## Setup and Installation

1. Install dependencies:
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for Flask API)
cd api
pip install -r requirements.txt
cd ..
```

2. Run the services:

For the Flask API, simply run:
```bash
./api/run.sh
```

The Flask API will be available at `http://localhost:5000` with these endpoints:
- GET /health - Check API health status
- GET/POST /log - Log and view request details

You can also use Docker Compose if preferred:
```bash
docker-compose up flask-api
```

## Features

### Smart Contracts
- NFT-based ticket management (ERC721)
- Secure multi-signature wallet
- Controlled resale marketplace
- Anti-fraud mechanisms
- Automated price optimization

### AI Systems
- Real-time fraud detection
- Personalized event recommendations
- Crowd analytics and movement tracking
- Engagement analysis

### Analytics
- Real-time crowd heatmaps
- Event performance metrics
- Market trend analysis
- User behavior insights

## Project Structure
```
Cryptix/
├── blockchain/           # Custom blockchain implementation
├── smart_contracts/     # Ethereum smart contracts
├── analytics/          # Real-time analytics system
├── AI/                # AI and ML components
│   ├── fraud_detection/
│   └── recommendation/
├── frontend/         # React-based web interface
└── security/        # Security features
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB
- Redis
- MetaMask or Web3-compatible wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/cryptix.git
cd cryptix
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install smart contract dependencies
cd ../smart_contracts
npm install
```

3. Configure environment variables:
```bash
# Smart contracts configuration
cd smart_contracts
cp .env.example .env
# Edit .env with your configuration

# Frontend configuration
cd ../frontend
cp .env.example .env
# Edit .env with your configuration
```

4. Deploy smart contracts:
```bash
cd smart_contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

5. Start the development servers:
```bash
# Start backend server
npm run dev

# Start frontend development server
cd frontend
npm start
```

### Running Tests
```bash
# Smart contract tests
cd smart_contracts
npx hardhat test

# Frontend tests
cd frontend
npm test
```

## Architecture

### Smart Contracts
- CryptixTicket: NFT-based ticket management
- CryptixMultiSig: Platform governance and security
- CryptixMarketplace: Secondary market control

### AI Components
- FraudDetectionSystem: Real-time transaction monitoring
- RecommendationEngine: Personalized event suggestions
- RealTimeAnalytics: Crowd and event analytics

### Frontend
- React/TypeScript application
- Material-UI components
- Web3 integration
- Real-time data visualization

## Security

### Smart Contract Security
- Multi-signature requirements for critical operations
- Automated fraud detection
- Price manipulation prevention
- Blacklist system

### Platform Security
- Real-time transaction monitoring
- AI-powered fraud detection
- Secure wallet implementation
- Multi-factor authentication

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, email support@cryptix.io or join our Discord channel.
