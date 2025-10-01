export enum TileType {
  SingleMetric = 'single-metric',       // Display one metric
  MultiMetric = 'multi-metric',         // Display multiple metrics (comparison)
  KpiTracker = 'kpi-tracker',           // Display KPI with target progress
  MetricWithKpi = 'metric-with-kpi',    // Metric value + associated KPI
  Chart = 'chart',                      // Time-series chart
}
