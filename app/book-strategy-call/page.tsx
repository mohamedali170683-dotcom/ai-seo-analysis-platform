"use client";

import { Calendar, ArrowLeft, Clock, Users, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function BookStrategyCallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Book a Strategy Call</h1>
            <p className="text-white/90">
              Discuss your AI visibility goals with our expert team
            </p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left side - Benefits */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Partner Benefits:</h2>
                <ul className="space-y-4">
                  {[
                    "Unlimited analyses across all your brands",
                    "Monthly 2-hour strategy sessions",
                    "Dedicated account manager",
                    "Implementation support & code snippets",
                    "Private Slack channel for async questions",
                    "White-label reports for your clients",
                    "Full API access for integrations",
                    "Daily monitoring alerts",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                    <Clock className="w-4 h-4" />
                    45 minutes
                  </div>
                  <p className="text-sm text-gray-600">
                    In-depth discussion about your AI visibility strategy and how the Partner tier can help you achieve your goals.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                    <Users className="w-4 h-4" />
                    Who This Is For
                  </div>
                  <p className="text-sm text-gray-700">
                    Marketing teams, agencies, and enterprise brands who need comprehensive AI visibility monitoring and strategic guidance.
                  </p>
                </div>
              </div>

              {/* Right side - Placeholder calendar */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Select a Time</h3>
                </div>
                
                {/* Placeholder for Calendly embed */}
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-lg h-80 flex flex-col items-center justify-center text-gray-500">
                  <Calendar className="w-12 h-12 mb-4 text-amber-400" />
                  <p className="font-medium">Calendly Integration</p>
                  <p className="text-sm">Strategy call booking will appear here</p>
                  <p className="text-xs mt-4 text-gray-400">Prototype Mode</p>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  In production, this will embed your Calendly scheduling widget
                </p>
              </div>
            </div>
          </div>

          {/* What to expect section */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
            <h3 className="text-lg font-semibold mb-4 text-center">What to Expect on the Call</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Discovery",
                  description: "We'll understand your current AI visibility challenges and goals"
                },
                {
                  step: "2",
                  title: "Strategy",
                  description: "Review your visibility data and discuss optimization opportunities"
                },
                {
                  step: "3",
                  title: "Next Steps",
                  description: "Create a customized plan for improving your AI presence"
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full text-white font-bold mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
