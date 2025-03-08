const WebSocket = require('ws');
const { createClient } = require('redis');
const { HeatmapGenerator } = require('./utils/HeatmapGenerator');
const { MovementTracker } = require('./utils/MovementTracker');
const { EngagementAnalyzer } = require('./utils/EngagementAnalyzer');

class RealTimeAnalytics {
    constructor(config) {
        this.config = config;
        this.websocketServer = null;
        this.redisClient = null;
        this.connections = new Map();
        this.eventData = new Map();
        this.heatmapGenerator = new HeatmapGenerator();
        this.movementTracker = new MovementTracker();
        this.engagementAnalyzer = new EngagementAnalyzer();
        
        // Analytics storage
        this.zoneOccupancy = new Map();
        this.crowdDensity = new Map();
        this.movementPatterns = new Map();
        this.hotspots = new Set();
        
        // Update intervals
        this.updateInterval = 1000; // 1 second
        this.aggregationInterval = 60000; // 1 minute
    }

    /**
     * Initialize the analytics system
     */
    async initialize() {
        // Initialize Redis client for data persistence
        this.redisClient = createClient({
            url: this.config.redisUrl
        });

        await this.redisClient.connect();

        // Initialize WebSocket server for real-time updates
        this.websocketServer = new WebSocket.Server({
            port: this.config.websocketPort
        });

        this.setupWebSocketHandlers();
        this.startUpdateLoops();
        
        console.log('Real-time analytics system initialized');
    }

    /**
     * Set up WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.websocketServer.on('connection', (ws, req) => {
            const clientId = this._generateClientId();
            this.connections.set(clientId, ws);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleIncomingData(clientId, data);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            ws.on('close', () => {
                this.connections.delete(clientId);
            });
        });
    }

    /**
     * Start update loops for real-time analytics
     */
    startUpdateLoops() {
        // Real-time updates
        setInterval(() => {
            this.updateRealTimeAnalytics();
        }, this.updateInterval);

        // Aggregated data updates
        setInterval(() => {
            this.aggregateAnalytics();
        }, this.aggregationInterval);
    }

    /**
     * Handle incoming data from sensors/devices
     */
    async handleIncomingData(clientId, data) {
        const { eventId, type, payload } = data;

        // Validate data
        if (!this._validateData(data)) {
            return;
        }

        // Process different types of data
        switch (type) {
            case 'location':
                await this.processLocationData(eventId, payload);
                break;
            case 'movement':
                await this.processMovementData(eventId, payload);
                break;
            case 'engagement':
                await this.processEngagementData(eventId, payload);
                break;
            default:
                console.warn(`Unknown data type: ${type}`);
        }

        // Update event data
        this._updateEventData(eventId, type, payload);

        // Generate and broadcast updates
        await this.broadcastUpdates(eventId);
    }

    /**
     * Process location data from sensors
     */
    async processLocationData(eventId, data) {
        // Update zone occupancy
        this.zoneOccupancy.set(data.zoneId, {
            count: data.count,
            timestamp: Date.now()
        });

        // Update crowd density
        const density = this.heatmapGenerator.calculateDensity(data);
        this.crowdDensity.set(data.zoneId, density);

        // Identify hotspots
        if (density > this.config.hotspotThreshold) {
            this.hotspots.add(data.zoneId);
        } else {
            this.hotspots.delete(data.zoneId);
        }

        // Store historical data
        await this._storeHistoricalData('location', eventId, data);
    }

    /**
     * Process movement data from sensors
     */
    async processMovementData(eventId, data) {
        // Track movement patterns
        const pattern = this.movementTracker.analyzeMovement(data);
        this.movementPatterns.set(data.trackerId, pattern);

        // Detect flow bottlenecks
        const bottlenecks = this.movementTracker.detectBottlenecks(
            Array.from(this.movementPatterns.values())
        );

        // Update movement analytics
        await this._updateMovementAnalytics(eventId, {
            patterns: Array.from(this.movementPatterns.entries()),
            bottlenecks
        });
    }

    /**
     * Process engagement data from sensors
     */
    async processEngagementData(eventId, data) {
        // Analyze engagement levels
        const engagement = this.engagementAnalyzer.analyzeEngagement(data);

        // Update engagement metrics
        await this._updateEngagementMetrics(eventId, engagement);
    }

    /**
     * Update real-time analytics
     */
    async updateRealTimeAnalytics() {
        for (const [eventId, data] of this.eventData) {
            // Generate heatmap
            const heatmap = this.heatmapGenerator.generateHeatmap({
                crowdDensity: this.crowdDensity,
                zoneOccupancy: this.zoneOccupancy,
                hotspots: this.hotspots
            });

            // Update analytics
            const analytics = {
                timestamp: Date.now(),
                heatmap,
                occupancy: Object.fromEntries(this.zoneOccupancy),
                movements: Array.from(this.movementPatterns.values()),
                hotspots: Array.from(this.hotspots),
                alerts: this._generateAlerts(eventId)
            };

            // Store and broadcast updates
            await this._storeAnalytics(eventId, analytics);
            await this.broadcastUpdates(eventId);
        }
    }

    /**
     * Aggregate analytics data
     */
    async aggregateAnalytics() {
        for (const [eventId, data] of this.eventData) {
            const aggregated = {
                timestamp: Date.now(),
                hourly: await this._aggregateHourlyData(eventId),
                daily: await this._aggregateDailyData(eventId)
            };

            await this._storeAggregatedData(eventId, aggregated);
        }
    }

    /**
     * Broadcast updates to connected clients
     */
    async broadcastUpdates(eventId) {
        const update = await this._prepareUpdate(eventId);
        
        for (const [clientId, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(update));
            }
        }
    }

    /**
     * Generate alerts based on current analytics
     */
    _generateAlerts(eventId) {
        const alerts = [];

        // Check crowd density alerts
        for (const [zoneId, density] of this.crowdDensity) {
            if (density > this.config.crowdDensityThreshold) {
                alerts.push({
                    type: 'high_crowd_density',
                    zoneId,
                    level: 'warning',
                    message: `High crowd density detected in zone ${zoneId}`
                });
            }
        }

        // Check movement pattern alerts
        const bottlenecks = this.movementTracker.detectBottlenecks(
            Array.from(this.movementPatterns.values())
        );
        
        for (const bottleneck of bottlenecks) {
            alerts.push({
                type: 'bottleneck',
                location: bottleneck,
                level: 'warning',
                message: `Bottleneck detected at ${bottleneck}`
            });
        }

        return alerts;
    }

    /**
     * Store historical data in Redis
     */
    async _storeHistoricalData(type, eventId, data) {
        const key = `historical:${eventId}:${type}:${Date.now()}`;
        await this.redisClient.set(key, JSON.stringify(data));
        await this.redisClient.expire(key, this.config.dataRetentionPeriod);
    }

    /**
     * Store analytics data in Redis
     */
    async _storeAnalytics(eventId, analytics) {
        const key = `analytics:${eventId}:${Date.now()}`;
        await this.redisClient.set(key, JSON.stringify(analytics));
        await this.redisClient.expire(key, this.config.dataRetentionPeriod);
    }

    /**
     * Store aggregated data in Redis
     */
    async _storeAggregatedData(eventId, data) {
        const key = `aggregated:${eventId}:${Date.now()}`;
        await this.redisClient.set(key, JSON.stringify(data));
    }

    /**
     * Prepare update for broadcasting
     */
    async _prepareUpdate(eventId) {
        return {
            eventId,
            timestamp: Date.now(),
            heatmap: this.heatmapGenerator.getCurrentHeatmap(),
            occupancy: Object.fromEntries(this.zoneOccupancy),
            movements: Array.from(this.movementPatterns.values()),
            hotspots: Array.from(this.hotspots),
            alerts: this._generateAlerts(eventId)
        };
    }

    /**
     * Validate incoming data
     */
    _validateData(data) {
        return data && data.eventId && data.type && data.payload;
    }

    /**
     * Generate unique client ID
     */
    _generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update event data
     */
    _updateEventData(eventId, type, payload) {
        const eventData = this.eventData.get(eventId) || {};
        eventData[type] = payload;
        this.eventData.set(eventId, eventData);
    }

    /**
     * Update movement analytics
     */
    async _updateMovementAnalytics(eventId, data) {
        const key = `movement:${eventId}:${Date.now()}`;
        await this.redisClient.set(key, JSON.stringify(data));
    }

    /**
     * Update engagement metrics
     */
    async _updateEngagementMetrics(eventId, data) {
        const key = `engagement:${eventId}:${Date.now()}`;
        await this.redisClient.set(key, JSON.stringify(data));
    }

    /**
     * Aggregate hourly data
     */
    async _aggregateHourlyData(eventId) {
        // Implementation would aggregate data by hour
        return {};
    }

    /**
     * Aggregate daily data
     */
    async _aggregateDailyData(eventId) {
        // Implementation would aggregate data by day
        return {};
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.websocketServer) {
            this.websocketServer.close();
        }
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
}

module.exports = RealTimeAnalytics;
