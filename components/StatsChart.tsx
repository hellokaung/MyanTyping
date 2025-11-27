import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TypingResult } from '../types';

interface StatsChartProps {
  results: TypingResult[];
}

const StatsChart: React.FC<StatsChartProps> = ({ results }) => {
  const data = useMemo(() => {
    // Reverse to show oldest to newest left to right
    return [...results].reverse().map((r) => ({
      date: new Date(r.date).toLocaleDateString(),
      wpm: r.wpm,
      accuracy: r.accuracy,
    }));
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">
        <p>No practice history yet.</p>
        <p className="text-sm">Complete a lesson to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Progress History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525b" strokeOpacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="#71717a" 
            fontSize={12} 
            tickMargin={10}
            tickFormatter={(value) => value.split('/')[0] + '/' + value.split('/')[1]} // Shorten date
          />
          <YAxis stroke="#71717a" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '8px', 
              border: '1px solid #e4e4e7',
              color: '#18181b'
            }}
            itemStyle={{ color: '#18181b' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="wpm"
            name="WPM"
            stroke="#ef4444" // Red-500
            strokeWidth={2}
            dot={{ r: 4, fill: '#ef4444' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            name="Accuracy %"
            stroke="#10b981" // Emerald-500
            strokeWidth={2}
            dot={{ r: 4, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
