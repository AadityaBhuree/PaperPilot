import { useCallback, useEffect, useState } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadDocument, processDocument, createSubmission, listExams, evaluateSubmission } from '../api/client';
import type { ExamResponse } from '../api/types';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState('');
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [step, setStep] = useState<'select' | 'uploading' | 'processing' | 'done' | 'error'>('select');
  const [error, setError] = useState('');

  // Load exams on mount
  useEffect(() => {
    listExams().then(setExams);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !examId) return;

    setStep('uploading');
    setError('');

    try {
      // 1. Upload the document
      const uploadResult = await uploadDocument(file);

      // 2. Create a submission
      const submission = await createSubmission({
        document_id: uploadResult.document_id,
        exam_id: examId,
        student_name: studentName.trim() || undefined,
      });

      // 3. Trigger OCR processing
      setStep('processing');
      await processDocument(uploadResult.document_id);

      // 4. Run evaluation on the existing submission
      await evaluateSubmission(submission.id);

      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setStep('error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Answer Sheet</h1>
        <p className="mt-1 text-gray-500">
          Upload a student's answer sheet for AI-powered evaluation
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        {['Select', 'Upload', 'Process', 'Done'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'done'
                  ? 'bg-emerald-600 text-white'
                  : (step === 'uploading' && i <= 1) ||
                    (step === 'processing' && i <= 2)
                    ? 'bg-indigo-600 text-white'
                    : i === 0 && step === 'select'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-gray-600">{label}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Success message */}
        {step === 'done' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Document uploaded and processed successfully! Go to the{' '}
            <a href="/evaluate" className="font-semibold underline">Evaluate page</a>{' '}
            to run AI evaluation.
          </div>
        )}

        {/* Exam selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Exam <span className="text-red-500">*</span>
          </label>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Choose an exam...</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.total_marks} marks)
              </option>
            ))}
          </select>
        </div>

        {/* Student name */}
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

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? 'border-indigo-400 bg-indigo-50'
              : file
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadIcon className="w-12 h-12 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  Drop your answer sheet here
                </p>
                <p className="text-sm text-gray-500">
                  PDF, JPG, JPEG, or PNG — max 20 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!file || !examId || step !== 'select'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
            {step === 'uploading'
              ? 'Uploading...'
              : step === 'processing'
                ? 'Processing OCR...'
                : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  );
}
