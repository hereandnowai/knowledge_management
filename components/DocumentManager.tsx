
import React, { useState, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { Document, DocumentType, FAQ, Language, UI_TRANSLATIONS } from '../types';
import Button from './common/Button';
import Modal from './common/Modal';
import { generateJson, isAIServiceAvailable, generateText } from '../services/geminiService'; // Added generateText
import LoadingSpinner from './common/LoadingSpinner';
import { PlusCircleIcon, HeartIconSolid, HeartIconOutline, PDF_ICON_SVG, WORD_ICON_SVG, EXCEL_ICON_SVG, TEXT_ICON_SVG, UNKNOWN_ICON_SVG, URL_ICON_SVG, YOUTUBE_ICON_SVG, LightBulbIcon } from '../constants';

interface DocumentManagerProps {
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id' | 'uploadedAt' | 'isFavorite' | 'generatedFaqs'>) => void;
  updateDocument: (doc: Document) => void;
  title?: string; 
  showOnlyFavorites?: boolean;
  currentLanguage: Language;
  initialOpenAddModal?: boolean; // New prop to trigger modal opening
  onModalHandled?: () => void; // New prop to signal modal has been handled
}

const getFileIcon = (type: DocumentType, className?: string) => {
  const props = { className: className || "w-8 h-8" };
  switch (type) {
    case DocumentType.PDF: return <PDF_ICON_SVG {...props} />;
    case DocumentType.WORD: return <WORD_ICON_SVG {...props} />;
    case DocumentType.EXCEL: return <EXCEL_ICON_SVG {...props} />;
    case DocumentType.TEXT: return <TEXT_ICON_SVG {...props} />;
    case DocumentType.URL: return <URL_ICON_SVG {...props} />;
    case DocumentType.YOUTUBE_LINK: return <YOUTUBE_ICON_SVG {...props} />;
    default: return <UNKNOWN_ICON_SVG {...props} />;
  }
};

interface DocumentFormState {
  name: string;
  type: DocumentType;
  tags: string; // Comma-separated
  contentSnippet: string;
  fullContent?: string;
  sourceUrl?: string;
}

const initialFormState: DocumentFormState = {
  name: '',
  type: DocumentType.TEXT,
  tags: '',
  contentSnippet: '',
  fullContent: '',
  sourceUrl: ''
};

const DocumentCard: React.FC<{ document: Document; onPreview: (doc: Document) => void; onToggleFavorite: (docId: string) => void; }> = ({ document, onPreview, onToggleFavorite }) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-xl flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 min-w-0">
                 {getFileIcon(document.type, "w-10 h-10 text-hnai-teal-500 dark:text-hnai-teal-400 flex-shrink-0")}
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate" title={document.name}>{document.name}</h3>
            </div>
            <button onClick={() => onToggleFavorite(document.id)} className="text-slate-400 hover:text-hnai-gold-500 dark:hover:text-hnai-gold-400 flex-shrink-0 ml-2">
                {document.isFavorite ? <HeartIconSolid className="w-6 h-6 text-hnai-gold-500" /> : <HeartIconOutline className="w-6 h-6" />}
            </button>
        </div>
        {document.sourceUrl && (
            <p className="text-xs text-hnai-teal-600 dark:text-hnai-teal-400 mt-1 truncate">
                <a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {document.sourceUrl}
                </a>
            </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 h-16 overflow-hidden">
          {document.contentSnippet.substring(0, 100)}{document.contentSnippet.length > 100 && '...'}
        </p>
        <div className="mt-3">
          {document.tags.slice(0, 3).map(tag => (
            <span key={tag} className="mr-2 mb-2 inline-block bg-hnai-teal-100 dark:bg-hnai-teal-800 text-hnai-teal-700 dark:text-hnai-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="mr-2 mb-2 inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              +{document.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-t dark:border-slate-600/50">
        <Button variant="ghost" size="sm" onClick={() => onPreview(document)}>
          View Details
        </Button>
      </div>
    </div>
  );
};

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
    documents, 
    addDocument, 
    updateDocument, 
    title, 
    showOnlyFavorites = false,
    currentLanguage,
    initialOpenAddModal = false,
    onModalHandled
 }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [formState, setFormState] = useState<DocumentFormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | ''>('');
  const [filterTag, setFilterTag] = useState('');
  const [showFavoritesFilter, setShowFavoritesFilter] = useState(false); 
  
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [generatedFaqs, setGeneratedFaqs] = useState<FAQ[] | null>(null);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[currentLanguage]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
  }, [currentLanguage]);

  const defaultTitle = t('document_hub_title');

  useEffect(() => {
    if (initialOpenAddModal) {
      setIsUploadModalOpen(true);
      onModalHandled?.(); 
    }
  }, [initialOpenAddModal, onModalHandled]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormState(prev => ({
        ...prev,
        name: file.name,
        type: getDocumentTypeFromFile(file),
      }));
    }
  };

  const getDocumentTypeFromFile = (file: File): DocumentType => {
    if (file.type.includes('pdf')) return DocumentType.PDF;
    if (file.type.includes('word') || file.type.includes('officedocument.wordprocessingml')) return DocumentType.WORD;
    if (file.type.includes('excel') || file.type.includes('officedocument.spreadsheetml')) return DocumentType.EXCEL;
    if (file.type.startsWith('text/')) return DocumentType.TEXT;
    return DocumentType.UNKNOWN;
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDocument({
      ...formState,
      tags: formState.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });
    setFormState(initialFormState);
    setIsUploadModalOpen(false);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.contentSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (doc.sourceUrl && doc.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType ? doc.type === filterType : true;
      const matchesTag = filterTag ? doc.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase()) : true;
      const favoriteCondition = showOnlyFavorites ? doc.isFavorite : (showFavoritesFilter ? doc.isFavorite : true);
      return matchesSearch && matchesType && matchesTag && favoriteCondition;
    });
  }, [documents, searchTerm, filterType, filterTag, showFavoritesFilter, showOnlyFavorites]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    documents.forEach(doc => doc.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort((a,b) => a.localeCompare(b));
  }, [documents]);

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
    setGeneratedSummary(null); 
    setGeneratedFaqs(doc.generatedFaqs || null);
  };

  const handleGenerateSummary = async () => {
    if (!previewDoc || !previewDoc.fullContent || !isAIServiceAvailable()) return;
    setIsSummarizing(true);
    setGeneratedSummary(null);
    try {
      const prompt = `Summarize the following document content in about 3-5 key bullet points. Document Name: ${previewDoc.name}\n\n---\n${previewDoc.fullContent}\n\n---\nSummary (as JSON: {"summary_points": ["Point 1", "Point 2", ...]}):`;
      const result = await generateJson<{ summary_points: string[] }>(prompt);
      if (result && result.summary_points && Array.isArray(result.summary_points)) {
        setGeneratedSummary(result.summary_points.map(p => `• ${p}`).join('\n'));
      } else {
         const plainSummaryPrompt = `Summarize this text concisely: ${previewDoc.fullContent}`; 
         const plainSummary = await generateText(plainSummaryPrompt); // Use generateText for plain fallback
         setGeneratedSummary(plainSummary || "Could not generate a structured summary. Please check content or try a plain summary.");
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setGeneratedSummary(`Error generating summary. ${error instanceof Error ? error.message : "The AI might have returned an unexpected format or an error occurred."}`);
    }
    setIsSummarizing(false);
  };

  const handleSuggestTags = async () => {
    if (!formState.fullContent || !isAIServiceAvailable()) {
        alert("Full content is required to suggest tags. AI service must be available.");
        return;
    }
    setIsSuggestingTags(true);
    try {
        const prompt = `Analyze the following document content and suggest 3-5 relevant keyword tags. Return the tags as a JSON array of strings (e.g., ["tag1", "tag2", "tag3"]). Content:\n\n---\n${formState.fullContent}\n\n---\nSuggested Tags:`;
        const result = await generateJson<string[]>(prompt);
        if (result && Array.isArray(result)) {
            setFormState(prev => ({ ...prev, tags: result.join(', ') }));
        } else {
            alert("Could not suggest tags. AI response was not in the expected format.");
        }
    } catch (error) {
        console.error("Failed to suggest tags:", error);
        alert(`Error suggesting tags: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    setIsSuggestingTags(false);
  };
  
  const handleGenerateFaqs = async () => {
    if (!previewDoc || !previewDoc.fullContent || !isAIServiceAvailable()) return;
    setIsGeneratingFaqs(true);
    setGeneratedFaqs(null);
    try {
        const prompt = `Based on the following document content, generate 2-3 frequently asked questions (FAQs) and their answers. Return as a JSON array of objects, where each object has a 'question' (string) and 'answer' (string) field. Content:\n\n---\n${previewDoc.fullContent}\n\n---\nFAQs:`;
        const result = await generateJson<FAQ[]>(prompt);
        if (result && Array.isArray(result) && result.every(faq => faq.question && faq.answer)) {
            setGeneratedFaqs(result);
            updateDocument({ ...previewDoc, generatedFaqs: result });
        } else {
            setGeneratedFaqs([{ question: "Error", answer: "Could not generate well-formed FAQs." }]);
        }
    } catch (error) {
        console.error("Failed to generate FAQs:", error);
        setGeneratedFaqs([{ question: "Error", answer: `Failed to generate FAQs. ${error instanceof Error ? error.message : ''}` }]);
    }
    setIsGeneratingFaqs(false);
  };
  
  const handleToggleFavorite = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      updateDocument({ ...doc, isFavorite: !doc.isFavorite });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{title || defaultTitle}</h2>
        {!showOnlyFavorites && ( // Don't show "Add Document" on "My Bookmarks" view
            <Button onClick={() => setIsUploadModalOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
                {t('add_document')}
            </Button>
        )}
      </div>

      {!showOnlyFavorites && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
            <input
            type="text"
            placeholder={t('search_documents_placeholder')}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-hnai-teal-500 outline-none lg:col-span-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search documents"
            />
            <select
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-hnai-teal-500 outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DocumentType | '')}
            aria-label="Filter by type"
            >
            <option value="">{t('all_types')}</option>
            {Object.values(DocumentType).map(type => (
                <option key={type} value={type}>{type}</option>
            ))}
            </select>
            <select
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-hnai-teal-500 outline-none"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            aria-label="Filter by tag"
            >
            <option value="">{t('all_tags')}</option>
            {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
            ))}
            </select>
            <div className="flex items-center justify-center p-2 border border-transparent rounded-md">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input 
                        type="checkbox" 
                        checked={showFavoritesFilter} 
                        onChange={() => setShowFavoritesFilter(!showFavoritesFilter)}
                        className="form-checkbox h-5 w-5 text-hnai-teal-600 rounded focus:ring-hnai-teal-500"
                    />
                    <span>{t('my_bookmarks')}</span> 
                </label>
            </div>
        </div>
      )}

      {/* Document Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-grow overflow-y-auto pb-6">
          {filteredDocuments.map(doc => (
            <DocumentCard key={doc.id} document={doc} onPreview={handlePreview} onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-slate-500 dark:text-slate-400 py-10">
            {showOnlyFavorites ? t('no_favorite_documents_found') : t('no_documents_found_home')}
            </p>
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={t('add_document')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select name="type" id="type" value={formState.type} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500">
                {Object.values(DocumentType).map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="sourceUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Source URL (Webpage, YouTube)</label>
                <input type="url" name="sourceUrl" id="sourceUrl" value={formState.sourceUrl} onChange={handleInputChange} placeholder="https://example.com" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500"/>
            </div>
          </div>
          <div>
            <label htmlFor="fileInput" className="block text-sm font-medium text-slate-700 dark:text-slate-300">File (Optional - for name/type)</label>
            <input type="file" id="fileInput" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-hnai-teal-50 dark:file:bg-hnai-teal-700 file:text-hnai-teal-700 dark:file:text-hnai-teal-100 hover:file:bg-hnai-teal-100 dark:hover:file:bg-hnai-teal-600"/>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a file to auto-fill name and type. For content, please paste into 'Full Content' field below.</p>
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
            <input type="text" name="tags" id="tags" value={formState.tags} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500"/>
          </div>
          <div>
            <label htmlFor="contentSnippet" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content Snippet (for preview & context)</label>
            <textarea name="contentSnippet" id="contentSnippet" rows={3} value={formState.contentSnippet} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500"/>
          </div>
           <div>
            <div className="flex justify-between items-center">
                <label htmlFor="fullContent" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Content (for AI summarization, FAQs, tagging)</label>
                {isAIServiceAvailable() && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleSuggestTags} disabled={isSuggestingTags || !formState.fullContent} leftIcon={isSuggestingTags ? <LoadingSpinner size="sm"/> : <LightBulbIcon className="w-4 h-4"/>}>
                        {isSuggestingTags ? 'Suggesting...' : 'Suggest Tags'}
                    </Button>
                )}
            </div>
            <textarea name="fullContent" id="fullContent" rows={6} value={formState.fullContent} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-hnai-teal-500 focus:border-hnai-teal-500"/>
            {!isAIServiceAvailable() && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">AI tag suggestion disabled (API key missing).</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit">{t('add_document')}</Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc.name} size="lg">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
                {getFileIcon(previewDoc.type, "w-8 h-8 text-hnai-teal-600 dark:text-hnai-teal-400")}
                <div>
                    <p><strong className="text-slate-700 dark:text-slate-300">Type:</strong> {previewDoc.type}</p>
                    {previewDoc.sourceUrl && (
                         <p className="text-sm text-hnai-teal-600 dark:text-hnai-teal-400">
                            <strong className="text-slate-700 dark:text-slate-300">Source:</strong>{' '}
                            <a href={previewDoc.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{previewDoc.sourceUrl}</a>
                        </p>
                    )}
                </div>
            </div>
            <p><strong className="text-slate-700 dark:text-slate-300">Uploaded:</strong> {new Date(previewDoc.uploadedAt).toLocaleDateString()}</p>
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Tags:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {previewDoc.tags.map(tag => (
                  <span key={tag} className="bg-hnai-teal-100 dark:bg-hnai-teal-800 text-hnai-teal-700 dark:text-hnai-teal-200 text-xs font-semibold px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Content Snippet:</strong>
              <p className="mt-1 p-3 bg-slate-50 dark:bg-slate-700 rounded whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto">{previewDoc.contentSnippet}</p>
            </div>
            {previewDoc.fullContent && (
                 <div>
                    <strong className="text-slate-700 dark:text-slate-300">Full Content:</strong>
                    <div className="mt-1 p-3 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-700 rounded whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                        {previewDoc.fullContent}
                    </div>
                </div>
            )}
            
            {isAIServiceAvailable() && previewDoc.fullContent && (
              <div className="space-y-4 pt-2 border-t dark:border-slate-700 mt-4">
                <div>
                    <Button onClick={handleGenerateSummary} disabled={isSummarizing} leftIcon={isSummarizing ? <LoadingSpinner size="sm" color="text-white"/> : null}>
                    {isSummarizing ? 'Summarizing...' : 'Generate AI Summary'}
                    </Button>
                    {generatedSummary && (
                    <div className="mt-3">
                        <strong className="text-slate-700 dark:text-slate-300">AI Summary:</strong>
                        <div className="mt-1 p-3 bg-hnai-teal-50 dark:bg-hnai-teal-900/50 rounded whitespace-pre-wrap text-sm text-hnai-teal-700 dark:text-hnai-teal-200">
                        {generatedSummary}
                        </div>
                    </div>
                    )}
                </div>
                <div>
                    <Button onClick={handleGenerateFaqs} disabled={isGeneratingFaqs} leftIcon={isGeneratingFaqs ? <LoadingSpinner size="sm" color="text-white"/> : null}>
                    {isGeneratingFaqs ? 'Generating FAQs...' : 'Generate FAQs with AI'}
                    </Button>
                    {generatedFaqs && generatedFaqs.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <strong className="text-slate-700 dark:text-slate-300">AI Generated FAQs:</strong>
                        {generatedFaqs.map((faq, index) => (
                        <details key={index} className="bg-hnai-teal-50 dark:bg-hnai-teal-900/50 p-2 rounded group">
                            <summary className="font-medium text-hnai-teal-700 dark:text-hnai-teal-200 cursor-pointer group-open:pb-1">Q: {faq.question}</summary>
                            <p className="text-sm text-hnai-teal-600 dark:text-hnai-teal-300 whitespace-pre-wrap pl-2 pt-1">{faq.answer}</p>
                        </details>
                        ))}
                    </div>
                    )}
                </div>
              </div>
            )}
            {!isAIServiceAvailable() && previewDoc.fullContent && (
                 <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">AI features (summary, FAQs) are unavailable (API key might be missing).</p>
            )}

             <div className="flex justify-end pt-4 border-t dark:border-slate-700 mt-4">
                <Button onClick={() => setPreviewDoc(null)} variant="secondary">Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DocumentManager;
