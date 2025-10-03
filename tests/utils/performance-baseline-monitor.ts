import fs from 'fs/promises'
import path from 'path'

// Performance baseline monitoring system
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  environment: string
  tags: Record<string, string>
}

export interface PerformanceBaseline {
  metric_name: string
  baseline_value: number
  unit: string
  threshold_warning: number  // Percentage change to trigger warning
  threshold_critical: number // Percentage change to trigger critical alert
  last_updated: string
  trend_data: Array<{
    value: number
    timestamp: string
    environment: string
  }>
}

export interface PerformanceAlert {
  metric_name: string
  current_value: number
  baseline_value: number
  change_percentage: number
  severity: 'warning' | 'critical'
  threshold_breached: number
  environment: string
  timestamp: string
  trend: 'improving' | 'degrading' | 'stable'
}

export class PerformanceBaselineMonitor {
  private baselineFile: string
  private metricsFile: string
  private alertsFile: string
  private maxTrendDataPoints: number = 100

  constructor() {
    this.baselineFile = path.join(process.cwd(), 'performance-baselines.json')
    this.metricsFile = path.join(process.cwd(), 'performance-metrics-history.json')
    this.alertsFile = path.join(process.cwd(), 'performance-alerts.json')
  }

  // Record a new performance metric
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Load existing metrics
      const history = await this.loadMetricsHistory()
      
      // Add new metric
      if (!history[metric.name]) {
        history[metric.name] = []
      }
      
      history[metric.name].push({
        value: metric.value,
        timestamp: metric.timestamp,
        environment: metric.environment,
        unit: metric.unit,
        tags: metric.tags
      })
      
      // Keep only last N data points
      if (history[metric.name].length > this.maxTrendDataPoints) {
        history[metric.name] = history[metric.name].slice(-this.maxTrendDataPoints)
      }
      
      // Save updated history
      await fs.writeFile(this.metricsFile, JSON.stringify(history, null, 2))
      
      // Check for regressions
      await this.checkForRegressions(metric)
      
    } catch (error) {
      console.error('Failed to record performance metric:', error)
    }
  }

  // Load performance metrics history
  private async loadMetricsHistory(): Promise<Record<string, unknown[]>> {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf-8')
      return JSON.parse(data)
    } catch {
      // File doesn't exist or is invalid, start fresh
      return {}
    }
  }

  // Load performance baselines
  async loadBaselines(): Promise<Record<string, PerformanceBaseline>> {
    try {
      const data = await fs.readFile(this.baselineFile, 'utf-8')
      return JSON.parse(data)
    } catch {
      // File doesn't exist, return empty baselines
      return {}
    }
  }

  // Update performance baseline
  async updateBaseline(metric: PerformanceMetric, options?: {
    warningThreshold?: number
    criticalThreshold?: number
    forceUpdate?: boolean
  }): Promise<void> {
    const baselines = await this.loadBaselines()
    
    const baseline: PerformanceBaseline = baselines[metric.name] || {
      metric_name: metric.name,
      baseline_value: 0,
      unit: metric.unit,
      threshold_warning: options?.warningThreshold || 10, // 10% by default
      threshold_critical: options?.criticalThreshold || 20, // 20% by default
      last_updated: '',
      trend_data: []
    }
    
    // Update baseline value
    baseline.baseline_value = metric.value
    baseline.unit = metric.unit
    baseline.last_updated = metric.timestamp
    
    // Update thresholds if provided
    if (options?.warningThreshold) {
      baseline.threshold_warning = options.warningThreshold
    }
    if (options?.criticalThreshold) {
      baseline.threshold_critical = options.criticalThreshold
    }
    
    // Add to trend data
    baseline.trend_data.push({
      value: metric.value,
      timestamp: metric.timestamp,
      environment: metric.environment
    })
    
    // Keep only recent trend data
    if (baseline.trend_data.length > this.maxTrendDataPoints) {
      baseline.trend_data = baseline.trend_data.slice(-this.maxTrendDataPoints)
    }
    
    baselines[metric.name] = baseline
    
    // Save updated baselines
    await fs.writeFile(this.baselineFile, JSON.stringify(baselines, null, 2))
    
    console.log(`📊 Updated baseline for ${metric.name}: ${metric.value}${metric.unit}`)
  }

  // Check for performance regressions
  private async checkForRegressions(metric: PerformanceMetric): Promise<void> {
    const baselines = await this.loadBaselines()
    const baseline = baselines[metric.name]
    
    if (!baseline) {
      console.log(`📊 No baseline found for ${metric.name}, creating initial baseline`)
      await this.updateBaseline(metric)
      return
    }

    // Calculate percentage change
    const changePercentage = ((metric.value - baseline.baseline_value) / baseline.baseline_value) * 100
    
    // Determine if alert is needed
    let severity: 'warning' | 'critical' | null = null
    
    if (Math.abs(changePercentage) >= baseline.threshold_critical) {
      severity = 'critical'
    } else if (Math.abs(changePercentage) >= baseline.threshold_warning) {
      severity = 'warning'
    }
    
    if (severity) {
      const alert: PerformanceAlert = {
        metric_name: metric.name,
        current_value: metric.value,
        baseline_value: baseline.baseline_value,
        change_percentage: changePercentage,
        severity,
        threshold_breached: severity === 'critical' ? baseline.threshold_critical : baseline.threshold_warning,
        environment: metric.environment,
        timestamp: metric.timestamp,
        trend: this.calculateTrend(baseline.trend_data)
      }
      
      await this.recordAlert(alert)
      
      console.log(`🚨 Performance ${severity}: ${metric.name}`)
      console.log(`   Current: ${metric.value}${metric.unit}`)
      console.log(`   Baseline: ${baseline.baseline_value}${metric.unit}`)
      console.log(`   Change: ${changePercentage.toFixed(1)}%`)
    } else {
      console.log(`✅ Performance stable: ${metric.name} (${changePercentage.toFixed(1)}% change)`)
    }
  }

  // Calculate trend direction
  private calculateTrend(trendData: Array<{ value: number; timestamp: string }>): 'improving' | 'degrading' | 'stable' {
    if (trendData.length < 3) return 'stable'
    
    const recent = trendData.slice(-5) // Last 5 data points
    const older = trendData.slice(-10, -5) // Previous 5 data points
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length
    const olderAvg = older.reduce((sum, point) => sum + point.value, 0) / older.length
    
    const trendChange = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (trendChange > 5) return 'degrading'    // Performance is getting worse
    if (trendChange < -5) return 'improving'   // Performance is getting better
    return 'stable'
  }

  // Record performance alert
  private async recordAlert(alert: PerformanceAlert): Promise<void> {
    try {
      let alerts: PerformanceAlert[] = []
      
      try {
        const data = await fs.readFile(this.alertsFile, 'utf-8')
        alerts = JSON.parse(data)
      } catch {
        // File doesn't exist, start with empty array
      }
      
      // Add new alert
      alerts.push(alert)
      
      // Keep only recent alerts (last 50)
      if (alerts.length > 50) {
        alerts = alerts.slice(-50)
      }
      
      // Save alerts
      await fs.writeFile(this.alertsFile, JSON.stringify(alerts, null, 2))
      
    } catch (error) {
      console.error('Failed to record performance alert:', error)
    }
  }

  // Get current alerts
  async getCurrentAlerts(): Promise<PerformanceAlert[]> {
    try {
      const data = await fs.readFile(this.alertsFile, 'utf-8')
      const alerts: PerformanceAlert[] = JSON.parse(data)
      
      // Return alerts from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      return alerts.filter(alert => alert.timestamp > oneDayAgo)
      
    } catch {
      return []
    }
  }

  // Generate performance report
  async generateReport(): Promise<{
    summary: {
      total_metrics: number
      active_alerts: number
      critical_alerts: number
      warning_alerts: number
      improving_trends: number
      degrading_trends: number
      last_updated: string
    }
    baselines: Record<string, PerformanceBaseline>
    alerts: PerformanceAlert[]
    trends: Record<string, {
      direction: 'improving' | 'degrading' | 'stable'
      recent_values: Array<{ value: number; timestamp: string }>
      average_change: number
      volatility: number
    }>
  }> {
    const baselines = await this.loadBaselines()
    const alerts = await this.getCurrentAlerts()
    // const history = await this.loadMetricsHistory() // Not currently used
    
    // Calculate summary statistics
    const summary = {
      total_metrics: Object.keys(baselines).length,
      active_alerts: alerts.length,
      critical_alerts: alerts.filter(a => a.severity === 'critical').length,
      warning_alerts: alerts.filter(a => a.severity === 'warning').length,
      improving_trends: Object.values(baselines).filter(b => this.calculateTrend(b.trend_data) === 'improving').length,
      degrading_trends: Object.values(baselines).filter(b => this.calculateTrend(b.trend_data) === 'degrading').length,
      last_updated: new Date().toISOString()
    }
    
    // Calculate trends for each metric
    const trends: Record<string, {
      direction: 'improving' | 'degrading' | 'stable'
      recent_values: Array<{ value: number; timestamp: string }>
      average_change: number
      volatility: number
    }> = {}
    Object.entries(baselines).forEach(([name, baseline]) => {
      const recentData = baseline.trend_data.slice(-10)
      trends[name] = {
        direction: this.calculateTrend(baseline.trend_data),
        recent_values: recentData.map(d => ({ value: d.value, timestamp: d.timestamp })),
        average_change: this.calculateAverageChange(recentData),
        volatility: this.calculateVolatility(recentData)
      }
    })
    
    return {
      summary,
      baselines,
      alerts,
      trends
    }
  }

  // Calculate average change over time
  private calculateAverageChange(data: Array<{ value: number; timestamp: string }>): number {
    if (data.length < 2) return 0
    
    let totalChange = 0
    for (let i = 1; i < data.length; i++) {
      const change = ((data[i].value - data[i-1].value) / data[i-1].value) * 100
      totalChange += change
    }
    
    return totalChange / (data.length - 1)
  }

  // Calculate volatility (standard deviation of changes)
  private calculateVolatility(data: Array<{ value: number; timestamp: string }>): number {
    if (data.length < 3) return 0
    
    const values = data.map(d => d.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    
    return Math.sqrt(variance)
  }

  // Initialize performance monitoring for a test run
  async initializeTestRun(environment: string): Promise<{
    recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => Promise<void>
    finalize: () => Promise<void>
  }> {
    const timestamp = new Date().toISOString()
    const metrics: PerformanceMetric[] = []
    
    const recordMetric = async (name: string, value: number, unit: string, tags: Record<string, string> = {}) => {
      const metric: PerformanceMetric = {
        name,
        value,
        unit,
        timestamp,
        environment,
        tags
      }
      
      metrics.push(metric)
      await this.recordMetric(metric)
    }
    
    const finalize = async () => {
      console.log(`📊 Performance test run completed: ${metrics.length} metrics recorded`)
      
      // Generate report for this test run
      const report = await this.generateReport()
      console.log(`📈 Active alerts: ${report.alerts.length}`)
      console.log(`🔺 Degrading trends: ${report.summary.degrading_trends}`)
      console.log(`🔻 Improving trends: ${report.summary.improving_trends}`)
    }
    
    return { recordMetric, finalize }
  }
}

// Helper functions for test integration
export async function withPerformanceMonitoring<T>(
  testName: string,
  testFn: (monitor: {
    recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => Promise<void>
  }) => Promise<T>
): Promise<T> {
  const monitor = new PerformanceBaselineMonitor()
  const environment = process.env.NODE_ENV || 'test'
  
  const { recordMetric, finalize } = await monitor.initializeTestRun(environment)
  
  try {
    console.log(`📊 Starting performance monitoring for: ${testName}`)
    
    const result = await testFn({ recordMetric })
    
    await finalize()
    
    return result
    
  } catch (error) {
    await finalize()
    throw error
  }
}

// Predefined performance test helpers
export const PerformanceTestHelpers = {
  // Measure and record validation time
  measureValidationTime: async (
    monitor: { recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => Promise<void> },
    fileSize: string,
    validationFn: () => Promise<void>
  ): Promise<void> => {
    const startTime = Date.now()
    await validationFn()
    const endTime = Date.now()
    
    const duration = (endTime - startTime) / 1000 // Convert to seconds
    await monitor.recordMetric(`yaml_validation_${fileSize}`, duration, 's', { file_size: fileSize })
  },

  // Measure concurrent user performance
  measureConcurrentUsers: async (
    monitor: { recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => Promise<void> },
    userCount: number,
    testResults: Array<{ success: boolean; responseTime: number }>
  ): Promise<void> => {
    const successRate = (testResults.filter(r => r.success).length / testResults.length) * 100
    const avgResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length / 1000 // Convert to seconds
    
    await monitor.recordMetric(`concurrent_users_${userCount}_success_rate`, successRate, '%', { user_count: userCount.toString() })
    await monitor.recordMetric(`concurrent_users_${userCount}_avg_response`, avgResponseTime, 's', { user_count: userCount.toString() })
  },

  // Measure memory usage
  measureMemoryUsage: async (
    monitor: { recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => Promise<void> },
    testName: string,
    memoryUsageMB: number
  ): Promise<void> => {
    await monitor.recordMetric(`memory_usage_${testName}`, memoryUsageMB, 'MB', { test_name: testName })
  }
}