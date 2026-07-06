import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  CheckCircle,
  Target,
} from 'lucide-react';
import {
  getExam,
  addQuestion,
  setAnswerKey,
  addRubric,
} from '../api/client';
import type {
  ExamDetailResponse,
  QuestionDetailResponse,
} from '../api/types';
import { Skeleton } from '../components/Skeleton';

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Add question form
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qNum, setQNum] = useState(1);
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState(10);

  // Active question for adding answer key / rubric
  const [activeQ, setActiveQ] = useState<string | null>(null);

  useEffect(() => {
    if (id) getExam(id).then(setExam).finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    if (id) getExam(id).then(setExam);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !qText.trim()) return;
    await addQuestion(id, {
      question_number: qNum,
      question_text: qText.trim(),
      max_marks: qMarks,
    });
    setQText('');
    setQNum((n) => n + 1);
    setShowAddQuestion(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.DetailHeader />
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

        {/* Add question form */}
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

        {/* Question list */}
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
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
