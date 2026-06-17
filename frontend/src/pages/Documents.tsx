import { useEffect, useState } from 'react';
import { FileText, Trash2, RefreshCw, Eye } from 'lucide-react';
import { listDocuments, deleteDocument, processDocument } from '../api/client';
import type { DocumentResponse, DocumentStatus } from '../api/types';

const statusColors: Record<DocumentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export default function Documents() {
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    listDocuments().then(setDocs).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and its OCR results?')) return;
    await deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleProcess = async (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'processing' as const } : d)),
    );
    try {
      await processDocument(id);
      // Refresh the document
      const updated = await listDocuments();
      setDocs(updated);
    } catch {
      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'failed' as const } : d)),
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-gray-500">Uploaded answer sheets and their OCR status</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No documents yet</h3>
          <p className="text-gray-500">Upload your first answer sheet to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="p-3 bg-gray-100 rounded-lg shrink-0">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.original_filename}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{formatSize(doc.file_size)}</span>
                    <span>·</span>
                    <span>{doc.file_type.toUpperCase()}</span>
                    <span>·</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[doc.status]}`}>
                  {doc.status}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.status === 'pending' && (
                    <button
                      onClick={() => handleProcess(doc.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Run OCR"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View OCR results"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded OCR results */}
              {expandedId === doc.id && doc.ocr_results.length > 0 && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-3">
                  {doc.ocr_results.map((r) => (
                    <div key={r.page_number} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Page {r.page_number}
                        </span>
                        <span className="text-xs text-gray-400">
                          Confidence: {(r.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {r.extracted_text || '(no text extracted)'}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              {expandedId === doc.id && doc.ocr_results.length === 0 && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 text-center text-sm text-gray-500">
                  No OCR results yet. Click the refresh button to process.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
