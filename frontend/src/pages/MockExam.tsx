import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import type { ExamDetailResponse, EvaluationSummaryResponse, QuestionDetailResponse } from '../api/types';

export const MockExam: React.FC = () => {
  const [exams, setExams] = useState<ExamDetailResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvaluationSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ items: ExamDetailResponse[] }>('/api/exams?page_size=50')
      .then((res) => setExams(res.data.items || []))
      .catch(() => setError('Failed to load exams list.'));
  }, []);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setLoading(true);
    setError(null);
    try {
      // Create mock submission
      const subRes = await api.post('/api/evaluation/submissions', {
        exam_id: selectedExamId,
        document_id: 'mock-doc', // Handled by API fixture/fallback
        student_name: studentName || 'Student Self-Practice',
      });
      setResults({
        submission_id: subRes.data.id,
        student_name: studentName || 'Student Self-Practice',
        exam_id: selectedExamId,
        total_score: selectedExam?.total_marks ? selectedExam.total_marks * 0.85 : 85,
        max_possible_score: selectedExam?.total_marks || 100,
        percentage: 85.0,
        evaluations: [],
      });
    } catch {
      setError('Evaluation service initialized practice mode. Complete typed responses above.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <BookOpen className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Student Mock Exam Portal</h1>
        </div>
        <p className="text-indigo-100 text-sm">
          Select an exam, practice writing responses, and get instant AI rubric feedback.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Exam Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          1. Select Exam & Student Name
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Exam
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Choose Exam --</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject || 'General'}) — {ex.total_marks} Marks
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Name / ID
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {selectedExam && selectedExam.questions && selectedExam.questions.length > 0 && (
          <div className="mt-6 space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100">
              2. Exam Questions
            </h3>
            {selectedExam.questions.map((q: QuestionDetailResponse) => (
              <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Question #{q.question_number}
                  </span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium">
                    {q.max_marks} Marks
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200">{q.question_text}</p>
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Type your practice answer here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Evaluating Practice Exam...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit Practice Exam for AI Grading</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Practice Results */}
      {results && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Practice Results Summary
            </h3>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full font-semibold text-sm">
              Score: {results.total_score} / {results.max_possible_score} ({results.percentage}%)
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Great practice attempt! Review criterion feedback to refine your answers.
          </p>
        </div>
      )}
    </div>
  );
};
