const tf = require('@tensorflow/tfjs-node');
const { Matrix } = require('ml-matrix');

class RecommendationEngine {
    constructor() {
        this.userPreferences = new Map(); // userId -> preferences vector
        this.eventFeatures = new Map();   // eventId -> features vector
        this.model = null;
        this.initialized = false;
    }

    /**
     * Initialize the recommendation model
     */
    async initialize() {
        // Create a simple neural network for collaborative filtering
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 50,
                    activation: 'relu',
                    inputShape: [100]  // Feature vector size
                }),
                tf.layers.dense({
                    units: 25,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 10,
                    activation: 'softmax'
                })
            ]
        });

        // Compile the model
        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        this.initialized = true;
        console.log('Recommendation engine initialized');
    }

    /**
     * Update user preferences based on their interactions
     */
    async updateUserPreferences(userId, interactions) {
        const preferences = this._extractPreferences(interactions);
        this.userPreferences.set(userId, preferences);
        await this._retrainModel();
    }

    /**
     * Add new event with its features
     */
    addEvent(eventId, features) {
        const normalizedFeatures = this._normalizeFeatures(features);
        this.eventFeatures.set(eventId, normalizedFeatures);
    }

    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(userId, limit = 10) {
        if (!this.initialized) {
            throw new Error('Recommendation engine not initialized');
        }

        const userPrefs = this.userPreferences.get(userId);
        if (!userPrefs) {
            return this._getDefaultRecommendations(limit);
        }

        const recommendations = [];
        const userVector = tf.tensor2d([userPrefs], [1, userPrefs.length]);

        // Get predictions for all events
        for (const [eventId, features] of this.eventFeatures) {
            const eventVector = tf.tensor2d([features], [1, features.length]);
            const prediction = await this._predictUserInterest(userVector, eventVector);
            recommendations.push({
                eventId,
                score: prediction
            });
        }

        // Sort by score and return top recommendations
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Get similar events based on content
     */
    getSimilarEvents(eventId, limit = 5) {
        const targetFeatures = this.eventFeatures.get(eventId);
        if (!targetFeatures) {
            throw new Error('Event not found');
        }

        const similarities = [];
        for (const [otherId, features] of this.eventFeatures) {
            if (otherId !== eventId) {
                const similarity = this._calculateCosineSimilarity(
                    targetFeatures,
                    features
                );
                similarities.push({ eventId: otherId, similarity });
            }
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Extract preferences from user interactions
     */
    _extractPreferences(interactions) {
        // Convert user interactions into a preference vector
        const preferences = new Array(100).fill(0);
        
        for (const interaction of interactions) {
            const weight = this._calculateInteractionWeight(interaction);
            const features = this._extractFeatures(interaction);
            
            for (let i = 0; i < features.length; i++) {
                preferences[i] += features[i] * weight;
            }
        }

        return this._normalizeVector(preferences);
    }

    /**
     * Calculate weight based on interaction type
     */
    _calculateInteractionWeight(interaction) {
        const weights = {
            purchase: 1.0,
            view: 0.3,
            search: 0.2,
            recommend: 0.4
        };
        return weights[interaction.type] || 0.1;
    }

    /**
     * Extract features from an interaction
     */
    _extractFeatures(interaction) {
        // Convert interaction properties into feature vector
        const features = [];
        
        // Event category features
        if (interaction.event) {
            features.push(
                interaction.event.category,
                interaction.event.price,
                interaction.event.popularity,
                interaction.event.seasonality
            );
        }

        // Pad or truncate to standard length
        return features.concat(new Array(100 - features.length).fill(0));
    }

    /**
     * Normalize features to standard range
     */
    _normalizeFeatures(features) {
        return this._normalizeVector(features);
    }

    /**
     * Normalize vector to unit length
     */
    _normalizeVector(vector) {
        const magnitude = Math.sqrt(
            vector.reduce((sum, val) => sum + val * val, 0)
        );
        return vector.map(val => magnitude === 0 ? 0 : val / magnitude);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    _calculateCosineSimilarity(vec1, vec2) {
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Predict user interest in an event
     */
    async _predictUserInterest(userVector, eventVector) {
        const prediction = this.model.predict(
            tf.concat([userVector, eventVector], 1)
        );
        const score = await prediction.data();
        return score[0];
    }

    /**
     * Retrain the model with updated data
     */
    async _retrainModel() {
        if (this.userPreferences.size < 2) {
            return; // Not enough data for meaningful training
        }

        const trainingData = this._prepareTrainingData();
        await this.model.fit(trainingData.inputs, trainingData.labels, {
            epochs: 10,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Training epoch ${epoch + 1}: loss = ${logs.loss}`);
                }
            }
        });
    }

    /**
     * Prepare training data from user preferences and event features
     */
    _prepareTrainingData() {
        const inputs = [];
        const labels = [];

        for (const [userId, userPrefs] of this.userPreferences) {
            for (const [eventId, eventFeatures] of this.eventFeatures) {
                inputs.push([...userPrefs, ...eventFeatures]);
                // Simple binary labels for now (liked/not liked)
                labels.push([this._getUserEventInteraction(userId, eventId)]);
            }
        }

        return {
            inputs: tf.tensor2d(inputs),
            labels: tf.tensor2d(labels)
        };
    }

    /**
     * Get default recommendations for new users
     */
    _getDefaultRecommendations(limit) {
        // Return most popular events as default
        const defaultRecs = Array.from(this.eventFeatures.entries())
            .map(([eventId, features]) => ({
                eventId,
                score: this._calculatePopularityScore(features)
            }));

        return defaultRecs
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Calculate popularity score from event features
     */
    _calculatePopularityScore(features) {
        // Use relevant features to calculate popularity
        return features.reduce((sum, val) => sum + val, 0) / features.length;
    }

    /**
     * Get user-event interaction status
     */
    _getUserEventInteraction(userId, eventId) {
        // Placeholder: In real implementation, this would check actual user interaction data
        return 0;
    }
}

module.exports = RecommendationEngine;
