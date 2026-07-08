import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { getExamSummary } from '../api/client';
import type { ExamSummaryResponse, QuestionSummary } from '../api/types';
import { Skeleton } from '../components/Skeleton';

export default function ExamSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ExamSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getExamSummary(id)
        .then(setSummary)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Line className="w-56 h-8" />
          <Skeleton.Line className="w-72" />
        </div>
        <Skeleton.StatsGrid />
        <Skeleton.List count={3} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Summary not found.</p>
        <Link to="/exams" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to exams
        </Link>
      </div>
    );
  }

  const hasData = summary.total_submissions > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/exams/${summary.exam_id}`)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Summary</h1>
          <p className="mt-1 text-gray-500">
            {summary.exam_title} &middot; {summary.total_marks} total marks
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions yet</h3>
          <p className="text-gray-500 mb-6">
            Evaluate at least one submission to generate a summary report.
          </p>
          <Link
            to={`/exams/${summary.exam_id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exam
          </Link>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStatCard
              icon={Users}
              label="Submissions"
              value={summary.total_submissions}
              subtitle="total evaluated"
              color="indigo"
            />
            <SummaryStatCard
              icon={TrendingUp}
              label="Average"
              value={`${summary.average_percentage.toFixed(1)}%`}
              subtitle={`${summary.average_score.toFixed(1)} / ${summary.total_marks}`}
              color={
                summary.average_percentage >= 70
                  ? 'emerald'
                  : summary.average_percentage >= 40
                    ? 'amber'
                    : 'red'
              }
            />
            <SummaryStatCard
              icon={Target}
              label="Highest"
              value={`${summary.highest_percentage.toFixed(1)}%`}
              subtitle={`${summary.highest_score.toFixed(1)} / ${summary.total_marks}`}
              color="emerald"
            />
            <SummaryStatCard
              icon={TrendingDown}
              label="Lowest"
              value={`${summary.lowest_percentage.toFixed(1)}%`}
              subtitle={`${summary.lowest_score.toFixed(1)} / ${summary.total_marks}`}
              color="red"
            />
          </div>

          {/* Per-question breakdown */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Per-Question Breakdown
            </h2>
            <div className="space-y-3">
              {summary.per_question_summary.map((q) => (
                <QuestionSummaryCard key={q.question_id} question={q} />
              ))}
            </div>
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Detailed Score Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">#</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Question</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Max</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Avg Score</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Avg %</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Answered</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Skipped</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.per_question_summary.map((q) => (
                    <tr key={q.question_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        Q{q.question_number}
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-md truncate">
                        {q.question_text}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{q.max_marks}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <span
                          className={
                            q.average_percentage >= 70
                              ? 'text-emerald-600'
                              : q.average_percentage >= 40
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }
                        >
                          {q.average_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                q.average_percentage >= 70
                                  ? 'bg-emerald-500'
                                  : q.average_percentage >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(q.average_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {q.average_percentage.toFixed(0)}%
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                        {q.submissions_answered}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        {q.submissions_skipped}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function QuestionSummaryCard({ question }: { question: QuestionSummary }) {
  const scoreColor =
    question.average_percentage >= 70
      ? 'text-emerald-600 bg-emerald-50'
      : question.average_percentage >= 40
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm shrink-0 ${scoreColor}`}
        >
          {question.average_score.toFixed(1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Q{question.question_number}
            </span>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500">{question.max_marks} marks</span>
          </div>
          <p className="text-sm text-gray-900 truncate">{question.question_text}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  question.average_percentage >= 70
                    ? 'bg-emerald-500'
                    : question.average_percentage >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(question.average_percentage, 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
              {question.average_percentage.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 mt-1 text-xs text-gray-400">
            <span>{question.submissions_answered} answered</span>
            <span>{question.submissions_skipped} skipped</span>
          </div>
        </div>
      </div>
    </div>
  );
}
