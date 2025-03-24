import React, { useMemo } from 'react'; // v18.2.0
import LineChart from './LineChart';
import { 
  RevenueTrendChartProps, 
  ChartAxisType,
  ChartSeries
} from '../../types/chart.types';
import { RevenueTrendPoint } from '../../types/dashboard.types';
import { formatCurrency } from '../../utils/currency';
import { getChartOptions } from '../../config/chart.config';

/**
 * A specialized chart component for visualizing revenue trends over time with optional comparison to previous period
 * 
 * @param {RevenueTrendChartProps} props - Component props
 * @returns {JSX.Element} The rendered RevenueTrendChart component
 */
const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data = [],
  height = 300,
  loading = false,
  error = null,
  title = 'Revenue Trend',
  subtitle,
  themeMode,
  showComparison = false,
  onClick
}) => {
  // Transform revenue data into chart series format
  const chartData = useMemo(() => {
    return prepareChartData(data, showComparison);
  }, [data, showComparison]);

  // Configure x-axis (time)
  const xAxis = {
    type: ChartAxisType.TIME,
    grid: false,
    title: 'Date'
  };

  // Configure y-axis (currency)
  const yAxis = {
    type: ChartAxisType.LINEAR,
    grid: true,
    title: 'Revenue',
    format: 'currency'
  };

  // Configure chart options
  const options = useMemo(() => {
    return getChartOptions({
      themeMode,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = formatCurrency(context.raw.y);
              return `${label}: ${value}`;
            }
          }
        }
      }
    });
  }, [themeMode]);

  return (
    <LineChart
      data={chartData}
      xAxis={xAxis}
      yAxis={yAxis}
      height={height}
      loading={loading}
      error={error}
      showPoints={true}
      curve={true}
      area={true}
      title={title}
      subtitle={subtitle}
      themeMode={themeMode}
      onClick={onClick}
      emptyMessage="No revenue data available for the selected period"
    />
  );
};

/**
 * Transforms revenue trend data into the format required by the LineChart component
 * 
 * @param {RevenueTrendPoint[]} data - The revenue trend data points
 * @param {boolean} showComparison - Whether to include previous period comparison
 * @returns {ChartSeries[]} Formatted chart series data
 */
function prepareChartData(data: RevenueTrendPoint[], showComparison: boolean): ChartSeries[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Create current period series
  const currentPeriodSeries: ChartSeries = {
    name: 'Current Period',
    data: data.map(point => ({
      x: point.date,
      y: point.amount
    }))
  };

  // Create previous period series if comparison is enabled and data is available
  if (showComparison) {
    const previousPeriodData = data
      .filter(point => point.previousAmount !== null)
      .map(point => ({
        x: point.date,
        y: point.previousAmount as number
      }));

    if (previousPeriodData.length > 0) {
      return [
        currentPeriodSeries,
        {
          name: 'Previous Period',
          data: previousPeriodData
        }
      ];
    }
  }

  return [currentPeriodSeries];
}

export default RevenueTrendChart;