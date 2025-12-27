"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UILanguage = 'en' | 'de';

interface I18nContextType {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.newAnalysis': 'New Analysis',
    'nav.reports': 'Reports',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',

    // Analysis Form
    'form.title': 'Create New AI Visibility Analysis',
    'form.brandName': 'Brand or Keyword',
    'form.brandPlaceholder': 'e.g., Nike, Tesla, iPhone 15',
    'form.competitors': 'Competitors',
    'form.competitorsPlaceholder': 'e.g., Adidas, Puma',
    'form.domain': 'Website Domain',
    'form.domainPlaceholder': 'e.g., nike.com',
    'form.questionLanguage': 'Question Language',
    'form.questionLanguageHelp': 'Language for AI questions',
    'form.country': 'Target Country',
    'form.startAnalysis': 'Start Analysis',
    'form.analyzing': 'Analyzing...',

    // Results
    'results.title': 'AI Visibility Report',
    'results.overallVisibility': 'Overall Visibility',
    'results.mentionRate': 'Mention Rate',
    'results.position': 'Position',
    'results.tone': 'Tone',
    'results.sentiment': 'Sentiment',
    'results.positive': 'Positive',
    'results.neutral': 'Neutral',
    'results.negative': 'Negative',
    'results.awarenessStage': 'Awareness Stage',
    'results.considerationStage': 'Consideration Stage',
    'results.decisionStage': 'Decision Stage',
    'results.viewAllResponses': 'View All AI Responses',
    'results.competitorsMentioned': 'Competitors mentioned instead',
    'results.whatTheySaid': 'What they said',
    'results.insight': 'Insight',
    'results.noResponsesAvailable': 'No {platform} responses available for this stage.',
    'results.brandNotMentioned': '{platform} provided {count} responses for this stage, but your brand was not mentioned.',
    'results.visibilityGap': 'This indicates a visibility gap - {platform} is recommending alternatives without mentioning your brand.',

    // Funnel Stages
    'stage.awareness': 'Awareness',
    'stage.consideration': 'Consideration',
    'stage.decision': 'Decision',

    // Theme
    'theme.light': 'Light Mode',
    'theme.dark': 'Dark Mode',
  },
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.dashboard': 'Dashboard',
    'nav.newAnalysis': 'Neue Analyse',
    'nav.reports': 'Berichte',

    // Common
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',

    // Analysis Form
    'form.title': 'Neue KI-Sichtbarkeitsanalyse erstellen',
    'form.brandName': 'Marke oder Stichwort',
    'form.brandPlaceholder': 'z.B. Nike, Tesla, iPhone 15',
    'form.competitors': 'Wettbewerber',
    'form.competitorsPlaceholder': 'z.B. Adidas, Puma',
    'form.domain': 'Website-Domain',
    'form.domainPlaceholder': 'z.B. nike.com',
    'form.questionLanguage': 'Fragensprache',
    'form.questionLanguageHelp': 'Sprache für KI-Fragen',
    'form.country': 'Zielland',
    'form.startAnalysis': 'Analyse starten',
    'form.analyzing': 'Analysiere...',

    // Results
    'results.title': 'KI-Sichtbarkeitsbericht',
    'results.overallVisibility': 'Gesamtsichtbarkeit',
    'results.mentionRate': 'Erwähnungsrate',
    'results.position': 'Position',
    'results.tone': 'Tonalität',
    'results.sentiment': 'Stimmung',
    'results.positive': 'Positiv',
    'results.neutral': 'Neutral',
    'results.negative': 'Negativ',
    'results.awarenessStage': 'Bewusstseinsphase',
    'results.considerationStage': 'Überlegungsphase',
    'results.decisionStage': 'Entscheidungsphase',
    'results.viewAllResponses': 'Alle KI-Antworten anzeigen',
    'results.competitorsMentioned': 'Stattdessen erwähnte Wettbewerber',
    'results.whatTheySaid': 'Was gesagt wurde',
    'results.insight': 'Einblick',
    'results.noResponsesAvailable': 'Keine {platform}-Antworten für diese Phase verfügbar.',
    'results.brandNotMentioned': '{platform} hat {count} Antworten für diese Phase bereitgestellt, aber Ihre Marke wurde nicht erwähnt.',
    'results.visibilityGap': 'Dies weist auf eine Sichtbarkeitslücke hin - {platform} empfiehlt Alternativen, ohne Ihre Marke zu erwähnen.',

    // Funnel Stages
    'stage.awareness': 'Bewusstsein',
    'stage.consideration': 'Überlegung',
    'stage.decision': 'Entscheidung',

    // Theme
    'theme.light': 'Heller Modus',
    'theme.dark': 'Dunkler Modus',
  },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UILanguage>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('uiLanguage') as UILanguage | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      const initialLang = browserLang.startsWith('de') ? 'de' : 'en';
      setLanguageState(initialLang);
    }
  }, []);

  const setLanguage = (lang: UILanguage) => {
    setLanguageState(lang);
    localStorage.setItem('uiLanguage', lang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let text = translations[language][key as keyof typeof translations['en']] || key;

    // Handle replacements like {platform}, {count}, etc.
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(`{${placeholder}}`, String(value));
      });
    }

    return text;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
