'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Shield,
  Zap,
  Bell,
  Webhook,
  Blocks,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Languages
} from 'lucide-react';
import { useState } from 'react';
import { SEMANTIC_COLORS } from '@/lib/theme/colors';
import { useTheme } from '@/lib/theme-context';
import { useI18n, UILanguage } from '@/lib/i18n-context';

export function Navigation() {
  const pathname = usePathname();
  const [showFeatures, setShowFeatures] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const isActive = (path: string) => pathname === path;

  const featureLinks = [
    { href: '/features', label: 'All Features', icon: Sparkles },
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/hallucination-detector', label: 'Hallucination Detector', icon: Shield },
    { href: '/automation', label: 'Automation', icon: Zap },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/integrations', label: 'Integrations', icon: Blocks },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Velaris
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              {/* Features Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  onBlur={() => setTimeout(() => setShowFeatures(false), 200)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  All Features
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {showFeatures && (
                  <div className="absolute left-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2">
                      {featureLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center px-4 py-3 text-sm transition-colors ${
                              isActive(link.href)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Start New Analysis Button */}
              <Link
                href="/analyze"
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                {t('nav.newAnalysis')}
              </Link>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Switch Language"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'DE'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="pt-2 pb-3 space-y-1">
          {/* Start New Analysis - Mobile */}
          <Link
            href="/analyze"
            className="flex items-center mx-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold mb-2"
          >
            <Search className="w-5 h-5 mr-3" />
            Start New Analysis
          </Link>

          {/* Features Section - Mobile */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              All Features
            </div>
            {featureLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center pl-6 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(link.href)
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
