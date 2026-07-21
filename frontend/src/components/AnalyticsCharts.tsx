import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

interface QuestionSummaryData {
  question_number: number;
  max_marks: number;
  average_score: number;
  average_percentage: number;
}

interface AnalyticsChartsProps {
  averagePercentage: number;
  questionSummaries: QuestionSummaryData[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  questionSummaries,
}) => {
  const barData = questionSummaries.map((q) => ({
    name: `Q${q.question_number}`,
    averageScore: q.average_score,
    maxMarks: q.max_marks,
    percentage: q.average_percentage,
  }));

  const radarData = questionSummaries.map((q) => ({
    subject: `Q${q.question_number}`,
    score: q.average_percentage,
    fullMark: 100,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Question Performance Bar Chart */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Per-Question Average Score
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  borderRadius: '0.5rem',
                  border: 'none',
                }}
              />
              <Bar dataKey="averageScore" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Avg Score" />
              <Bar dataKey="maxMarks" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Max Marks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Knowledge Radar Chart */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Class Mastery Radar (%)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={90} data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" fontSize={10} />
              <Radar name="Class %" dataKey="score" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.5} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
