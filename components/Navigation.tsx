'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Target,
  Zap,
  Bell,
  Webhook,
  Blocks,
  ChevronDown,
  Moon,
  Sun,
  Languages,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useI18n } from '@/lib/i18n-context';

// Public pages that use their own navigation (PublicNavigation)
const PUBLIC_PAGES = ['/home', '/features', '/pricing', '/login', '/register'];

export function Navigation() {
  const pathname = usePathname();
  const [showFeatures, setShowFeatures] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  // Don't render app navigation on public marketing pages
  if (PUBLIC_PAGES.includes(pathname)) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  // Primary feature - AI Visibility Analysis
  const primaryFeature = {
    href: '/analyze',
    label: 'AI Visibility Analysis',
    icon: TrendingUp,
    description: 'Test your brand across ChatGPT, Gemini, Perplexity & Copilot'
  };

  // Secondary features grouped
  const secondaryFeatures = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'View all your analyses' },
    { href: '/hallucination-detector', label: 'Brand Positioning', icon: Target, description: 'Check how LLMs represent your brand' },
    { href: '/automation', label: 'Automation', icon: Zap, description: 'Schedule automated scans' },
    { href: '/alerts', label: 'Alerts', icon: Bell, description: 'Get notified of changes' },
    { href: '/webhooks', label: 'Webhooks', icon: Webhook, description: 'Connect to your systems' },
    { href: '/integrations', label: 'Integrations', icon: Blocks, description: 'Third-party connections' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Velaris
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden md:flex md:items-center md:gap-2">
              {/* Primary CTA - AI Visibility Analysis */}
              <Link
                href={primaryFeature.href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive(primaryFeature.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                AI Visibility Analysis
              </Link>

              {/* Dashboard Quick Link */}
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Features Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  onBlur={() => setTimeout(() => setShowFeatures(false), 200)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  More Tools
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                </button>

                {showFeatures && (
                  <div className="absolute left-0 mt-2 w-72 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden">
                    <div className="p-2">
                      {/* Brand Positioning - highlighted */}
                      <Link
                        href="/hallucination-detector"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/hallucination-detector')
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Brand Positioning</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Check how LLMs represent your brand</span>
                        </div>
                      </Link>

                      <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                      {/* Automation Tools */}
                      <div className="px-3 py-1.5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Automation</span>
                      </div>

                      <Link
                        href="/automation"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/automation')
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Automation</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Schedule automated scans</span>
                        </div>
                      </Link>

                      <Link
                        href="/alerts"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/alerts')
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <Bell className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Alerts</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Get notified of changes</span>
                        </div>
                      </Link>

                      <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                      {/* Integrations */}
                      <div className="px-3 py-1.5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Integrations</span>
                      </div>

                      <Link
                        href="/webhooks"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/webhooks')
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Webhook className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Webhooks</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Connect to your systems</span>
                        </div>
                      </Link>

                      <Link
                        href="/integrations"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/integrations')
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <Blocks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-gray-100">Integrations</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Third-party connections</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="pt-2 pb-3 space-y-1 px-3">
          {/* Primary CTA - Mobile */}
          <Link
            href="/analyze"
            className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            <TrendingUp className="w-5 h-5" />
            AI Visibility Analysis
          </Link>

          {/* Dashboard - Mobile */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
              isActive('/dashboard')
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          {/* Features Section - Mobile */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              More Tools
            </div>
            {secondaryFeatures.slice(1).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
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
