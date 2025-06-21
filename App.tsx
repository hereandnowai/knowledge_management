
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Theme, Document, ActiveView, NavItem, DocumentType, Language, LANGUAGE_LABELS, UI_TRANSLATIONS, FAQ } from './types';
import { NAVIGATION_ITEMS, COMPANY_BRAND_IMAGE_URL, SunIcon, MoonIcon, COMPANY_LOGO_FEVICON_URL, COMPANY_NAME, GlobeAltIcon, ComputerDesktopIcon } from './constants'; 
import DocumentManager from './components/DocumentManager';
import AIQueryAgent from './components/AIQueryAgent';
import AnalyticsReportView from './components/AnalyticsReportView';
import SystemSettingsView from './components/SystemSettingsView';
import HomepageView from './components/HomepageView';

const initialDocsData: Omit<Document, 'id' | 'uploadedAt'>[] = [
    { name: 'Company Policy Q1 2024', type: DocumentType.PDF, tags: ['policy', 'hr', 'q1'], contentSnippet: 'This document outlines the updated company policies for the first quarter of 2024, including remote work guidelines and new HR procedures.', fullContent: 'Full content of Company Policy Q1 2024 covering all aspects of employment, benefits, and workplace conduct. It has been updated to reflect new local regulations.', isFavorite: false, generatedFaqs: [{question: "What is the remote work policy?", answer: "Refer to section 3.2 for details."}] },
    { name: 'Marketing Strategy H2', type: DocumentType.WORD, tags: ['marketing', 'strategy', 'h2'], contentSnippet: 'A comprehensive marketing strategy for the second half of the year, focusing on digital channels and new product launches.', fullContent: 'This marketing strategy details campaign budgets, target audiences for H2, and KPIs for measuring success across various platforms.', isFavorite: true, sourceUrl: 'https://example.com/marketing-strat' },
    { name: 'Sales Report - May', type: DocumentType.EXCEL, tags: ['sales', 'report', 'finance'], contentSnippet: 'Monthly sales report for May, detailing regional performance, top products, and revenue figures.', fullContent: 'May sales figures show a 15% increase year-over-year, driven by strong performance in the APAC region. Detailed charts included.', isFavorite: false },
    { name: 'Introduction to Gemini API', type: DocumentType.URL, tags: ['ai', 'api', 'gemini', 'documentation'], contentSnippet: 'Official documentation for the Gemini API, covering setup, usage, and best practices.', sourceUrl: 'https://ai.google.dev/docs/gemini_api_overview', isFavorite: true, fullContent: 'The Gemini API allows developers to access Google\'s state-of-the-art generative AI models. This document provides a comprehensive guide.'},
    { name: 'Learn React Tutorial', type: DocumentType.YOUTUBE_LINK, tags: ['react', 'tutorial', 'frontend', 'video'], contentSnippet: 'A video tutorial series for learning React from scratch, suitable for beginners.', sourceUrl: 'https://www.youtube.com/watch?v=someReactTutorialVideoID', isFavorite: false, fullContent: 'This YouTube playlist covers React fundamentals like components, state, props, hooks, and routing.'},
    { name: 'Recent Project Update', type: DocumentType.TEXT, tags: ['project', 'update', 'internal'], contentSnippet: 'Summary of recent progress on Project Phoenix, including milestones achieved and next steps.', fullContent: 'Project Phoenix is on track. Phase 1 completed. Phase 2 kickoff next week. Detailed notes attached.', isFavorite: true},
];

const APP_VERSION = "1.1.0"; // Define app version here or import from constants

const App: React.FC = () => {
  const [currentThemeSetting, setCurrentThemeSetting] = useState<Theme>(Theme.SYSTEM); // User's preference: light, dark, or system
  const [effectiveTheme, setEffectiveTheme] = useState<Theme.LIGHT | Theme.DARK>(Theme.LIGHT); // Actual theme applied: light or dark
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldOpenAddDocumentModal, setShouldOpenAddDocumentModal] = useState(false);

  const parseStoredDocuments = (storedValue: string | null): Document[] => {
    if (!storedValue) return []; // Handles null, undefined, ""
    try {
      const parsedData = JSON.parse(storedValue);
      // Ensure parsedData is an array before trying to map
      if (!Array.isArray(parsedData)) {
        console.warn(
          `Stored documents data in localStorage (key 'hnai-km-documents') is not an array. Value: '${storedValue}'. Parsed:`,
          parsedData,
          "Returning empty array."
        );
        return [];
      }
      return parsedData.map((d: any) => ({ 
        ...d,
        uploadedAt: new Date(d.uploadedAt),
        isFavorite: d.isFavorite || false, 
        tags: Array.isArray(d.tags) ? d.tags : [],
        type: Object.values(DocumentType).includes(d.type) ? d.type : DocumentType.UNKNOWN,
        generatedFaqs: Array.isArray(d.generatedFaqs) ? d.generatedFaqs : (d.generatedFaqs ? [d.generatedFaqs] : []), // Ensure FAQs are array
      }));
    } catch (error) {
      console.error("Error parsing documents from localStorage:", error, "Value was:", storedValue);
      return []; // Return empty on error
    }
  };

  // Effect for initializing and managing theme
  useEffect(() => {
    const storedThemePreference = localStorage.getItem('hnai-km-theme-preference') as Theme | null;
    const initialPreference = storedThemePreference || Theme.SYSTEM;
    setCurrentThemeSetting(initialPreference);

    const applyTheme = (preference: Theme) => {
      let newEffectiveTheme: Theme.LIGHT | Theme.DARK;
      if (preference === Theme.SYSTEM) {
        newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
      } else {
        newEffectiveTheme = preference as Theme.LIGHT | Theme.DARK;
      }
      setEffectiveTheme(newEffectiveTheme);
      document.documentElement.classList.toggle('dark', newEffectiveTheme === Theme.DARK);
    };

    applyTheme(initialPreference);

    const mediaQueryListener = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('hnai-km-theme-preference') === Theme.SYSTEM || !localStorage.getItem('hnai-km-theme-preference')) {
        setEffectiveTheme(e.matches ? Theme.DARK : Theme.LIGHT);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', mediaQueryListener);

    return () => {
      mediaQuery.removeEventListener('change', mediaQueryListener);
    };
  }, []);

  const setThemePreference = (preference: Theme) => {
    setCurrentThemeSetting(preference);
    localStorage.setItem('hnai-km-theme-preference', preference);
    // Re-apply theme based on new preference
    let newEffectiveTheme: Theme.LIGHT | Theme.DARK;
      if (preference === Theme.SYSTEM) {
        newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
      } else {
        newEffectiveTheme = preference as Theme.LIGHT | Theme.DARK; //  LIGHT or DARK
      }
    setEffectiveTheme(newEffectiveTheme);
    document.documentElement.classList.toggle('dark', newEffectiveTheme === Theme.DARK);
  };
  

  // Effect for initializing documents and language
  useEffect(() => {
    const storedDocs = localStorage.getItem('hnai-km-documents');
    if (storedDocs) {
      setDocuments(parseStoredDocuments(storedDocs));
    } else {
        const initialDocsWithIds: Document[] = initialDocsData.map((doc, index) => {
            const date = new Date();
            if (doc.name === 'Recent Project Update') { 
                 date.setDate(date.getDate() - 1); 
            } else {
                 date.setDate(date.getDate() - (index * 5 + 5)); 
            }
            return {
                ...doc,
                id: Date.now().toString() + index,
                uploadedAt: date,
                generatedFaqs: doc.generatedFaqs || [], // Ensure generatedFaqs is an array
            };
        });
        setDocuments(initialDocsWithIds);
        localStorage.setItem('hnai-km-documents', JSON.stringify(initialDocsWithIds));
    }

    const storedLang = localStorage.getItem('hnai-km-language') as Language;
    if (storedLang && Object.values(Language).includes(storedLang)) {
        setLanguage(storedLang);
    }
  }, []);

  // Effect for persisting documents
  useEffect(() => {
    // Only save if documents array is not in its initial empty state during setup
    if (documents.length > 0 || localStorage.getItem('hnai-km-documents')) {
         localStorage.setItem('hnai-km-documents', JSON.stringify(documents));
    }
  }, [documents]);

  // Listen for localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'hnai-km-documents' && event.newValue) {
        setDocuments(parseStoredDocuments(event.newValue));
      }
      if (event.key === 'hnai-km-theme-preference' && event.newValue) {
        setThemePreference(event.newValue as Theme);
      }
      if (event.key === 'hnai-km-language' && event.newValue) {
        setLanguage(event.newValue as Language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('hnai-km-language', lang);
  }

  const addDocument = useCallback((docData: Omit<Document, 'id' | 'uploadedAt' | 'isFavorite' | 'generatedFaqs'>) => {
    const newDocument: Document = {
      ...docData,
      id: Date.now().toString(),
      uploadedAt: new Date(),
      isFavorite: false,
      generatedFaqs: [], 
    };
    setDocuments(prevDocs => {
        const updatedDocs = [newDocument, ...prevDocs];
        // localStorage update is handled by the useEffect for 'documents'
        return updatedDocs;
    });
  }, []);
  
  const updateDocument = useCallback((updatedDoc: Document) => {
    setDocuments(prevDocs => {
        const updatedDocs = prevDocs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc);
        // localStorage update is handled by the useEffect for 'documents'
        return updatedDocs;
    });
  }, []);

  const handleClearAllData = () => {
    localStorage.removeItem('hnai-km-documents');
    localStorage.removeItem('hnai-km-theme-preference');
    localStorage.removeItem('hnai-km-language');
    // Potentially other keys if added
    window.location.reload(); // Reload to apply fresh state
  };

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
  }, [language]);

  const handleRequestOpenAddDocumentModal = useCallback(() => {
    setActiveView(ActiveView.DOCUMENTS);
    setShouldOpenAddDocumentModal(true);
  }, []);

  const handleAddDocumentModalOpened = useCallback(() => {
    setShouldOpenAddDocumentModal(false);
  }, []);


  const renderView = () => {
    switch (activeView) {
      case ActiveView.HOME:
        return <HomepageView 
                  documents={documents}
                  setActiveView={setActiveView}
                  requestOpenAddDocumentModal={handleRequestOpenAddDocumentModal}
                  currentLanguage={language}
                />;
      case ActiveView.DOCUMENTS:
        return <DocumentManager 
                  documents={documents} 
                  addDocument={addDocument} 
                  updateDocument={updateDocument} 
                  title={t('document_hub_title')}
                  currentLanguage={language}
                  initialOpenAddModal={shouldOpenAddDocumentModal}
                  onModalHandled={handleAddDocumentModalOpened}
                />;
      case ActiveView.AI_QUERY:
        return <AIQueryAgent documents={documents} />;
      case ActiveView.MY_BOOKMARKS:
        return <DocumentManager 
                  documents={documents} 
                  addDocument={addDocument} 
                  updateDocument={updateDocument} 
                  title={t('my_bookmarks')} 
                  showOnlyFavorites={true} 
                  currentLanguage={language}
                />;
      case ActiveView.ANALYTICS:
        return <AnalyticsReportView documents={documents} />;
      case ActiveView.SETTINGS:
        return <SystemSettingsView 
                  currentTheme={currentThemeSetting}
                  onThemeChange={setThemePreference}
                  currentLanguage={language}
                  onLanguageChange={changeLanguage}
                  onClearAllData={handleClearAllData}
                />;
      default:
        return <HomepageView 
                  documents={documents}
                  setActiveView={setActiveView}
                  requestOpenAddDocumentModal={handleRequestOpenAddDocumentModal}
                  currentLanguage={language}
                />;
    }
  };
  
  const ThemeIcon = currentThemeSetting === Theme.LIGHT 
    ? MoonIcon 
    : currentThemeSetting === Theme.DARK 
      ? SunIcon 
      : ComputerDesktopIcon;
  const themeToggleButtonLabel = currentThemeSetting === Theme.LIGHT 
    ? `Switch to ${Theme.DARK} mode` 
    : currentThemeSetting === Theme.DARK 
      ? `Switch to ${Theme.LIGHT} mode`
      : `Switch to ${effectiveTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT} mode (System: ${effectiveTheme})`;


  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-hnai-teal-700 dark:bg-hnai-teal-800 text-white p-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg flex flex-col`}>
        <div className="flex items-center mb-8 space-x-2">
          <img src={COMPANY_LOGO_FEVICON_URL} alt="Company Logo" className="h-10 w-10 rounded-full bg-white p-1" />
          <span className="text-xl font-semibold whitespace-nowrap">HNAI KM</span>
        </div>
        <nav className="flex-grow">
          <ul>
            {NAVIGATION_ITEMS.map((item: NavItem) => (
              <li key={item.name} className="mb-2">
                <button
                  onClick={() => { setActiveView(item.name); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${activeView === item.name 
                      ? 'bg-hnai-gold-500 text-hnai-teal-900 shadow-md' 
                      : 'hover:bg-hnai-teal-600 dark:hover:bg-hnai-teal-700'
                    }`}
                  aria-current={activeView === item.name ? "page" : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.labelKey ? t(item.labelKey) : item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4">
            <p className="text-xs text-center text-hnai-teal-200">
                &copy; {new Date().getFullYear()} {COMPANY_NAME.split(" ").slice(0,2).join(" ")} <br/> {COMPANY_NAME.split(" ").slice(2).join(" ")}
                <br/> Developed by RASHINI S (AI Product Engineer Team).
            </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-md p-3 sm:p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden mr-3 text-slate-600 dark:text-slate-300 hover:text-hnai-teal-500"
                aria-label="Toggle sidebar"
                aria-expanded={isSidebarOpen}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <img src={COMPANY_BRAND_IMAGE_URL} alt={COMPANY_NAME} className="h-7 sm:h-8 md:h-10 hidden sm:block" />
             <span className="text-lg sm:text-xl font-semibold text-hnai-teal-700 dark:text-hnai-teal-300 sm:hidden">HNAI KM</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
                <select 
                    value={language} 
                    onChange={(e) => changeLanguage(e.target.value as Language)}
                    className="pl-8 pr-2 py-1.5 sm:py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-hnai-teal-500 focus:border-hnai-teal-500 appearance-none"
                    aria-label="Select language"
                >
                    {Object.values(Language).map(lang => (
                        <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
                    ))}
                </select>
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"/>
            </div>
            <button
                onClick={() => {
                  // Cycle through themes: Light -> Dark -> System -> Light ...
                  if (currentThemeSetting === Theme.LIGHT) setThemePreference(Theme.DARK);
                  else if (currentThemeSetting === Theme.DARK) setThemePreference(Theme.SYSTEM);
                  else setThemePreference(Theme.LIGHT);
                }}
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-hnai-gold-500 transition-colors"
                aria-label={themeToggleButtonLabel}
            >
                <ThemeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900">
          {renderView()}
        </main>
      </div>
       {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black opacity-50 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}
    </div>
  );
};

export default App;