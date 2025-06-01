import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

// Define the shape of the data for the chart
interface ProjectProgressData {
  date: string; // Date string (e.g., 'YYYY-MM-DD')
  progress: number; // Progress percentage (0-100)
}

interface ProjectProgressChartProps {
  /**
   * Data for the chart, an array of objects with date and progress.
   */
  data: ProjectProgressData[];
  /**
   * Optional additional CSS class for the container.
   */
  className?: string;
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ data, className }) => {
  const { theme } = useTheme();

  // Define colors based on the current theme
  const axisColor = theme === 'dark' ? '#a3a3a3' : '#525252'; // neutral-400 / neutral-700
  const gridColor = theme === 'dark' ? '#404040' : '#e5e5e5'; // neutral-700 / neutral-200
  const lineColor = theme === 'dark' ? '#38bdf8' : '#0ea5e9'; // primary-400 / primary-500
  const tooltipBg = theme === 'dark' ? '#262626' : '#ffffff'; // neutral-800 / white
  const tooltipBorder = theme === 'dark' ? '#404040' : '#e5e5e5'; // neutral-700 / neutral-200
  const tooltipTextColor = theme === 'dark' ? '#e5e5e5' : '#171717'; // neutral-200 / neutral-900

  // Custom Tooltip component to format content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={cn(
            'rounded-md p-3 shadow-lg text-sm',
            'border',
            theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
          )}
          style={{ color: tooltipTextColor }}
        >
          <p className="font-medium mb-1">{formatDate(label, 'MMM d, yyyy')}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Sort data by date to ensure correct line chart rendering
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <LineChart
        data={sortedData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tickFormatter={(tick) => formatDate(tick, 'MMM dd')}
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 12 }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
        />
        <YAxis
          tickFormatter={(tick) => `${tick}%`}
          domain={[0, 100]} // Ensure Y-axis always goes from 0 to 100
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 12 }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="progress"
          name="Progress"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 4, fill: lineColor, strokeWidth: 1, stroke: tooltipBg }}
          activeDot={{ r: 6, fill: lineColor, stroke: tooltipBg, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ProjectProgressChart;
