import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
} from 'lucide-react';
import { listAllSubmissions, listExams, getEvaluationResults } from '../api/client';
import type {
  SubmissionResponse,
  ExamResponse,
  EvaluationSummaryResponse,
} from '../api/types';
import { Skeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 20;

export default function EvaluationHistory() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [results, setResults] = useState<Record<string, EvaluationSummaryResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamId, setFilterExamId] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subData, examData] = await Promise.all([
        listAllSubmissions(page, PAGE_SIZE),
        listExams(1, 100),
      ]);
      setSubmissions(subData.items);
      setTotal(subData.total);
      setTotalPages(subData.total_pages);
      setExams(examData.items);

      // Fetch evaluation results for each submission
      const resultMap: Record<string, EvaluationSummaryResponse> = {};
      await Promise.all(
        subData.items.map(async (sub) => {
          try {
            const res = await getEvaluationResults(sub.id);
            if (res.evaluations.length > 0) {
              resultMap[sub.id] = res;
            }
          } catch {
            // Submission may not have results yet
          }
        }),
      );
      setResults(resultMap);
    } catch {
      setError('Failed to load evaluation history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      !searchTerm ||
      (sub.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = !filterExamId || sub.exam_id === filterExamId;
    return matchesSearch && matchesExam;
  });

  const getExamTitle = (examId: string) => {
    return exams.find((e) => e.id === examId)?.title ?? 'Unknown Exam';
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Line className="w-48 h-8" />
          <Skeleton.Line className="w-64" />
        </div>
        <Skeleton.List count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Evaluation History</h1>
        <p className="mt-1 text-gray-500">
          View all evaluated submissions and their results
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or submission ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterExamId}
          onChange={(e) => setFilterExamId(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">All Exams</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </select>
      </div>

      {/* Submissions list */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterExamId
              ? 'Try adjusting your search or filters.'
              : 'Upload a document and run an evaluation to see results here.'}
          </p>
          {!searchTerm && !filterExamId && (
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const result = results[sub.id];
            return (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                examTitle={getExamTitle(sub.exam_id)}
                result={result}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          total_pages={totalPages}
          total={total}
          page_size={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  examTitle,
  result,
}: {
  submission: SubmissionResponse;
  examTitle: string;
  result?: EvaluationSummaryResponse;
}) {
  const hasResults = result && result.evaluations.length > 0;
  const scoreColor =
    hasResults && result.percentage >= 70
      ? 'text-emerald-600 bg-emerald-50'
      : hasResults && result.percentage >= 40
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
      <div className="flex items-center gap-4">
        {/* Score badge */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-xl font-bold text-lg shrink-0 ${
            hasResults ? scoreColor : 'bg-gray-50 text-gray-400'
          }`}
        >
          {hasResults ? result.percentage.toFixed(0) : '—'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {submission.student_name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-400">in</span>
            <span className="text-sm text-indigo-600 font-medium">{examTitle}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="flex items-center gap-1">
              {hasResults ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Evaluated ({result.evaluations.length} questions)
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-gray-300" />
                  Not evaluated
                </>
              )}
            </span>
          </div>
        </div>

        {/* Score detail */}
        {hasResults && (
          <div className="text-right shrink-0 hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.percentage >= 70
                      ? 'bg-emerald-500'
                      : result.percentage >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(result.percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">
                {result.total_score.toFixed(1)} / {result.max_possible_score.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}

        <Link
          to={`/submissions/${submission.id}/results`}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
          title="View results"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
