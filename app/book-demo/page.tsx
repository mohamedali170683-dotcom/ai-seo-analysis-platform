"use client";

import { Calendar, ArrowLeft, Clock, Video, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BookDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Book a Demo</h1>
            <p className="text-white/90">
              See Velaris Professional in action with a personalized walkthrough
            </p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left side - Benefits */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What you&apos;ll see:</h2>
                <ul className="space-y-4">
                  {[
                    "Live analysis of your brand across 4 AI platforms",
                    "How competitors compare in AI visibility",
                    "Technical audit walkthrough with real recommendations",
                    "Q&A with our AI visibility experts",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                    <Clock className="w-4 h-4" />
                    30 minutes
                  </div>
                  <p className="text-sm text-gray-600">
                    Quick, focused demo tailored to your needs. No sales pressure.
                  </p>
                </div>
              </div>

              {/* Right side - Placeholder calendar */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Select a Time</h3>
                </div>
                
                {/* Placeholder for Calendly embed */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-80 flex flex-col items-center justify-center text-gray-500">
                  <Calendar className="w-12 h-12 mb-4 text-gray-400" />
                  <p className="font-medium">Calendly Integration</p>
                  <p className="text-sm">Demo booking calendar will appear here</p>
                  <p className="text-xs mt-4 text-gray-400">Prototype Mode</p>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  In production, this will embed your Calendly scheduling widget
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
