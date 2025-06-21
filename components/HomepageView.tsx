import React, { useMemo, useCallback } from 'react';
import { Document, ActiveView, Language, UI_TRANSLATIONS } from '../types';
import { PlusCircleIcon, DocumentIcon, BookmarkIcon, ClockIcon, FolderOpenIcon, ChatBubbleLeftRightIcon, PresentationChartLineIcon, CogIcon } from '../constants';
import Button from './common/Button';


interface HomepageViewProps {
  documents: Document[];
  setActiveView: (view: ActiveView) => void;
  requestOpenAddDocumentModal: () => void;
  currentLanguage: Language;
}

interface StatCardProps {
    titleKey: string; // Translation key
    value: string | number;
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    color?: string; // Tailwind color class for icon, e.g., 'text-hnai-teal-500'
    language: Language;
}

const StatCard: React.FC<StatCardProps> = ({ titleKey, value, icon, color = 'text-hnai-teal-600 dark:text-hnai-teal-400', language }) => {
    const t = useCallback((key: string) => {
        return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
    }, [language]);

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-start space-x-4">
            <div className={`p-3 rounded-full bg-opacity-10 dark:bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
                {React.cloneElement(icon, { className: `w-7 h-7 ${color}` })}
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase">{t(titleKey)}</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
};

interface ActionCardProps {
    titleKey: string;
    descriptionKey: string;
    icon: React.ReactNode;
    onClick: () => void;
    buttonTextKey: string;
    language: Language;
    color?: string; // base color for icon and button
}

const ActionCard: React.FC<ActionCardProps> = ({ titleKey, descriptionKey, icon, onClick, buttonTextKey, language, color = 'hnai-teal' }) => {
    const t = useCallback((key: string) => {
        return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
    }, [language]);
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <div className={`mb-4 text-${color}-500 dark:text-${color}-400`}>
                {icon}
            </div>
            <h3 className={`text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2`}>{t(titleKey)}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-grow">{t(descriptionKey)}</p>
            <Button onClick={onClick} variant="primary" size="md" className={`bg-${color}-600 hover:bg-${color}-700 focus:ring-${color}-500 w-full`}>
                {t(buttonTextKey)}
            </Button>
        </div>
    );
};

interface StepGuideCardProps {
  stepNumber: number;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactElement<{ className?: string }>;
  language: Language;
}

const StepGuideCard: React.FC<StepGuideCardProps> = ({ stepNumber, titleKey, descriptionKey, icon, language }) => {
  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
  }, [language]);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-lg flex items-start space-x-4 transition-all hover:shadow-xl">
      <div className="flex-shrink-0">
        <div className="bg-hnai-teal-100 dark:bg-hnai-teal-800/50 text-hnai-teal-600 dark:text-hnai-teal-300 rounded-full w-12 h-12 flex items-center justify-center ring-4 ring-white dark:ring-slate-800">
          {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-hnai-teal-700 dark:text-hnai-teal-300 mb-1">
          <span className="text-slate-500 dark:text-slate-400">{t('step_label')} {stepNumber}:</span> {t(titleKey)}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t(descriptionKey)}
        </p>
      </div>
    </div>
  );
};


const HomepageView: React.FC<HomepageViewProps> = ({ documents, setActiveView, requestOpenAddDocumentModal, currentLanguage }) => {
  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[currentLanguage]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
  }, [currentLanguage]);

  const stats = useMemo(() => {
    const totalDocuments = documents.length;
    const favoriteDocumentsCount = documents.filter(doc => doc.isFavorite).length;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const documentsAddedThisWeek = documents.filter(doc => new Date(doc.uploadedAt) >= oneWeekAgo).length;
    return { totalDocuments, favoriteDocumentsCount, documentsAddedThisWeek };
  }, [documents]);

  const howToSteps = [
    { step: 1, titleKey: "how_to_step_1_title", descriptionKey: "how_to_step_1_desc", icon: <PlusCircleIcon /> },
    { step: 2, titleKey: "how_to_step_2_title", descriptionKey: "how_to_step_2_desc", icon: <FolderOpenIcon /> },
    { step: 3, titleKey: "how_to_step_3_title", descriptionKey: "how_to_step_3_desc", icon: <ChatBubbleLeftRightIcon /> },
    { step: 4, titleKey: "how_to_step_4_title", descriptionKey: "how_to_step_4_desc", icon: <PresentationChartLineIcon /> },
    { step: 5, titleKey: "how_to_step_5_title", descriptionKey: "how_to_step_5_desc", icon: <CogIcon /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50 min-h-full">
      {/* Welcome Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-hnai-teal-700 dark:text-hnai-teal-300 mb-4">
          {t('homepage_welcome_title')}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {t('homepage_welcome_subtitle')}
        </p>
      </section>

      {/* Quick Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard titleKey="total_documents_stat" value={stats.totalDocuments} icon={<DocumentIcon />} language={currentLanguage} />
        <StatCard titleKey="your_favorites_stat" value={stats.favoriteDocumentsCount} icon={<BookmarkIcon />} color="text-hnai-gold-500 dark:text-hnai-gold-400" language={currentLanguage} />
        <StatCard titleKey="added_this_week_stat" value={stats.documentsAddedThisWeek} icon={<ClockIcon />} color="text-green-500 dark:text-green-400" language={currentLanguage} />
      </section>

      {/* Get Started / Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">{t('get_started_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            titleKey="quick_action_add_doc_title"
            descriptionKey="quick_action_add_doc_desc"
            icon={<PlusCircleIcon className="w-12 h-12" />}
            onClick={requestOpenAddDocumentModal}
            buttonTextKey="add_document"
            language={currentLanguage}
            color="hnai-teal"
          />
          <ActionCard
            titleKey="quick_action_explore_docs_title"
            descriptionKey="quick_action_explore_docs_desc"
            icon={<FolderOpenIcon className="w-12 h-12" />}
            onClick={() => setActiveView(ActiveView.DOCUMENTS)}
            buttonTextKey="documents"
            language={currentLanguage}
            color="blue"
          />
          <ActionCard
            titleKey="quick_action_ask_ai_title"
            descriptionKey="quick_action_ask_ai_desc"
            icon={<ChatBubbleLeftRightIcon className="w-12 h-12" />}
            onClick={() => setActiveView(ActiveView.AI_QUERY)}
            buttonTextKey="ai_query"
            language={currentLanguage}
            color="purple"
          />
          <ActionCard
            titleKey="quick_action_analytics_title"
            descriptionKey="quick_action_analytics_desc"
            icon={<PresentationChartLineIcon className="w-12 h-12" />}
            onClick={() => setActiveView(ActiveView.ANALYTICS)}
            buttonTextKey="analytics"
            language={currentLanguage}
            color="hnai-gold"
          />
        </div>
      </section>

      {/* How to Use This App Section */}
      <section className="py-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">{t('homepage_how_to_use_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 max-w-4xl mx-auto">
          {howToSteps.map(stepInfo => (
            <StepGuideCard
              key={stepInfo.step}
              stepNumber={stepInfo.step}
              titleKey={stepInfo.titleKey}
              descriptionKey={stepInfo.descriptionKey}
              icon={stepInfo.icon}
              language={currentLanguage}
            />
          ))}
        </div>
      </section>
      
      {/* Knowledge Quote Section */}
      <section className="py-8 text-center">
         <blockquote className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400 italic text-lg">
            <p>"{t('knowledge_quote')}"</p>
        </blockquote>
      </section>

    </div>
  );
};

export default HomepageView;