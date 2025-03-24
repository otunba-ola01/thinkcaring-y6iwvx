import React, { useMemo } from 'react'; // v18.2.0
import BarChart from './BarChart';
import { ChartDataPoint, BarChartProps, ChartAxisType } from '../../types/chart.types';
import { RevenueByProgram } from '../../types/dashboard.types';
import { formatCurrency } from '../../utils/currency';
import { CHART_COLORS } from '../../config/chart.config';

/**
 * Props interface for the RevenueByProgramChart component
 */
interface RevenueByProgramChartProps extends Omit<BarChartProps, 'data'> {
  /**
   * Array of program revenue data to visualize
   */
  programRevenue: RevenueByProgram[];
  /**
   * Optional callback for when a program bar is clicked
   */
  onClick?: (program: RevenueByProgram) => void;
}

/**
 * Transforms RevenueByProgram data into ChartDataPoint format for the BarChart component
 * 
 * @param programRevenue - Array of program revenue data
 * @returns Transformed data for the chart
 */
const transformProgramData = (programRevenue: RevenueByProgram[]): ChartDataPoint[] => {
  if (!programRevenue || programRevenue.length === 0) {
    return [];
  }

  return programRevenue
    .map((program, index) => ({
      label: program.programName,
      value: program.amount,
      color: CHART_COLORS.PRIMARY[index % CHART_COLORS.PRIMARY.length],
      id: program.programId
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order for better visualization
};

/**
 * A specialized chart component that visualizes revenue distribution across different HCBS programs.
 * This component renders a bar chart showing program revenue data with proper formatting for currency values
 * and supports interactive features like tooltips and click handling.
 * 
 * @param props - Component props
 * @returns The rendered RevenueByProgramChart component
 */
const RevenueByProgramChart = ({
  programRevenue,
  title = 'Revenue by Program',
  onClick,
  ...rest
}: RevenueByProgramChartProps): JSX.Element => {
  // Transform program revenue data into chart data points
  const chartData = useMemo(() => transformProgramData(programRevenue), [programRevenue]);

  // Configure click handler to find and return the clicked program data
  const handleClick = (clickedData: ChartDataPoint) => {
    if (onClick && programRevenue.length > 0) {
      // Find the program by name
      const selectedProgram = programRevenue.find(program => program.programName === clickedData.label);
      if (selectedProgram) {
        onClick(selectedProgram);
      }
    }
  };

  return (
    <BarChart
      data={chartData}
      title={title}
      tooltip={{ format: 'currency' }}
      onClick={handleClick}
      yAxis={{
        type: ChartAxisType.LINEAR,
        title: 'Revenue',
        format: 'currency'
      }}
      aria-label={`Bar chart showing revenue distribution by program`}
      {...rest}
    />
  );
};

export default RevenueByProgramChart;