/* ------------------------------------------------------------------ */
/* TypeScript types matching the PaperPilot backend Pydantic schemas  */
/* ------------------------------------------------------------------ */

// --- Documents ---

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OCRResultResponse {
  page_number: number;
  extracted_text: string;
  confidence: number;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  message: string;
}

export interface DocumentResponse {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_at: string;
  ocr_results: OCRResultResponse[];
}

export interface OCRResponse {
  document_id: string;
  status: DocumentStatus;
  results: OCRResultResponse[];
}

// --- Exams ---

export interface ExamCreate {
  title: string;
  description?: string;
  subject?: string;
  total_marks: number;
}

export interface ExamUpdate {
  title?: string;
  description?: string;
  subject?: string;
  total_marks?: number;
}

export interface ExamResponse {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  total_marks: number;
  created_at: string;
}

// --- Questions ---

export interface QuestionCreate {
  question_number: number;
  question_text: string;
  max_marks: number;
}

export interface QuestionResponse {
  id: string;
  exam_id: string;
  question_number: number;
  question_text: string;
  max_marks: number;
}

export interface AnswerKeyResponse {
  id: number;
  question_id: string;
  reference_answer: string;
  key_concepts: string | null;
}

export interface RubricResponse {
  id: number;
  question_id: string;
  criterion: string;
  description: string;
  max_score: number;
  weight: number;
}

export interface QuestionDetailResponse extends QuestionResponse {
  answer_key: AnswerKeyResponse | null;
  rubrics: RubricResponse[];
}

export interface ExamDetailResponse extends ExamResponse {
  questions: QuestionDetailResponse[];
}

// --- Answer Keys ---

export interface AnswerKeyCreate {
  reference_answer: string;
  key_concepts?: string;
}

// --- Rubrics ---

export interface RubricCreate {
  criterion: string;
  description: string;
  max_score: number;
  weight?: number;
}

// --- Submissions & Evaluation ---

export interface SubmissionCreate {
  document_id: string;
  exam_id: string;
  student_name?: string;
}

export interface SubmissionResponse {
  id: string;
  document_id: string;
  exam_id: string;
  student_name: string | null;
  submitted_at: string;
}

export interface CriterionScoreResponse {
  criterion: string;
  score: number;
  feedback: string;
}

export interface EvaluationResponse {
  id: number;
  submission_id: string;
  question_id: string;
  extracted_answer: string;
  score: number;
  max_score: number;
  feedback: string;
  criterion_scores: CriterionScoreResponse[];
  confidence: number;
  evaluated_at: string;
}

export interface EvaluateSubmissionResponse {
  submission_id: string;
  status: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  evaluations: EvaluationResponse[];
  message: string;
}

export interface EvaluationSummaryResponse {
  submission_id: string;
  student_name: string | null;
  exam_id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  evaluations: EvaluationResponse[];
}

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

// --- Exam Summary ---

export interface QuestionSummary {
  question_id: string;
  question_number: number;
  question_text: string;
  max_marks: number;
  average_score: number;
  average_percentage: number;
  submissions_answered: number;
  submissions_skipped: number;
}

export interface ExamSummaryResponse {
  exam_id: string;
  exam_title: string;
  total_submissions: number;
  average_score: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  highest_percentage: number;
  lowest_percentage: number;
  total_marks: number;
  per_question_summary: QuestionSummary[];
}

// --- Batch Evaluation ---

export interface BatchSubmissionResult {
  submission_id: string;
  student_name: string | null;
  status: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  error: string | null;
}

export interface BatchEvaluateResponse {
  total_submissions: number;
  successful: number;
  failed: number;
  results: BatchSubmissionResult[];
  message: string;
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
