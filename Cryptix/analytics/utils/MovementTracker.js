class MovementTracker {
    constructor() {
        this.movements = new Map(); // trackerId -> movement history
        this.patterns = new Map();  // zoneId -> pattern data
        this.bottlenecks = new Set();
        this.flowRates = new Map(); // zoneId -> flow rate
        
        // Configuration
        this.bottleneckThreshold = 0.8; // 80% capacity
        this.flowRateThreshold = 50;    // people per minute
        this.patternTimeWindow = 300000; // 5 minutes
    }

    /**
     * Analyze movement data
     */
    analyzeMovement(data) {
        const { trackerId, position, timestamp, velocity } = data;
        
        // Update movement history
        this._updateMovementHistory(trackerId, data);
        
        // Analyze patterns
        const pattern = this._detectPattern(trackerId);
        
        // Update zone statistics
        this._updateZoneStats(position, velocity);
        
        return {
            trackerId,
            pattern,
            position,
            velocity,
            timestamp
        };
    }

    /**
     * Detect movement bottlenecks
     */
    detectBottlenecks(movements) {
        const bottlenecks = new Set();
        const zoneFlows = this._calculateZoneFlows(movements);

        for (const [zoneId, flow] of zoneFlows) {
            if (this._isBottleneck(flow)) {
                bottlenecks.add(zoneId);
            }
        }

        this.bottlenecks = bottlenecks;
        return Array.from(bottlenecks);
    }

    /**
     * Get flow analysis for a specific zone
     */
    getZoneFlowAnalysis(zoneId) {
        return {
            flowRate: this.flowRates.get(zoneId) || 0,
            isBottleneck: this.bottlenecks.has(zoneId),
            patterns: this.patterns.get(zoneId) || []
        };
    }

    /**
     * Get movement patterns for a specific tracker
     */
    getTrackerPatterns(trackerId) {
        const history = this.movements.get(trackerId) || [];
        return this._analyzeTrackerPatterns(history);
    }

    /**
     * Update movement history
     */
    _updateMovementHistory(trackerId, data) {
        const history = this.movements.get(trackerId) || [];
        history.push({
            position: data.position,
            timestamp: data.timestamp,
            velocity: data.velocity
        });

        // Keep only recent history
        const cutoffTime = Date.now() - this.patternTimeWindow;
        while (history.length > 0 && history[0].timestamp < cutoffTime) {
            history.shift();
        }

        this.movements.set(trackerId, history);
    }

    /**
     * Detect movement pattern for a tracker
     */
    _detectPattern(trackerId) {
        const history = this.movements.get(trackerId) || [];
        if (history.length < 2) return null;

        const patterns = {
            circular: this._detectCircularPattern(history),
            backAndForth: this._detectBackAndForthPattern(history),
            stationary: this._detectStationaryPattern(history),
            directed: this._detectDirectedPattern(history)
        };

        return Object.entries(patterns)
            .filter(([_, value]) => value > 0.5)
            .map(([type]) => type);
    }

    /**
     * Update statistics for a zone
     */
    _updateZoneStats(position, velocity) {
        const zoneId = this._getZoneFromPosition(position);
        
        // Update flow rate
        const currentFlow = this.flowRates.get(zoneId) || 0;
        const newFlow = this._calculateFlowRate(velocity, currentFlow);
        this.flowRates.set(zoneId, newFlow);

        // Update patterns
        const zonePatterns = this.patterns.get(zoneId) || [];
        zonePatterns.push({ position, velocity, timestamp: Date.now() });
        this.patterns.set(zoneId, zonePatterns);
    }

    /**
     * Calculate zone flows from movement data
     */
    _calculateZoneFlows(movements) {
        const flows = new Map();

        for (const movement of movements) {
            const zoneId = this._getZoneFromPosition(movement.position);
            const currentFlow = flows.get(zoneId) || 0;
            flows.set(zoneId, currentFlow + 1);
        }

        return flows;
    }

    /**
     * Detect circular movement pattern
     */
    _detectCircularPattern(history) {
        if (history.length < 4) return 0;

        let circularScore = 0;
        const startPos = history[0].position;
        const endPos = history[history.length - 1].position;
        
        // Check if path returns near starting point
        const distance = this._calculateDistance(startPos, endPos);
        const totalPath = this._calculateTotalPath(history);
        
        if (distance < totalPath * 0.2) { // Within 20% of start
            circularScore = 1 - (distance / totalPath);
        }

        return circularScore;
    }

    /**
     * Detect back-and-forth movement pattern
     */
    _detectBackAndForthPattern(history) {
        if (history.length < 3) return 0;

        let reversals = 0;
        for (let i = 2; i < history.length; i++) {
            const v1 = this._calculateVelocityVector(history[i-2], history[i-1]);
            const v2 = this._calculateVelocityVector(history[i-1], history[i]);
            
            if (this._isDotProductNegative(v1, v2)) {
                reversals++;
            }
        }

        return reversals / (history.length - 2);
    }

    /**
     * Detect stationary pattern
     */
    _detectStationaryPattern(history) {
        const totalMovement = this._calculateTotalPath(history);
        const timeSpan = history[history.length - 1].timestamp - history[0].timestamp;
        
        // Calculate average speed
        const avgSpeed = totalMovement / timeSpan;
        return avgSpeed < 0.1 ? 1 : 0; // Threshold for "stationary"
    }

    /**
     * Detect directed movement pattern
     */
    _detectDirectedPattern(history) {
        const startPos = history[0].position;
        const endPos = history[history.length - 1].position;
        
        const directDistance = this._calculateDistance(startPos, endPos);
        const totalPath = this._calculateTotalPath(history);
        
        return directDistance / totalPath; // 1 = perfectly straight path
    }

    /**
     * Calculate distance between two points
     */
    _calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + 
            Math.pow(pos2.y - pos1.y, 2)
        );
    }

    /**
     * Calculate total path length
     */
    _calculateTotalPath(history) {
        let total = 0;
        for (let i = 1; i < history.length; i++) {
            total += this._calculateDistance(
                history[i-1].position,
                history[i].position
            );
        }
        return total;
    }

    /**
     * Calculate velocity vector between two points
     */
    _calculateVelocityVector(point1, point2) {
        const dt = point2.timestamp - point1.timestamp;
        return {
            x: (point2.position.x - point1.position.x) / dt,
            y: (point2.position.y - point1.position.y) / dt
        };
    }

    /**
     * Check if dot product is negative (indicating direction reversal)
     */
    _isDotProductNegative(v1, v2) {
        return (v1.x * v2.x + v1.y * v2.y) < 0;
    }

    /**
     * Calculate flow rate
     */
    _calculateFlowRate(velocity, currentFlow) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        return (currentFlow * 0.9) + (speed * 0.1); // Exponential moving average
    }

    /**
     * Check if a flow rate indicates a bottleneck
     */
    _isBottleneck(flow) {
        return flow > this.flowRateThreshold;
    }

    /**
     * Get zone ID from position
     */
    _getZoneFromPosition(position) {
        // In a real implementation, this would map coordinates to zone IDs
        return `zone_${Math.floor(position.x / 10)}_${Math.floor(position.y / 10)}`;
    }

    /**
     * Analyze patterns for a specific tracker
     */
    _analyzeTrackerPatterns(history) {
        return {
            patterns: this._detectPattern(history),
            totalDistance: this._calculateTotalPath(history),
            averageVelocity: this._calculateAverageVelocity(history),
            dwellTimes: this._calculateDwellTimes(history)
        };
    }

    /**
     * Calculate average velocity
     */
    _calculateAverageVelocity(history) {
        if (history.length < 2) return { x: 0, y: 0 };

        let totalVx = 0;
        let totalVy = 0;
        let count = 0;

        for (let i = 1; i < history.length; i++) {
            const v = this._calculateVelocityVector(history[i-1], history[i]);
            totalVx += v.x;
            totalVy += v.y;
            count++;
        }

        return {
            x: totalVx / count,
            y: totalVy / count
        };
    }

    /**
     * Calculate dwell times in each zone
     */
    _calculateDwellTimes(history) {
        const dwellTimes = new Map();

        let currentZone = null;
        let zoneStartTime = null;

        for (const point of history) {
            const zone = this._getZoneFromPosition(point.position);

            if (zone !== currentZone) {
                if (currentZone && zoneStartTime) {
                    const dwellTime = point.timestamp - zoneStartTime;
                    dwellTimes.set(currentZone, (dwellTimes.get(currentZone) || 0) + dwellTime);
                }
                currentZone = zone;
                zoneStartTime = point.timestamp;
            }
        }

        return Object.fromEntries(dwellTimes);
    }
}

module.exports = { MovementTracker };
