import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { listExams, listDocuments } from '../api/client';
import type { ExamResponse, DocumentResponse } from '../api/types';

export default function Dashboard() {
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listExams(), listDocuments()])
      .then(([e, d]) => {
        setExams(e);
        setDocuments(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedDocs = documents.filter((d) => d.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome to PaperPilot — AI-powered exam evaluation
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={ClipboardCheck}
          label="Total Exams"
          value={exams.length}
          color="indigo"
        />
        <StatCard
          icon={FileText}
          label="Documents Uploaded"
          value={documents.length}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Completed OCR"
          value={completedDocs}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-4">
        <Link
          to="/exams/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </Link>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Upload Document
        </Link>
      </div>

      {/* Recent exams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Exams</h2>
          <Link
            to="/exams"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No exams yet. Create your first exam to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.slice(0, 5).map((exam) => (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {exam.subject || 'No subject'} · {exam.total_marks} marks
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
