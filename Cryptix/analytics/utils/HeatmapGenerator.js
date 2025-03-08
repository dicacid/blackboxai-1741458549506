class HeatmapGenerator {
    constructor() {
        this.currentHeatmap = null;
        this.gridSize = { x: 100, y: 100 }; // Default grid size
        this.smoothingFactor = 0.5;
        this.decayRate = 0.95;
    }

    /**
     * Generate heatmap from current data
     */
    generateHeatmap(data) {
        const { crowdDensity, zoneOccupancy, hotspots } = data;
        
        // Initialize grid
        const grid = this._initializeGrid();

        // Apply crowd density
        this._applyCrowdDensity(grid, crowdDensity);

        // Apply zone occupancy
        this._applyZoneOccupancy(grid, zoneOccupancy);

        // Apply hotspots
        this._applyHotspots(grid, hotspots);

        // Smooth the heatmap
        const smoothedGrid = this._smoothHeatmap(grid);

        // Apply decay to previous values
        this._applyDecay(smoothedGrid);

        this.currentHeatmap = smoothedGrid;
        return smoothedGrid;
    }

    /**
     * Calculate density for a specific location
     */
    calculateDensity(locationData) {
        const { count, area } = locationData;
        return area > 0 ? count / area : 0;
    }

    /**
     * Get current heatmap
     */
    getCurrentHeatmap() {
        return this.currentHeatmap;
    }

    /**
     * Initialize empty grid
     */
    _initializeGrid() {
        const grid = [];
        for (let i = 0; i < this.gridSize.x; i++) {
            grid[i] = new Array(this.gridSize.y).fill(0);
        }
        return grid;
    }

    /**
     * Apply crowd density to grid
     */
    _applyCrowdDensity(grid, crowdDensity) {
        for (const [zoneId, density] of crowdDensity) {
            const coordinates = this._getZoneCoordinates(zoneId);
            this._applyValueToArea(grid, coordinates, density);
        }
    }

    /**
     * Apply zone occupancy to grid
     */
    _applyZoneOccupancy(grid, zoneOccupancy) {
        for (const [zoneId, data] of zoneOccupancy) {
            const coordinates = this._getZoneCoordinates(zoneId);
            const occupancyValue = this._calculateOccupancyValue(data.count);
            this._applyValueToArea(grid, coordinates, occupancyValue);
        }
    }

    /**
     * Apply hotspots to grid
     */
    _applyHotspots(grid, hotspots) {
        for (const zoneId of hotspots) {
            const coordinates = this._getZoneCoordinates(zoneId);
            this._applyHotspotIntensity(grid, coordinates);
        }
    }

    /**
     * Smooth heatmap using gaussian blur
     */
    _smoothHeatmap(grid) {
        const smoothed = this._initializeGrid();
        const kernel = this._generateGaussianKernel(3, this.smoothingFactor);

        for (let x = 1; x < this.gridSize.x - 1; x++) {
            for (let y = 1; y < this.gridSize.y - 1; y++) {
                smoothed[x][y] = this._applyKernel(grid, x, y, kernel);
            }
        }

        return smoothed;
    }

    /**
     * Apply decay to previous values
     */
    _applyDecay(grid) {
        for (let x = 0; x < this.gridSize.x; x++) {
            for (let y = 0; y < this.gridSize.y; y++) {
                grid[x][y] *= this.decayRate;
            }
        }
    }

    /**
     * Generate gaussian kernel for smoothing
     */
    _generateGaussianKernel(size, sigma) {
        const kernel = [];
        const mean = (size - 1) / 2;

        for (let x = 0; x < size; x++) {
            kernel[x] = [];
            for (let y = 0; y < size; y++) {
                kernel[x][y] = Math.exp(
                    -(Math.pow(x - mean, 2) + Math.pow(y - mean, 2)) /
                    (2 * Math.pow(sigma, 2))
                );
            }
        }

        // Normalize kernel
        const sum = kernel.flat().reduce((a, b) => a + b, 0);
        return kernel.map(row => row.map(val => val / sum));
    }

    /**
     * Apply kernel to a point in the grid
     */
    _applyKernel(grid, x, y, kernel) {
        let sum = 0;
        const kernelSize = kernel.length;
        const offset = Math.floor(kernelSize / 2);

        for (let i = 0; i < kernelSize; i++) {
            for (let j = 0; j < kernelSize; j++) {
                const gridX = x + (i - offset);
                const gridY = y + (j - offset);
                
                if (this._isValidGridPosition(gridX, gridY)) {
                    sum += grid[gridX][gridY] * kernel[i][j];
                }
            }
        }

        return sum;
    }

    /**
     * Get coordinates for a zone
     */
    _getZoneCoordinates(zoneId) {
        // In a real implementation, this would map zone IDs to actual coordinates
        return {
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10
        };
    }

    /**
     * Apply value to an area in the grid
     */
    _applyValueToArea(grid, coordinates, value) {
        const { x1, y1, x2, y2 } = coordinates;
        
        for (let x = x1; x < x2; x++) {
            for (let y = y1; y < y2; y++) {
                if (this._isValidGridPosition(x, y)) {
                    grid[x][y] += value;
                }
            }
        }
    }

    /**
     * Apply hotspot intensity to an area
     */
    _applyHotspotIntensity(grid, coordinates) {
        const { x1, y1, x2, y2 } = coordinates;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radius = Math.max(x2 - x1, y2 - y1) / 2;

        for (let x = x1; x < x2; x++) {
            for (let y = y1; y < y2; y++) {
                if (this._isValidGridPosition(x, y)) {
                    const distance = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                    );
                    const intensity = Math.max(0, 1 - (distance / radius));
                    grid[x][y] += intensity;
                }
            }
        }
    }

    /**
     * Calculate occupancy value
     */
    _calculateOccupancyValue(count) {
        // Simple linear scaling, could be made more sophisticated
        return count / 100;
    }

    /**
     * Check if position is valid in grid
     */
    _isValidGridPosition(x, y) {
        return x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y;
    }
}

module.exports = { HeatmapGenerator };
