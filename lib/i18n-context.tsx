"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UILanguage = 'en' | 'de';

interface I18nContextType {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
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
    'nav.allFeatures': 'All Features',
    'nav.backToDashboard': 'Back to Dashboard',

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
    'common.optional': 'optional',
    'common.required': 'Required',
    'common.of': 'of',
    'common.responses': 'responses',

    // Analysis Form
    'form.title': 'Create New AI Visibility Analysis',
    'form.subtitle': "We'll find the questions that matter for your brand",
    'form.brandName': 'Brand Name',
    'form.brandPlaceholder': 'e.g., Nike',
    'form.category': 'Category / Vertical',
    'form.categoryPlaceholder': 'e.g., running shoes, SaaS productivity tools, skincare',
    'form.categoryHelp': "Enter your product category or vertical. We'll suggest relevant buyer personas.",
    'form.competitors': 'Competitors',
    'form.competitorsPlaceholder': 'e.g., Adidas, Puma, New Balance',
    'form.competitorsFree': 'e.g., Adidas',
    'form.competitorsHelp': 'Compare with up to {max} competitors',
    'form.domain': 'Domain',
    'form.domainPlaceholder': 'e.g., nike.com',
    'form.domainHelp': 'For technical audit of your website',
    'form.questionLanguage': 'Question Language',
    'form.questionLanguageHelp': 'Language for AI-generated questions. AI responses will be in this language.',
    'form.country': 'Target Country / Market',
    'form.countryHelp': 'LLM responses vary by region. Select your target market for accurate results.',
    'form.startAnalysis': 'Start Analysis',
    'form.analyzing': 'Analyzing...',
    'form.discoverQuestions': 'Discover Questions',
    'form.discovering': 'Discovering...',

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
    'results.awarenessStage': 'Awareness',
    'results.considerationStage': 'Consideration',
    'results.decisionStage': 'Decision',
    'results.viewAllResponses': 'View All AI Responses',
    'results.competitorsMentioned': 'Competitors mentioned instead',
    'results.whatTheySaid': 'What they said',
    'results.insight': 'Insight',
    'results.noResponsesAvailable': 'No {platform} responses available for this stage.',
    'results.brandNotMentioned': '{platform} provided {count} responses for this stage, but your brand was not mentioned.',
    'results.visibilityGap': 'This indicates a visibility gap - {platform} is recommending alternatives without mentioning your brand.',
    'results.platformSummary': 'Platform-by-Platform Summary',
    'results.stageMetrics': 'Stage Metrics',
    'results.mentions': 'mentions',
    'results.inPosition': 'in position',
    'results.behind': 'behind',

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
    'nav.allFeatures': 'Alle Funktionen',
    'nav.backToDashboard': 'Zurück zum Dashboard',

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
    'common.optional': 'optional',
    'common.required': 'Erforderlich',
    'common.of': 'von',
    'common.responses': 'Antworten',

    // Analysis Form
    'form.title': 'Neue KI-Sichtbarkeitsanalyse erstellen',
    'form.subtitle': 'Wir finden die Fragen, die für Ihre Marke wichtig sind',
    'form.brandName': 'Markenname',
    'form.brandPlaceholder': 'z.B. Nike',
    'form.category': 'Kategorie / Branche',
    'form.categoryPlaceholder': 'z.B. Laufschuhe, SaaS-Produktivitätstools, Hautpflege',
    'form.categoryHelp': 'Geben Sie Ihre Produktkategorie oder Branche ein. Wir schlagen relevante Käuferpersonas vor.',
    'form.competitors': 'Wettbewerber',
    'form.competitorsPlaceholder': 'z.B. Adidas, Puma, New Balance',
    'form.competitorsFree': 'z.B. Adidas',
    'form.competitorsHelp': 'Vergleichen Sie mit bis zu {max} Wettbewerbern',
    'form.domain': 'Domain',
    'form.domainPlaceholder': 'z.B. nike.com',
    'form.domainHelp': 'Für technisches Audit Ihrer Website',
    'form.questionLanguage': 'Fragensprache',
    'form.questionLanguageHelp': 'Sprache für KI-generierte Fragen. KI-Antworten werden in dieser Sprache sein.',
    'form.country': 'Zielland / Markt',
    'form.countryHelp': 'LLM-Antworten variieren je nach Region. Wählen Sie Ihren Zielmarkt für genaue Ergebnisse.',
    'form.startAnalysis': 'Analyse starten',
    'form.analyzing': 'Analysiere...',
    'form.discoverQuestions': 'Fragen entdecken',
    'form.discovering': 'Entdecke...',

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
    'results.awarenessStage': 'Bewusstsein',
    'results.considerationStage': 'Überlegung',
    'results.decisionStage': 'Entscheidung',
    'results.viewAllResponses': 'Alle KI-Antworten anzeigen',
    'results.competitorsMentioned': 'Stattdessen erwähnte Wettbewerber',
    'results.whatTheySaid': 'Was gesagt wurde',
    'results.insight': 'Einblick',
    'results.noResponsesAvailable': 'Keine {platform}-Antworten für diese Phase verfügbar.',
    'results.brandNotMentioned': '{platform} hat {count} Antworten für diese Phase bereitgestellt, aber Ihre Marke wurde nicht erwähnt.',
    'results.visibilityGap': 'Dies weist auf eine Sichtbarkeitslücke hin - {platform} empfiehlt Alternativen, ohne Ihre Marke zu erwähnen.',
    'results.platformSummary': 'Plattform-Zusammenfassung',
    'results.stageMetrics': 'Phasenmetriken',
    'results.mentions': 'Erwähnungen',
    'results.inPosition': 'in Position',
    'results.behind': 'hinter',

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
    // Return default values for SSR/SSG builds
    return {
      language: 'en' as UILanguage,
      setLanguage: () => {},
      t: (key: string, replacements?: Record<string, string | number>) => key,
    };
  }
  return context;
}
