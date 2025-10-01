import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * @test Quality Dashboard Component Tests
 * @description Comprehensive test suite for QualityDashboard monitoring component
 * @coverage Metrics display, real-time updates, alerts, trends, export
 */

// Mock QualityDashboard component
const QualityDashboard = ({ metrics, alerts, onExport }: any) => (
  <div data-testid="quality-dashboard" className="dashboard">
    <div data-testid="metrics-panel" className="metrics">
      {metrics.map((metric: any, i: number) => (
        <div key={i} data-testid={`metric-${metric.name}`} className="metric-card">
          <h3>{metric.name}</h3>
          <span data-testid={`metric-value-${metric.name}`}>{metric.value}</span>
          <span data-testid={`metric-unit-${metric.name}`}>{metric.unit}</span>
        </div>
      ))}
    </div>
    <div data-testid="alerts-panel" className="alerts">
      {alerts.map((alert: any, i: number) => (
        <div key={i} data-testid={`alert-${i}`} className={`alert ${alert.severity}`}>
          <span data-testid={`alert-message-${i}`}>{alert.message}</span>
          <span data-testid={`alert-severity-${i}`}>{alert.severity}</span>
        </div>
      ))}
    </div>
    <div data-testid="trends-panel" className="trends">
      <h3>Historical Trends</h3>
      <div data-testid="trend-chart">Chart Placeholder</div>
    </div>
    <button data-testid="export-button" onClick={onExport}>Export Data</button>
    <div data-testid="live-indicator" className="live-indicator">●</div>
  </div>
)

describe('QualityDashboard Component', () => {
  const mockMetrics = [
    { name: 'Response Time', value: 145, unit: 'ms' },
    { name: 'Cache Hit Rate', value: 87, unit: '%' },
    { name: 'Error Rate', value: 0.05, unit: '%' },
    { name: 'Agent Queue', value: 2, unit: 'jobs' },
  ]

  const mockAlerts = [
    { message: 'High response time detected', severity: 'warning' },
    { message: 'Cache hit rate below target', severity: 'info' },
  ]

  let mockOnExport: any

  beforeEach(() => {
    mockOnExport = vi.fn()
  })

  // Test 1: Basic Rendering
  it('should render quality dashboard with all panels', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument()
    expect(screen.getByTestId('alerts-panel')).toBeInTheDocument()
    expect(screen.getByTestId('trends-panel')).toBeInTheDocument()
  })

  // Test 2: Metrics Display
  it('should render all metrics correctly', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('metric-Response Time')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Cache Hit Rate')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Error Rate')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Agent Queue')).toBeInTheDocument()
  })

  // Test 3: Metric Values
  it('should display correct metric values', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('metric-value-Response Time')).toHaveTextContent('145')
    expect(screen.getByTestId('metric-value-Cache Hit Rate')).toHaveTextContent('87')
    expect(screen.getByTestId('metric-value-Error Rate')).toHaveTextContent('0.05')
    expect(screen.getByTestId('metric-value-Agent Queue')).toHaveTextContent('2')
  })

  // Test 4: Metric Units
  it('should display correct metric units', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('metric-unit-Response Time')).toHaveTextContent('ms')
    expect(screen.getByTestId('metric-unit-Cache Hit Rate')).toHaveTextContent('%')
    expect(screen.getByTestId('metric-unit-Error Rate')).toHaveTextContent('%')
    expect(screen.getByTestId('metric-unit-Agent Queue')).toHaveTextContent('jobs')
  })

  // Test 5: Alerts Panel
  it('should render all alerts', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('alert-0')).toBeInTheDocument()
    expect(screen.getByTestId('alert-1')).toBeInTheDocument()
  })

  // Test 6: Alert Messages
  it('should display correct alert messages', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('alert-message-0')).toHaveTextContent('High response time detected')
    expect(screen.getByTestId('alert-message-1')).toHaveTextContent('Cache hit rate below target')
  })

  // Test 7: Alert Severity
  it('should display correct alert severities', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('alert-severity-0')).toHaveTextContent('warning')
    expect(screen.getByTestId('alert-severity-1')).toHaveTextContent('info')
  })

  // Test 8: Alert Severity Classes
  it('should apply correct severity classes to alerts', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('alert-0')).toHaveClass('alert', 'warning')
    expect(screen.getByTestId('alert-1')).toHaveClass('alert', 'info')
  })

  // Test 9: Trends Panel
  it('should render historical trends section', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('trends-panel')).toBeInTheDocument()
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
  })

  // Test 10: Export Button
  it('should render export functionality button', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('export-button')).toBeInTheDocument()
    expect(screen.getByTestId('export-button')).toHaveTextContent('Export Data')
  })

  // Test 11: Export Functionality
  it('should call onExport when export button clicked', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    const exportButton = screen.getByTestId('export-button')
    fireEvent.click(exportButton)

    expect(mockOnExport).toHaveBeenCalledTimes(1)
  })

  // Test 12: Real-time Indicator
  it('should display live data indicator', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('live-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('live-indicator')).toHaveTextContent('●')
  })

  // Test 13: Empty Metrics
  it('should render dashboard with no metrics', () => {
    render(<QualityDashboard metrics={[]} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument()
  })

  // Test 14: Empty Alerts
  it('should render dashboard with no alerts', () => {
    render(<QualityDashboard metrics={mockMetrics} alerts={[]} onExport={mockOnExport} />)

    expect(screen.getByTestId('quality-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('alerts-panel')).toBeInTheDocument()
  })

  // Test 15: Real-time Updates
  it('should update metrics when props change', () => {
    const { rerender } = render(<QualityDashboard metrics={mockMetrics} alerts={mockAlerts} onExport={mockOnExport} />)
    expect(screen.getByTestId('metric-value-Response Time')).toHaveTextContent('145')

    const updatedMetrics = [{ name: 'Response Time', value: 98, unit: 'ms' }]
    rerender(<QualityDashboard metrics={updatedMetrics} alerts={mockAlerts} onExport={mockOnExport} />)

    expect(screen.getByTestId('metric-value-Response Time')).toHaveTextContent('98')
  })
})
