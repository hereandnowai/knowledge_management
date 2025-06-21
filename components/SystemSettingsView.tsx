
import React, { useState, useCallback, useEffect } from 'react';
import { CogIcon, SunIcon, MoonIcon, GlobeAltIcon, DocumentTextIcon, CommandLineIcon, ArchiveBoxXMarkIcon, InformationCircleIcon, ComputerDesktopIcon } from '../constants'; // Added more icons
import { Language, Theme, UI_TRANSLATIONS, LANGUAGE_LABELS } from '../types';
import Button from './common/Button';
import Modal from './common/Modal'; // For confirmation
import { isAIServiceAvailable } from '../services/geminiService'; // To check AI service status

// Helper to get the current AI model name (simplified)
const getAIModelName = () => 'gemini-2.5-flash-preview-04-17'; // As per geminiService

interface SystemSettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onClearAllData: () => void;
}

const SettingsCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden">
    <div className="p-5 sm:p-6">
      <div className="flex items-center mb-4">
        {icon && <span className="mr-3 text-hnai-teal-500 dark:text-hnai-teal-400">{icon}</span>}
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  </div>
);


const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  currentLanguage,
  onLanguageChange,
  onClearAllData
}) => {
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[currentLanguage]?.[key] || UI_TRANSLATIONS[Language.EN][key] || key;
  }, [currentLanguage]);

  const handleThemeSelection = (themeValue: string) => {
    onThemeChange(themeValue as Theme);
    triggerToast();
  };

  const handleLanguageSelection = (langValue: string) => {
    onLanguageChange(langValue as Language);
    triggerToast();
  };
  
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmClearData = () => {
    onClearAllData();
    setShowClearDataModal(false);
    // Optionally trigger a toast here too, though page reload might make it brief
  };

  const appVersion = "1.1.0"; // Example version

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50 min-h-full">
      <div className="flex items-center space-x-3 mb-6">
        <CogIcon className="w-8 h-8 text-hnai-teal-600 dark:text-hnai-teal-400" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('settings_title')}</h1>
      </div>
      <p className="text-md text-slate-600 dark:text-slate-400 mb-8">{t('settings_description')}</p>

      {/* Appearance Settings */}
      <SettingsCard title={t('appearance_settings_title')} icon={<SunIcon className="w-6 h-6" />}>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('theme_label')}</label>
          <div className="flex flex-wrap gap-2">
            {(Object.values(Theme) as Theme[]).map((themeOption) => (
              <Button
                key={themeOption}
                variant={currentTheme === themeOption ? 'primary' : 'secondary'}
                onClick={() => handleThemeSelection(themeOption)}
                leftIcon={themeOption === Theme.LIGHT ? <SunIcon className="w-4 h-4" /> : themeOption === Theme.DARK ? <MoonIcon className="w-4 h-4" /> : <ComputerDesktopIcon className="w-4 h-4" />}
                className="capitalize"
              >
                {t(`theme_${themeOption}`)}
              </Button>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* Language Settings */}
      <SettingsCard title={t('language_settings_title')} icon={<GlobeAltIcon className="w-6 h-6" />}>
        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('language_label')}</label>
          <select
            id="language-select"
            value={currentLanguage}
            onChange={(e) => handleLanguageSelection(e.target.value)}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-hnai-teal-500 outline-none"
          >
            {Object.values(Language).map(lang => (
              <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
            ))}
          </select>
        </div>
      </SettingsCard>

      {/* AI Configuration */}
      <SettingsCard title={t('ai_config_title')} icon={<CommandLineIcon className="w-6 h-6" />}>
        <div className="space-y-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">{t('ai_service_status_label')}</span>{' '}
            {isAIServiceAvailable() ? 
                <span className="text-green-600 dark:text-green-400 font-semibold">{t('ai_service_available')}</span> : 
                <span className="text-red-600 dark:text-red-400 font-semibold">{t('ai_service_unavailable')}</span>
            }
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">{t('ai_model_label')}</span> {getAIModelName()}
          </p>
        </div>
      </SettingsCard>

      {/* Data Management */}
      <SettingsCard title={t('data_management_title')} icon={<ArchiveBoxXMarkIcon className="w-6 h-6" />}>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('data_storage_info')}</p>
        <Button
          variant="danger"
          onClick={() => setShowClearDataModal(true)}
          leftIcon={<ArchiveBoxXMarkIcon className="w-5 h-5" />}
        >
          {t('clear_local_data_button')}
        </Button>
      </SettingsCard>

      {/* About Section */}
      <SettingsCard title={t('about_section_title')} icon={<InformationCircleIcon className="w-6 h-6" />}>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li><span className="font-medium">{t('app_name_label')}</span> HNAI Knowledge Hub</li>
          <li><span className="font-medium">{t('app_version_label')}</span> {appVersion}</li>
          <li>
            <span className="font-medium">{t('app_copyright_label')}</span> &copy; {new Date().getFullYear()} HEREANDNOW AI RESEARCH INSTITUTE.
            <br />
            Developed by RASHINI S (AI Product Engineer Team).
          </li>
          <li><span className="font-medium">{t('app_powered_by_label')}</span> Gemini API</li>
        </ul>
      </SettingsCard>

      {/* Confirmation Modal for Clear Data */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title={t('clear_data_confirm_title')}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">{t('clear_data_confirm_message')}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowClearDataModal(false)}>{t('cancel_button')}</Button>
            <Button variant="danger" onClick={handleConfirmClearData}>{t('confirm_delete_button')}</Button>
          </div>
        </div>
      </Modal>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-md transition-opacity duration-300">
          {t('settings_saved_toast')}
        </div>
      )}
    </div>
  );
};

export default SystemSettingsView;