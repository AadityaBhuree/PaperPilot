import axios from 'axios';
import type {
  AnswerKeyCreate,
  AnswerKeyResponse,
  BatchEvaluateResponse,
  DocumentResponse,
  ExamCreate,
  ExamDetailResponse,
  ExamResponse,
  ExamSummaryResponse,
  ExamUpdate,
  EvaluateSubmissionResponse,
  EvaluationSummaryResponse,
  LoginRequest,
  PaginatedResponse,
  QuestionCreate,
  QuestionDetailResponse,
  QuestionResponse,
  RegisterRequest,
  RubricCreate,
  RubricResponse,
  SubmissionCreate,
  SubmissionResponse,
  TokenResponse,
  UploadResponse,
  UserResponse,
} from './types';

export type { LoginRequest, RegisterRequest, TokenResponse, UserResponse };

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// --- Documents ---

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UploadResponse>('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listDocuments(page = 1, pageSize = 20): Promise<PaginatedResponse<DocumentResponse>> {
  const { data } = await api.get<PaginatedResponse<DocumentResponse>>('/documents/', { params: { page, pageSize } });
  return data;
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  const { data } = await api.get<DocumentResponse>(`/documents/${id}`);
  return data;
}

export async function processDocument(id: string) {
  const { data } = await api.post(`/documents/${id}/process`);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

// --- Exams ---

export async function createExam(body: ExamCreate): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>('/exams/', body);
  return data;
}

export async function listExams(page = 1, pageSize = 20): Promise<PaginatedResponse<ExamResponse>> {
  const { data } = await api.get<PaginatedResponse<ExamResponse>>('/exams/', { params: { page, pageSize } });
  return data;
}

export async function getExam(id: string): Promise<ExamDetailResponse> {
  const { data } = await api.get<ExamDetailResponse>(`/exams/${id}`);
  return data;
}

export async function updateExam(id: string, body: ExamUpdate): Promise<ExamResponse> {
  const { data } = await api.patch<ExamResponse>(`/exams/${id}`, body);
  return data;
}

export async function deleteExam(id: string): Promise<void> {
  await api.delete(`/exams/${id}`);
}

// --- Questions ---

export async function addQuestion(
  examId: string,
  body: QuestionCreate,
): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`/exams/${examId}/questions`, body);
  return data;
}

export async function listQuestions(examId: string): Promise<QuestionResponse[]> {
  const { data } = await api.get<QuestionResponse[]>(`/exams/${examId}/questions`);
  return data;
}

export async function getQuestion(
  examId: string,
  questionId: string,
): Promise<QuestionDetailResponse> {
  const { data } = await api.get<QuestionDetailResponse>(
    `/exams/${examId}/questions/${questionId}`,
  );
  return data;
}

// --- Answer Keys ---

export async function setAnswerKey(
  examId: string,
  questionId: string,
  body: AnswerKeyCreate,
): Promise<AnswerKeyResponse> {
  const { data } = await api.post<AnswerKeyResponse>(
    `/exams/${examId}/questions/${questionId}/answer-key`,
    body,
  );
  return data;
}

// --- Rubrics ---

export async function addRubric(
  examId: string,
  questionId: string,
  body: RubricCreate,
): Promise<RubricResponse> {
  const { data } = await api.post<RubricResponse>(
    `/exams/${examId}/questions/${questionId}/rubrics`,
    body,
  );
  return data;
}

export async function listRubrics(
  examId: string,
  questionId: string,
): Promise<RubricResponse[]> {
  const { data } = await api.get<RubricResponse[]>(
    `/exams/${examId}/questions/${questionId}/rubrics`,
  );
  return data;
}

// --- Submissions & Evaluation ---

export async function listSubmissionsForExam(examId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<SubmissionResponse>> {
  const { data } = await api.get<PaginatedResponse<SubmissionResponse>>(`/evaluation/exams/${examId}/submissions`, { params: { page, pageSize } });
  return data;
}

export async function createSubmission(body: SubmissionCreate): Promise<SubmissionResponse> {
  const { data } = await api.post<SubmissionResponse>('/evaluation/submissions', body);
  return data;
}

export async function getSubmission(id: string): Promise<SubmissionResponse> {
  const { data } = await api.get<SubmissionResponse>(`/evaluation/submissions/${id}`);
  return data;
}

export async function evaluateSubmission(
  submissionId: string,
): Promise<EvaluateSubmissionResponse> {
  const { data } = await api.post<EvaluateSubmissionResponse>(
    `/evaluation/submissions/${submissionId}/evaluate`,
  );
  return data;
}

export async function getEvaluationResults(
  submissionId: string,
): Promise<EvaluationSummaryResponse> {
  const { data } = await api.get<EvaluationSummaryResponse>(
    `/evaluation/submissions/${submissionId}/results`,
  );
  return data;
}

export async function getExamSummary(examId: string): Promise<ExamSummaryResponse> {
  const { data } = await api.get<ExamSummaryResponse>(
    `/evaluation/exams/${examId}/summary`,
  );
  return data;
}

export async function batchEvaluate(
  submissionIds: string[],
): Promise<BatchEvaluateResponse> {
  const { data } = await api.post<BatchEvaluateResponse>(
    '/evaluation/batch-evaluate',
    { submission_ids: submissionIds },
  );
  return data;
}

export async function listAllSubmissions(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<SubmissionResponse>> {
  const { data } = await api.get<PaginatedResponse<SubmissionResponse>>(
    `/evaluation/submissions?page=${page}&pageSize=${pageSize}`,
  );
  return data;
}
