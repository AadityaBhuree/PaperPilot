import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { getEvaluationResults, getSubmission, getExam } from '../api/client';
import type {
  EvaluationSummaryResponse,
  SubmissionResponse,
  ExamDetailResponse,
  EvaluationResponse,
} from '../api/types';
import { Skeleton } from '../components/Skeleton';

export default function SubmissionResults() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<EvaluationSummaryResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [exam, setExam] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submissionId) return;

    (async () => {
      try {
        const [res, sub] = await Promise.all([
          getEvaluationResults(submissionId),
          getSubmission(submissionId),
        ]);
        setResult(res);
        setSubmission(sub);

        if (sub) {
          try {
            const examData = await getExam(sub.exam_id);
            setExam(examData);
          } catch {
            // Exam fetch is best-effort
          }
        }
      } catch {
        setError('Failed to load submission results');
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Line className="w-56 h-8" />
          <Skeleton.Line className="w-72" />
        </div>
        <Skeleton.Card />
        <Skeleton.List count={3} />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{error || 'Submission not found'}</p>
        <Link to="/evaluations" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to evaluation history
        </Link>
      </div>
    );
  }

  const hasEvaluations = result.evaluations.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/evaluations')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {submission?.student_name || 'Anonymous'} — Results
          </h1>
          <p className="mt-1 text-gray-500">
            {exam?.title || 'Exam'} &middot;{' '}
            {submission?.submitted_at
              ? new Date(submission.submitted_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </p>
        </div>
      </div>

      {!hasEvaluations ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">This submission has not been evaluated yet.</p>
        </div>
      ) : (
        <>
          {/* Score summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                  result.percentage >= 70
                    ? 'bg-emerald-50'
                    : result.percentage >= 40
                      ? 'bg-amber-50'
                      : 'bg-red-50'
                }`}
              >
                <span
                  className={`text-4xl font-bold ${
                    result.percentage >= 70
                      ? 'text-emerald-600'
                      : result.percentage >= 40
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {result.percentage.toFixed(0)}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {result.total_score.toFixed(1)} / {result.max_possible_score.toFixed(1)}
              </h2>
              <p className="text-gray-500 mt-1">Total Score</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Score</span>
              <span className="text-sm text-gray-500">{result.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
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
          </div>

          {/* Per-question results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Question Details ({result.evaluations.length})
            </h3>
            <div className="space-y-3">
              {result.evaluations.map((ev) => (
                <EvaluationCard key={ev.id} evaluation={ev} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EvaluationCard({ evaluation }: { evaluation: EvaluationResponse }) {
  const [expanded, setExpanded] = useState(false);

  const scorePercent =
    evaluation.max_score > 0
      ? (evaluation.score / evaluation.max_score) * 100
      : 0;

  const scoreColor =
    scorePercent >= 80
      ? 'text-emerald-600 bg-emerald-50'
      : scorePercent >= 50
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-xl font-bold text-lg shrink-0 ${scoreColor}`}
        >
          {evaluation.score.toFixed(1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">Question</span>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500">
              Confidence: {(evaluation.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">{evaluation.feedback.slice(0, 100)}</p>
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          / {evaluation.max_score}
        </span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-6 bg-gray-50 space-y-4">
          {/* Extracted answer */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Extracted Answer
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {evaluation.extracted_answer || '(no answer detected)'}
              </p>
            </div>
          </div>

          {/* Overall feedback */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              AI Feedback
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {evaluation.feedback}
              </p>
            </div>
          </div>

          {/* Criterion scores */}
          {evaluation.criterion_scores.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rubric Breakdown
              </h4>
              <div className="space-y-2">
                {evaluation.criterion_scores.map((cs, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {cs.criterion}
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {cs.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{cs.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
