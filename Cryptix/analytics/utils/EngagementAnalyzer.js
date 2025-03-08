class EngagementAnalyzer {
    constructor() {
        this.engagementScores = new Map(); // zoneId -> engagement data
        this.interactions = new Map();      // userId -> interaction history
        this.zoneMetrics = new Map();       // zoneId -> metrics
        
        // Configuration
        this.engagementThresholds = {
            low: 0.3,
            medium: 0.6,
            high: 0.8
        };
        
        this.interactionWeights = {
            presence: 0.2,
            movement: 0.3,
            interaction: 0.5
        };

        this.timeWindowSize = 900000; // 15 minutes
    }

    /**
     * Analyze engagement data
     */
    analyzeEngagement(data) {
        const { userId, zoneId, type, timestamp, duration, metadata } = data;

        // Update interaction history
        this._updateInteractionHistory(userId, data);

        // Calculate engagement metrics
        const metrics = this._calculateEngagementMetrics(zoneId, data);
        
        // Update zone metrics
        this._updateZoneMetrics(zoneId, metrics);

        // Calculate overall engagement score
        const score = this._calculateEngagementScore(metrics);

        return {
            userId,
            zoneId,
            timestamp,
            metrics,
            score,
            level: this._getEngagementLevel(score)
        };
    }

    /**
     * Get zone engagement analysis
     */
    getZoneEngagement(zoneId) {
        const metrics = this.zoneMetrics.get(zoneId) || this._createEmptyMetrics();
        const score = this._calculateZoneScore(metrics);

        return {
            zoneId,
            metrics,
            score,
            level: this._getEngagementLevel(score),
            trends: this._analyzeEngagementTrends(zoneId)
        };
    }

    /**
     * Get user engagement analysis
     */
    getUserEngagement(userId) {
        const interactions = this.interactions.get(userId) || [];
        return this._analyzeUserEngagement(interactions);
    }

    /**
     * Get overall event engagement metrics
     */
    getEventEngagementMetrics() {
        const zoneScores = Array.from(this.zoneMetrics.values())
            .map(metrics => this._calculateZoneScore(metrics));

        return {
            averageEngagement: this._calculateAverage(zoneScores),
            hotZones: this._identifyHotZones(),
            coldZones: this._identifyColdZones(),
            trends: this._analyzeEventTrends()
        };
    }

    /**
     * Update interaction history
     */
    _updateInteractionHistory(userId, data) {
        const history = this.interactions.get(userId) || [];
        history.push({
            ...data,
            timestamp: Date.now()
        });

        // Prune old interactions
        const cutoff = Date.now() - this.timeWindowSize;
        while (history.length > 0 && history[0].timestamp < cutoff) {
            history.shift();
        }

        this.interactions.set(userId, history);
    }

    /**
     * Calculate engagement metrics for a zone
     */
    _calculateEngagementMetrics(zoneId, data) {
        const metrics = {
            dwell: this._calculateDwellMetric(data),
            interaction: this._calculateInteractionMetric(data),
            density: this._calculateDensityMetric(data),
            activity: this._calculateActivityMetric(data),
            social: this._calculateSocialMetric(data)
        };

        return metrics;
    }

    /**
     * Update zone metrics
     */
    _updateZoneMetrics(zoneId, newMetrics) {
        const current = this.zoneMetrics.get(zoneId) || this._createEmptyMetrics();
        
        // Update metrics using exponential moving average
        const alpha = 0.1; // Smoothing factor
        const updated = {};
        
        for (const [key, value] of Object.entries(newMetrics)) {
            updated[key] = (current[key] || 0) * (1 - alpha) + value * alpha;
        }

        this.zoneMetrics.set(zoneId, updated);
    }

    /**
     * Calculate overall engagement score
     */
    _calculateEngagementScore(metrics) {
        const weights = {
            dwell: 0.25,
            interaction: 0.3,
            density: 0.15,
            activity: 0.2,
            social: 0.1
        };

        return Object.entries(metrics).reduce(
            (score, [key, value]) => score + (value * weights[key]),
            0
        );
    }

    /**
     * Calculate dwell metric
     */
    _calculateDwellMetric(data) {
        const { duration } = data;
        // Normalize duration to 0-1 scale
        return Math.min(duration / 3600000, 1); // Max 1 hour
    }

    /**
     * Calculate interaction metric
     */
    _calculateInteractionMetric(data) {
        const { metadata } = data;
        if (!metadata || !metadata.interactions) return 0;

        const { interactions } = metadata;
        // Normalize interactions to 0-1 scale
        return Math.min(interactions / 10, 1);
    }

    /**
     * Calculate density metric
     */
    _calculateDensityMetric(data) {
        const { metadata } = data;
        if (!metadata || !metadata.density) return 0;

        return Math.min(metadata.density, 1);
    }

    /**
     * Calculate activity metric
     */
    _calculateActivityMetric(data) {
        const { metadata } = data;
        if (!metadata || !metadata.activity) return 0;

        return Math.min(metadata.activity, 1);
    }

    /**
     * Calculate social metric
     */
    _calculateSocialMetric(data) {
        const { metadata } = data;
        if (!metadata || !metadata.socialInteractions) return 0;

        return Math.min(metadata.socialInteractions / 5, 1);
    }

    /**
     * Get engagement level based on score
     */
    _getEngagementLevel(score) {
        if (score >= this.engagementThresholds.high) return 'high';
        if (score >= this.engagementThresholds.medium) return 'medium';
        if (score >= this.engagementThresholds.low) return 'low';
        return 'inactive';
    }

    /**
     * Create empty metrics object
     */
    _createEmptyMetrics() {
        return {
            dwell: 0,
            interaction: 0,
            density: 0,
            activity: 0,
            social: 0
        };
    }

    /**
     * Calculate zone score
     */
    _calculateZoneScore(metrics) {
        return this._calculateEngagementScore(metrics);
    }

    /**
     * Analyze engagement trends for a zone
     */
    _analyzeEngagementTrends(zoneId) {
        // Implementation would analyze historical data for trends
        return {
            trend: 'stable',
            change: 0,
            peakTimes: []
        };
    }

    /**
     * Analyze user engagement
     */
    _analyzeUserEngagement(interactions) {
        if (interactions.length === 0) return null;

        const metrics = {
            totalDuration: 0,
            uniqueZones: new Set(),
            interactionCount: 0,
            averageEngagement: 0
        };

        for (const interaction of interactions) {
            metrics.totalDuration += interaction.duration || 0;
            metrics.uniqueZones.add(interaction.zoneId);
            metrics.interactionCount += 
                (interaction.metadata?.interactions || 0);
        }

        metrics.uniqueZones = metrics.uniqueZones.size;
        metrics.averageEngagement = 
            interactions.reduce((sum, i) => sum + (i.score || 0), 0) / 
            interactions.length;

        return metrics;
    }

    /**
     * Identify highly engaged zones
     */
    _identifyHotZones() {
        const hotZones = [];
        for (const [zoneId, metrics] of this.zoneMetrics) {
            const score = this._calculateZoneScore(metrics);
            if (score >= this.engagementThresholds.high) {
                hotZones.push({
                    zoneId,
                    score,
                    metrics
                });
            }
        }
        return hotZones;
    }

    /**
     * Identify zones with low engagement
     */
    _identifyColdZones() {
        const coldZones = [];
        for (const [zoneId, metrics] of this.zoneMetrics) {
            const score = this._calculateZoneScore(metrics);
            if (score <= this.engagementThresholds.low) {
                coldZones.push({
                    zoneId,
                    score,
                    metrics
                });
            }
        }
        return coldZones;
    }

    /**
     * Analyze overall event engagement trends
     */
    _analyzeEventTrends() {
        return {
            overallTrend: this._calculateOverallTrend(),
            peakPeriods: this._identifyPeakPeriods(),
            zonePerformance: this._analyzeZonePerformance()
        };
    }

    /**
     * Calculate overall engagement trend
     */
    _calculateOverallTrend() {
        // Implementation would analyze historical data
        return {
            direction: 'up',
            magnitude: 0.1,
            confidence: 0.8
        };
    }

    /**
     * Identify peak engagement periods
     */
    _identifyPeakPeriods() {
        // Implementation would analyze temporal patterns
        return [];
    }

    /**
     * Analyze zone performance
     */
    _analyzeZonePerformance() {
        const performance = new Map();
        
        for (const [zoneId, metrics] of this.zoneMetrics) {
            performance.set(zoneId, {
                score: this._calculateZoneScore(metrics),
                trend: this._analyzeEngagementTrends(zoneId)
            });
        }

        return Object.fromEntries(performance);
    }

    /**
     * Calculate average of array values
     */
    _calculateAverage(values) {
        return values.length > 0 
            ? values.reduce((sum, val) => sum + val, 0) / values.length 
            : 0;
    }
}

module.exports = { EngagementAnalyzer };
