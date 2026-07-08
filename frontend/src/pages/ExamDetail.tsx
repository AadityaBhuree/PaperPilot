import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  CheckCircle,
  Target,
  Users,
  BarChart3,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  getExam,
  addQuestion,
  setAnswerKey,
  addRubric,
  listSubmissionsForExam,
  evaluateSubmission,
  getEvaluationResults,
} from '../api/client';
import type {
  ExamDetailResponse,
  QuestionDetailResponse,
  SubmissionResponse,
  EvaluationSummaryResponse,
} from '../api/types';
import { Skeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';

type Tab = 'details' | 'submissions' | 'summary';

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  useEffect(() => {
    if (id) getExam(id).then(setExam).finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    if (id) getExam(id).then(setExam);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.DetailHeader />
        <div className="flex gap-2">
          <Skeleton.Block className="w-24 h-10 rounded-lg" />
          <Skeleton.Block className="w-28 h-10 rounded-lg" />
          <Skeleton.Block className="w-24 h-10 rounded-lg" />
        </div>
        <Skeleton.Block className="w-full h-20 rounded-xl" />
        <Skeleton.List count={3} />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Exam not found.</p>
        <Link to="/exams" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to exams
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'details', label: 'Details', icon: BookOpen },
    { key: 'submissions', label: 'Submissions', icon: Users },
    { key: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/exams')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            {exam.subject && <span>{exam.subject}</span>}
            <span>{exam.total_marks} total marks</span>
            <span>{exam.questions.length} questions</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <ExamDetailsTab exam={exam} onRefresh={refresh} />
      )}
      {activeTab === 'submissions' && (
        <ExamSubmissionsTab examId={exam.id} />
      )}
      {activeTab === 'summary' && (
        <ExamSummaryTab examId={exam.id} examTitle={exam.title} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details Tab (existing content)
// ---------------------------------------------------------------------------

function ExamDetailsTab({
  exam,
  onRefresh,
}: {
  exam: ExamDetailResponse;
  onRefresh: () => void;
}) {
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qNum, setQNum] = useState(
    exam.questions.length > 0
      ? Math.max(...exam.questions.map((q) => q.question_number)) + 1
      : 1,
  );
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState(10);
  const [activeQ, setActiveQ] = useState<string | null>(null);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    await addQuestion(exam.id, {
      question_number: qNum,
      question_text: qText.trim(),
      max_marks: qMarks,
    });
    setQText('');
    setQNum((n) => n + 1);
    setShowAddQuestion(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {exam.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-600">{exam.description}</p>
        </div>
      )}

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          <button
            onClick={() => setShowAddQuestion(!showAddQuestion)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {showAddQuestion && (
          <form
            onSubmit={handleAddQuestion}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-4 space-y-4"
          >
            <div className="grid grid-cols-[100px_1fr_120px] gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">#</label>
                <input
                  type="number"
                  value={qNum}
                  onChange={(e) => setQNum(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Question Text</label>
                <input
                  type="text"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Explain the fundamental theorem of calculus"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Marks</label>
                <input
                  type="number"
                  value={qMarks}
                  onChange={(e) => setQMarks(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddQuestion(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {exam.questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No questions yet. Add your first question above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exam.questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                examId={exam.id}
                isActive={activeQ === q.id}
                onToggle={() => setActiveQ(activeQ === q.id ? null : q.id)}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submissions Tab with Batch Evaluation + Progress Bars
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

function ExamSubmissionsTab({
  examId,
}: {
  examId: string;
}) {
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [results, setResults] = useState<Record<string, EvaluationSummaryResponse>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [evaluating, setEvaluating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState<
    { submissionId: string; status: 'pending' | 'evaluating' | 'completed' | 'failed'; percentage?: number }[]
  >([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSubmissionsForExam(examId, page, PAGE_SIZE);
      setSubmissions(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);

      // Load existing results for the current page
      const resultMap: Record<string, EvaluationSummaryResponse> = {};
      await Promise.all(
        data.items.map(async (sub) => {
          try {
            const res = await getEvaluationResults(sub.id);
            if (res.evaluations.length > 0) {
              resultMap[sub.id] = res;
            }
          } catch {
            // No results yet
          }
        }),
      );
      setResults(resultMap);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [examId, page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Reset selections when page changes
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unevaluated = submissions.filter((s) => !results[s.id]);
    if (selected.size === unevaluated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unevaluated.map((s) => s.id)));
    }
  };

  const handleBatchEvaluate = async () => {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    setEvaluating(true);
    setBatchResults(
      ids.map((id) => ({ submissionId: id, status: 'pending' as const })),
    );

    for (let i = 0; i < ids.length; i++) {
      const sid = ids[i];
      setProgress({ current: i + 1, total: ids.length });
      setBatchResults((prev) =>
        prev.map((r) =>
          r.submissionId === sid ? { ...r, status: 'evaluating' as const } : r,
        ),
      );

      try {
        const evalResp = await evaluateSubmission(sid);
        if (evalResp.status === 'completed') {
          setBatchResults((prev) =>
            prev.map((r) =>
              r.submissionId === sid
                ? { ...r, status: 'completed' as const, percentage: evalResp.percentage }
                : r,
            ),
          );
        } else {
          setBatchResults((prev) =>
            prev.map((r) =>
              r.submissionId === sid ? { ...r, status: 'failed' as const } : r,
            ),
          );
        }
      } catch {
        setBatchResults((prev) =>
          prev.map((r) =>
            r.submissionId === sid ? { ...r, status: 'failed' as const } : r,
          ),
        );
      }
    }

    // Refresh results
    await loadSubmissions();
    setSelected(new Set());
    setEvaluating(false);
  };

  const unevaluatedCount = submissions.filter((s) => !results[s.id]).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.List count={3} />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No submissions for this exam yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload a document and link it to this exam to create a submission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            {unevaluatedCount > 0 && (
              <span className="text-amber-600 ml-1">
                ({unevaluatedCount} unevaluated)
              </span>
            )}
          </span>
          <button
            onClick={loadSubmissions}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && !evaluating && (
            <span className="text-sm text-gray-500">{selected.size} selected</span>
          )}
          <button
            onClick={handleBatchEvaluate}
            disabled={selected.size === 0 || evaluating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {evaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating {progress.current}/{progress.total}...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Evaluate Selected ({selected.size})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar during batch evaluation */}
      {evaluating && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Batch Evaluation Progress</span>
            <span className="text-gray-500">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {/* Individual submission statuses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {batchResults.map((br) => (
              <div
                key={br.submissionId}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-50"
              >
                {br.status === 'pending' && (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                )}
                {br.status === 'evaluating' && (
                  <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                )}
                {br.status === 'completed' && (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                )}
                {br.status === 'failed' && (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
                <span className="text-gray-600 truncate">
                  {br.submissionId.slice(0, 8)}...
                </span>
                {br.percentage !== undefined && (
                  <span className="text-gray-400 ml-auto">{br.percentage.toFixed(0)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select all toggle */}
      {unevaluatedCount > 0 && !evaluating && (
        <button
          onClick={toggleSelectAll}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {selected.size === unevaluatedCount ? (
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Select all unevaluated ({unevaluatedCount})
        </button>
      )}

      {/* Submissions list */}
      <div className="space-y-2">
        {submissions.map((sub) => {
          const result = results[sub.id];
          return (
            <SubmissionRow
              key={sub.id}
              submission={sub}
              result={result}
              selected={selected.has(sub.id)}
              evaluating={evaluating}
              onToggle={() => toggleSelect(sub.id)}
            />
          );
        })}
      </div>

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

function SubmissionRow({
  submission,
  result,
  selected,
  evaluating,
  onToggle,
}: {
  submission: SubmissionResponse;
  result?: EvaluationSummaryResponse;
  selected: boolean;
  evaluating: boolean;
  onToggle: () => void;
}) {
  const isEvaluated = !!result;
  const scoreColor =
    isEvaluated
      ? result.percentage >= 70
        ? 'text-emerald-600 bg-emerald-50'
        : result.percentage >= 40
          ? 'text-amber-600 bg-amber-50'
          : 'text-red-600 bg-red-50'
      : 'bg-gray-50 text-gray-400';

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${
        selected ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-200'
      } p-4`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        {!isEvaluated && !evaluating && (
          <button
            onClick={onToggle}
            className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {selected ? (
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Score badge */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm shrink-0 ${scoreColor}`}
        >
          {isEvaluated ? result.percentage.toFixed(0) : '—'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {submission.student_name || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(submission.submitted_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Score bar */}
        {isEvaluated && (
          <div className="hidden sm:flex items-center gap-2">
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
            <span className="text-xs text-gray-500 w-14 text-right">
              {result.total_score.toFixed(1)} / {result.max_possible_score.toFixed(1)}
            </span>
          </div>
        )}

        {/* Status badge */}
        {isEvaluated && (
          <Link
            to={`/submissions/${submission.id}/results`}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
            title="View results"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <ArrowLeft className={className} style={{ transform: 'rotate(180deg)' }} />
);

// ---------------------------------------------------------------------------
// Summary Tab
// ---------------------------------------------------------------------------

function ExamSummaryTab({
  examId,
  examTitle,
}: {
  examId: string;
  examTitle: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Exam Summary Report</h3>
      <p className="text-gray-500 mb-6">
        View a comprehensive summary of all evaluated submissions for &ldquo;{examTitle}&rdquo;,
        including average scores, per-question breakdowns, and statistics.
      </p>
      <Link
        to={`/exams/${examId}/summary`}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        <BarChart3 className="w-4 h-4" />
        View Full Summary
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

function QuestionCard({
  question,
  examId,
  isActive,
  onToggle,
  onRefresh,
}: {
  question: QuestionDetailResponse;
  examId: string;
  isActive: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [refAnswer, setRefAnswer] = useState('');
  const [keyConcepts, setKeyConcepts] = useState('');

  // Rubric form
  const [rubricCriterion, setRubricCriterion] = useState('');
  const [rubricDesc, setRubricDesc] = useState('');
  const [rubricScore, setRubricScore] = useState(5);
  const [rubricWeight, setRubricWeight] = useState(1);

  const handleSaveAnswerKey = async () => {
    if (!refAnswer.trim()) return;
    await setAnswerKey(examId, question.id, {
      reference_answer: refAnswer.trim(),
      key_concepts: keyConcepts.trim() || undefined,
    });
    onRefresh();
  };

  const handleAddRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubricCriterion.trim() || !rubricDesc.trim()) return;
    await addRubric(examId, question.id, {
      criterion: rubricCriterion.trim(),
      description: rubricDesc.trim(),
      max_score: rubricScore,
      weight: rubricWeight,
    });
    setRubricCriterion('');
    setRubricDesc('');
    setRubricScore(5);
    setRubricWeight(1);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Question header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm shrink-0">
          Q{question.question_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{question.question_text}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-500">{question.max_marks} marks</span>
          {question.answer_key && (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          )}
          {question.rubrics.length > 0 && (
            <Target className="w-5 h-5 text-amber-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="border-t border-gray-100 p-6 space-y-6 bg-gray-50">
          {/* Answer Key */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Reference Answer</h4>
            {question.answer_key ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {question.answer_key.reference_answer}
                </p>
                {question.answer_key.key_concepts && (
                  <p className="text-xs text-gray-500 mt-2">
                    Key concepts: {question.answer_key.key_concepts}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                <textarea
                  value={refAnswer}
                  onChange={(e) => setRefAnswer(e.target.value)}
                  placeholder="Enter the reference/correct answer..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
                <input
                  type="text"
                  value={keyConcepts}
                  onChange={(e) => setKeyConcepts(e.target.value)}
                  placeholder="Key concepts (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleSaveAnswerKey}
                  disabled={!refAnswer.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Save Answer Key
                </button>
              </div>
            )}
          </div>

          {/* Rubrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Grading Rubric ({question.rubrics.length} criteria)
            </h4>
            {question.rubrics.length > 0 && (
              <div className="space-y-2 mb-4">
                {question.rubrics.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{r.criterion}</span>
                      <span className="text-xs text-gray-500 ml-2">— {r.description}</span>
                    </div>
                    <span className="text-sm text-gray-500 shrink-0">
                      {r.max_score} pts (x{r.weight})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add rubric form */}
            <form onSubmit={handleAddRubric} className="bg-white border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <input
                  type="text"
                  value={rubricCriterion}
                  onChange={(e) => setRubricCriterion(e.target.value)}
                  placeholder="Criterion name (e.g. Content Accuracy)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="number"
                  value={rubricScore}
                  onChange={(e) => setRubricScore(Number(e.target.value))}
                  min={0.5}
                  step={0.5}
                  placeholder="Max score"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={rubricDesc}
                  onChange={(e) => setRubricDesc(e.target.value)}
                  placeholder="Description (e.g. Correctly identifies core concepts)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="number"
                  value={rubricWeight}
                  onChange={(e) => setRubricWeight(Number(e.target.value))}
                  min={0.1}
                  step={0.1}
                  placeholder="Weight"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
