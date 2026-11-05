/**
 * Performance monitoring utilities for the S2 Dynamic Item Generator
 * Helps track memory usage and performance improvements
 */

import { configLoader } from '../state/ConfigLoader.js';

class PerformanceMonitor {
    constructor() {
        this.startTime = performance.now();
        this.memoryBaseline = this.getMemoryInfo();
        this.configLoadTimes = new Map();
    }

    /**
     * Get current memory usage information
     * @returns {Object} Memory usage stats
     */
    getMemoryInfo() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
        }
        return { available: false, timestamp: Date.now() };
    }

    /**
     * Track configuration loading time
     * @param {string} configName - Name of the configuration
     * @param {Function} loadFunction - Function that loads the config
     * @returns {*} Result of the load function
     */
    trackConfigLoad(configName, loadFunction) {
        const start = performance.now();
        const result = loadFunction();
        const end = performance.now();
        
        this.configLoadTimes.set(configName, {
            duration: end - start,
            timestamp: Date.now()
        });
        
        return result;
    }

    /**
     * Get performance report
     * @returns {Object} Performance statistics
     */
    getReport() {
        const currentMemory = this.getMemoryInfo();
        const configLoaderInfo = configLoader.getMemoryInfo();
        
        return {
            totalRuntime: performance.now() - this.startTime,
            memory: {
                baseline: this.memoryBaseline,
                current: currentMemory,
                difference: currentMemory.available ? 
                    currentMemory.used - this.memoryBaseline.used : 'unavailable'
            },
            configLoader: configLoaderInfo,
            configLoadTimes: Object.fromEntries(this.configLoadTimes),
            recommendations: this.getRecommendations(configLoaderInfo)
        };
    }

    /**
     * Get performance recommendations
     * @param {Object} configLoaderInfo - Config loader memory info
     * @returns {Array<string>} Array of recommendations
     */
    getRecommendations(configLoaderInfo) {
        const recommendations = [];
        
        if (configLoaderInfo.cacheSize > 10) {
            recommendations.push('Consider clearing config cache to free memory');
        }
        
        if (configLoaderInfo.modifiedCount > 5) {
            recommendations.push('Multiple configurations modified - consider batch operations');
        }
        
        const memoryDiff = this.getMemoryInfo().used - this.memoryBaseline.used;
        if (memoryDiff > 50 * 1024 * 1024) { // 50MB
            recommendations.push('High memory usage detected - consider optimizing data structures');
        }
        
        return recommendations;
    }

    /**
     * Log performance report to console
     */
    logReport() {
        const report = this.getReport();
        console.group('🚀 S2 Generator Performance Report');
        console.log('⏱️ Total Runtime:', `${report.totalRuntime.toFixed(2)}ms`);
        
        if (report.memory.current.available) {
            console.log('🧠 Memory Usage:', {
                baseline: `${(report.memory.baseline.used / 1024 / 1024).toFixed(2)}MB`,
                current: `${(report.memory.current.used / 1024 / 1024).toFixed(2)}MB`,
                difference: `${(report.memory.difference / 1024 / 1024).toFixed(2)}MB`
            });
        }
        
        console.log('⚙️ Config Loader:', report.configLoader);
        
        if (report.recommendations.length > 0) {
            console.log('💡 Recommendations:', report.recommendations);
        }
        
        console.groupEnd();
    }

    /**
     * Clear all tracked data and reset baseline
     */
    reset() {
        this.startTime = performance.now();
        this.memoryBaseline = this.getMemoryInfo();
        this.configLoadTimes.clear();
    }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const trackConfigLoad = (configName, loadFunction) => 
    performanceMonitor.trackConfigLoad(configName, loadFunction);

export const getPerformanceReport = () => performanceMonitor.getReport();

export const logPerformanceReport = () => performanceMonitor.logReport();

// Auto-log performance report in development
if (window.location.hostname === 'localhost') {
    // Log performance report after 30 seconds
    setTimeout(() => {
        console.log('📊 Auto-generated performance report:');
        performanceMonitor.logReport();
    }, 30000);
}
