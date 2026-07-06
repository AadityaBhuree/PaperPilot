import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  listDocuments,
  listExams,
  createSubmission,
  evaluateSubmission,
} from '../api/client';
import type {
  DocumentResponse,
  ExamResponse,
  EvaluateSubmissionResponse,
  EvaluationResponse,
} from '../api/types';
import { Skeleton } from '../components/Skeleton';

export default function Evaluation() {
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState('');
  const [examId, setExamId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'submitting' | 'evaluating' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<EvaluateSubmissionResponse | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    Promise.all([listDocuments(), listExams()]).then(([d, e]) => {
      setDocuments(d);
      setExams(e);
    }).finally(() => setInitialLoading(false));
  }, []);

  const handleEvaluate = async () => {
    if (!documentId || !examId) return;
    setLoading(true);
    setError('');
    setStep('submitting');

    try {
      // 1. Create submission
      const submission = await createSubmission({
        document_id: documentId,
        exam_id: examId,
        student_name: studentName.trim() || undefined,
      });

      // 2. Run evaluation
      setStep('evaluating');
      const evalResult = await evaluateSubmission(submission.id);
      setResult(evalResult);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setError(msg);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Line className="w-56 h-8" />
          <Skeleton.Line className="w-72" />
        </div>
        <Skeleton.Card />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evaluate Submission</h1>
          <p className="mt-1 text-gray-500">
            Run AI-powered evaluation on a student's answer sheet
          </p>
        </div>
      </div>

      {/* Evaluation form */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Document <span className="text-red-500">*</span>
            </label>
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Select a document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Select an exam...</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.total_marks} marks)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Student Name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Optional student identifier"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleEvaluate}
            disabled={!documentId || !examId || loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step === 'submitting' ? (
              'Creating submission...'
            ) : step === 'evaluating' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Evaluating with AI...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && step === 'done' && (
        <div className="space-y-6">
          {/* Score summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  {result.percentage.toFixed(0)}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {result.total_score} / {result.max_possible_score}
              </h2>
              <p className="text-gray-500 mt-1">Total Score</p>
            </div>
          </div>

          {/* Per-question results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h3>
            <div className="space-y-3">
              {result.evaluations.map((ev) => (
                <EvaluationCard key={ev.id} evaluation={ev} />
              ))}
            </div>
          </div>
        </div>
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
          <p className="text-sm text-gray-500">
            Question ID: {evaluation.question_id.slice(0, 8)}...
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Confidence: {(evaluation.confidence * 100).toFixed(0)}%
          </p>
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
