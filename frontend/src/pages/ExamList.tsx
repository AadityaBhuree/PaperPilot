import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, ClipboardCheck } from 'lucide-react';
import { listExams, deleteExam } from '../api/client';
import type { ExamResponse } from '../api/types';
import { Skeleton } from '../components/Skeleton';

export default function ExamList() {
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listExams().then(setExams).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam and all its questions?')) return;
    await deleteExam(id);
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton.Line className="w-32 h-8" />
            <Skeleton.Line className="w-48" />
          </div>
          <Skeleton.Block className="w-28 h-10 rounded-lg" />
        </div>
        <Skeleton.List count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
          <p className="mt-1 text-gray-500">Manage exams, questions, and rubrics</p>
        </div>
        <button
          onClick={() => navigate('/exams/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No exams yet</h3>
          <p className="text-gray-500 mb-6">Create your first exam to start adding questions.</p>
          <button
            onClick={() => navigate('/exams/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <Link to={`/exams/${exam.id}`} className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {exam.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {exam.subject && <span>📚 {exam.subject}</span>}
                    <span>📝 {exam.total_marks} marks</span>
                    <span>🕐 {new Date(exam.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/exams/${exam.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
