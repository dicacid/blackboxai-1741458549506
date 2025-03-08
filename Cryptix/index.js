const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Web3 = require('web3');
const FraudDetectionSystem = require('./AI/fraud_detection/FraudDetectionSystem');
const RecommendationEngine = require('./AI/recommendation/RecommendationEngine');
const RealTimeAnalytics = require('./analytics/RealTimeAnalytics');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Initialize systems
const fraudDetection = new FraudDetectionSystem();
const recommendationEngine = new RecommendationEngine();
const analytics = new RealTimeAnalytics({
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    websocketPort: 8080,
    dataRetentionPeriod: 86400, // 24 hours
    crowdDensityThreshold: 0.8,
    hotspotThreshold: 0.7
});

// Initialize systems on startup
async function initializeSystems() {
    try {
        await fraudDetection.initialize();
        await recommendationEngine.initialize();
        await analytics.initialize();
        console.log('All systems initialized successfully');
    } catch (error) {
        console.error('Error initializing systems:', error);
        // Don't exit process, allow for graceful degradation
        console.log('Continuing with limited functionality...');
    }
}

// API Routes
app.get('/api/health', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        systems: {
            fraudDetection: fraudDetection.initialized ? 'operational' : 'degraded',
            recommendationEngine: recommendationEngine.initialized ? 'operational' : 'degraded',
            analytics: analytics.initialized ? 'operational' : 'degraded'
        }
    };
    res.json(healthStatus);
});

// Fraud Detection endpoint
app.post('/api/fraud', async (req, res) => {
    try {
        if (!fraudDetection.initialized) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Fraud detection system is not initialized'
            });
        }

        const { transaction } = req.body;
        if (!transaction) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Transaction data is required'
            });
        }

        const analysis = await fraudDetection.analyzeTransaction(transaction);
        res.json({
            timestamp: new Date().toISOString(),
            analysis
        });
    } catch (error) {
        console.error('Fraud detection error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error analyzing transaction'
        });
    }
});

// Recommendations endpoint
app.get('/api/recommendations', async (req, res) => {
    try {
        if (!recommendationEngine.initialized) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Recommendation engine is not initialized'
            });
        }

        const { userId, limit } = req.query;
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID is required'
            });
        }

        const recommendations = await recommendationEngine.getRecommendations(
            userId,
            limit ? parseInt(limit) : 10
        );
        res.json({
            timestamp: new Date().toISOString(),
            recommendations
        });
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error generating recommendations'
        });
    }
});

// Analytics endpoint
app.get('/api/analytics/realtime', async (req, res) => {
    try {
        if (!analytics.initialized) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Analytics system is not initialized'
            });
        }

        const { eventId } = req.query;
        if (!eventId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Event ID is required'
            });
        }

        // Get current analytics data
        const update = await analytics._prepareUpdate(eventId);
        res.json({
            timestamp: new Date().toISOString(),
            analytics: update
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error fetching analytics data'
        });
    }
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Start server
const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await initializeSystems();
});

// Graceful shutdown
async function shutdown() {
    console.log('Received shutdown signal. Starting graceful shutdown...');
    
    // Close WebSocket connections and cleanup analytics
    if (analytics.initialized) {
        await analytics.cleanup();
    }
    
    // Close HTTP server
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });

    // Force exit if graceful shutdown fails
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
