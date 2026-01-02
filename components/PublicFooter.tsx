'use client';

import Link from 'next/link';
import { Brain } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Velaris</span>
            </div>
            <p className="text-sm text-gray-600">
              AI Visibility Analysis Platform. Know how AI talks about your brand.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/analyze" className="text-sm text-gray-600 hover:text-gray-900">Free Analysis</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/analyze" className="text-sm text-gray-600 hover:text-gray-900">AI Visibility Analysis</Link></li>
              <li><Link href="/hallucination-detector" className="text-sm text-gray-600 hover:text-gray-900">Brand Positioning</Link></li>
              <li><Link href="/automation" className="text-sm text-gray-600 hover:text-gray-900">Automation</Link></li>
              <li><Link href="/alerts" className="text-sm text-gray-600 hover:text-gray-900">Alerts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link></li>
              <li><Link href="/integrations" className="text-sm text-gray-600 hover:text-gray-900">Integrations</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Velaris. AI Visibility Analysis Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
