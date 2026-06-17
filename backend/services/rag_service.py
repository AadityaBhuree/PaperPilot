"""RAG service for reference answer retrieval using FAISS + sentence-transformers."""

import logging
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

# Module-level singletons — initialized lazily.
_embeddings: HuggingFaceEmbeddings | None = None
_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
_INDEX_DIR = Path("faiss_index")


def _get_embeddings() -> HuggingFaceEmbeddings:
    """Return the shared embedding model, creating it on first call."""
    global _embeddings  # noqa: PLW0603
    if _embeddings is None:
        logger.info("Initializing HuggingFace embeddings (%s)", _EMBEDDING_MODEL)
        _embeddings = HuggingFaceEmbeddings(model_name=_EMBEDDING_MODEL)
    return _embeddings


def build_vector_store(
    answer_keys: list[dict[str, str]],
) -> FAISS:
    """Build a FAISS vector store from a list of answer keys.

    Args:
        answer_keys: List of dicts with keys:
            - question_id: unique identifier
            - question_text: the question
            - reference_answer: the correct answer
            - key_concepts: optional comma-separated concepts

    Returns:
        Populated FAISS vector store.
    """
    embeddings = _get_embeddings()

    documents: list[Document] = []
    for ak in answer_keys:
        # Combine question + reference answer for better retrieval
        content = (
            f"Question: {ak['question_text']}\n"
            f"Reference Answer: {ak['reference_answer']}"
        )
        if ak.get("key_concepts"):
            content += f"\nKey Concepts: {ak['key_concepts']}"

        documents.append(
            Document(
                page_content=content,
                metadata={
                    "question_id": ak["question_id"],
                    "question_text": ak["question_text"],
                },
            )
        )

    if not documents:
        logger.warning("No answer keys provided — returning empty vector store")
        # FAISS needs at least one document; return a minimal store
        return FAISS.from_documents(
            [Document(page_content="placeholder", metadata={})],
            embeddings,
        )

    logger.info("Building FAISS index with %d documents", len(documents))
    vector_store = FAISS.from_documents(documents, embeddings)

    # Persist to disk
    _INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(_INDEX_DIR))
    logger.info("FAISS index saved to %s", _INDEX_DIR)

    return vector_store


def retrieve_references(
    query: str,
    vector_store: FAISS | None = None,
    k: int = 3,
) -> list[dict[str, str]]:
    """Retrieve the most relevant reference answers for a query.

    Args:
        query: The student answer text to find references for.
        vector_store: Optional pre-built store. If None, loads from disk.
        k: Number of results to return.

    Returns:
        List of dicts with keys: question_id, question_text, reference_text, score.
    """
    if vector_store is None:
        vector_store = _load_vector_store()
        if vector_store is None:
            logger.warning("No vector store available — returning empty results")
            return []

    results = vector_store.similarity_search_with_score(query, k=k)

    references: list[dict[str, str]] = []
    for doc, score in results:
        references.append(
            {
                "question_id": doc.metadata.get("question_id", ""),
                "question_text": doc.metadata.get("question_text", ""),
                "reference_text": doc.page_content,
                "score": float(score),
            }
        )

    logger.info("Retrieved %d references for query (%d chars)", len(references), len(query))
    return references


def _load_vector_store() -> FAISS | None:
    """Load the FAISS index from disk if it exists."""
    index_path = _INDEX_DIR / "index.faiss"
    if not index_path.exists():
        return None

    embeddings = _get_embeddings()
    logger.info("Loading FAISS index from %s", _INDEX_DIR)
    return FAISS.load_local(str(_INDEX_DIR), embeddings, allow_dangerous_deserialization=True)
