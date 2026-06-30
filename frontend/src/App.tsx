import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamForm from './pages/ExamForm';
import ExamDetail from './pages/ExamDetail';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Evaluation from './pages/Evaluation';
import MainframeLanding from './pages/MainframeLanding';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mainframe" element={<MainframeLanding />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exams" element={<ExamList />} />
          <Route path="/exams/new" element={<ExamForm />} />
          <Route path="/exams/:id" element={<ExamDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/evaluate" element={<Evaluation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
