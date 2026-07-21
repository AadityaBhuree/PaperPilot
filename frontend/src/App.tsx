import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamForm from './pages/ExamForm';
import ExamDetail from './pages/ExamDetail';
import ExamSummary from './pages/ExamSummary';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Evaluation from './pages/Evaluation';
import EvaluationHistory from './pages/EvaluationHistory';
import SubmissionResults from './pages/SubmissionResults';
import Login from './pages/Login';
import Register from './pages/Register';
import { MockExam } from './pages/MockExam';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App routes (with sidebar + auth guard) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/exams" element={<ExamList />} />
              <Route path="/exams/new" element={<ExamForm />} />
              <Route path="/exams/:id" element={<ExamDetail />} />
              <Route path="/exams/:id/summary" element={<ExamSummary />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/evaluate" element={<Evaluation />} />
              <Route path="/evaluations" element={<EvaluationHistory />} />
              <Route path="/submissions/:submissionId/results" element={<SubmissionResults />} />
              <Route path="/mock-exam" element={<MockExam />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
