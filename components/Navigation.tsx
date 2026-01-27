'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Target,
  Zap,
  Bell,
  ChevronDown,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { useState } from 'react';

// Public pages that use their own navigation (PublicNavigation)
const PUBLIC_PAGES = ['/home', '/features', '/pricing', '/login', '/register'];

export function Navigation() {
  const pathname = usePathname();
  const [showFeatures, setShowFeatures] = useState(false);

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
  ];

  return (
    <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-xl font-headline font-bold text-[#173D32]">
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
                    ? 'bg-[#173D32] text-white shadow-md'
                    : 'bg-[#ACD3C8]/20 text-[#173D32] hover:bg-[#ACD3C8]/40'
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
                    ? 'bg-off-white text-off-black'
                    : 'text-[#4A5F5F] hover:text-off-black hover:bg-off-white'
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
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#4A5F5F] hover:text-off-black hover:bg-off-white rounded-lg transition-colors"
                >
                  More Tools
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                </button>

                {showFeatures && (
                  <div className="absolute left-0 mt-2 w-72 rounded-xl shadow-lg bg-white border-2 border-[#E5E5E5] z-50 overflow-hidden">
                    <div className="p-2">
                      {/* Brand Positioning - highlighted */}
                      <Link
                        href="/hallucination-detector"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/hallucination-detector')
                            ? 'bg-[#D0DBF9]/30'
                            : 'hover:bg-off-white'
                        }`}
                      >
                        <div className="p-2 bg-[#D0DBF9]/30 rounded-lg">
                          <Target className="w-4 h-4 text-[#396FFA]" />
                        </div>
                        <div>
                          <span className="block font-medium text-off-black">Brand Positioning</span>
                          <span className="text-xs text-off-grey">Check how LLMs represent your brand</span>
                        </div>
                      </Link>

                      <div className="border-t border-[#E5E5E5] my-2"></div>

                      {/* Automation Tools */}
                      <div className="px-3 py-1.5">
                        <span className="text-xs font-semibold text-off-grey uppercase tracking-wider">Automation</span>
                      </div>

                      <Link
                        href="/automation"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/automation')
                            ? 'bg-[#D0DBF9]/30'
                            : 'hover:bg-off-white'
                        }`}
                      >
                        <div className="p-2 bg-[#E3B5A3]/20 rounded-lg">
                          <Zap className="w-4 h-4 text-[#EB4200]" />
                        </div>
                        <div>
                          <span className="block font-medium text-off-black">Automation</span>
                          <span className="text-xs text-off-grey">Schedule automated scans</span>
                        </div>
                      </Link>

                      <Link
                        href="/alerts"
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive('/alerts')
                            ? 'bg-[#D0DBF9]/30'
                            : 'hover:bg-off-white'
                        }`}
                      >
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Bell className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <span className="block font-medium text-off-black">Alerts</span>
                          <span className="text-xs text-off-grey">Get notified of changes</span>
                        </div>
                      </Link>

                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-[#E5E5E5]">
        <div className="pt-2 pb-3 space-y-1 px-3">
          {/* Primary CTA - Mobile */}
          <Link
            href="/analyze"
            className="flex items-center gap-3 px-4 py-3 bg-[#173D32] text-white rounded-xl font-semibold"
          >
            <TrendingUp className="w-5 h-5" />
            AI Visibility Analysis
          </Link>

          {/* Dashboard - Mobile */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
              isActive('/dashboard')
                ? 'bg-off-white text-off-black'
                : 'text-[#4A5F5F] hover:bg-off-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          {/* Features Section - Mobile */}
          <div className="border-t border-[#E5E5E5] pt-2 mt-2">
            <div className="px-4 py-2 text-xs font-semibold text-off-grey uppercase tracking-wider">
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
                      ? 'bg-[#ACD3C8]/20 text-[#173D32]'
                      : 'text-[#4A5F5F] hover:bg-off-white'
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
