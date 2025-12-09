
import React from 'react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-th-large"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Suite<span className="text-brand-500">OS</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <i className="fas fa-user"></i>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Apps Dashboard</h2>
          <p className="text-slate-500 mt-2 text-lg">Select a tool to verify estimates and analyze supplements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DocCompare Card */}
          <div 
            onClick={() => onNavigate('docCompare')}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden relative"
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-brand-100">
                <i className="fas fa-layer-group text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">DocCompare AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Advanced OCR analysis to compare Original Estimates vs. Supplement Records. Generates detailed PDF reports of added line items.
              </p>
              <div className="flex items-center text-brand-600 font-bold text-sm uppercase tracking-wide">
                <span>Open Tool</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-brand-500 w-0 group-hover:w-full transition-all duration-300"></div>
          </div>

          {/* Subro/Arb Audit Card */}
          <div 
            onClick={() => onNavigate('subroArb')}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden relative"
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-100">
                <i className="fas fa-gavel text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">Subro/Arb Audit</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Compare Demand vs. Counter Offer documents. Analyze liability arguments, rental rates, and line-item dispute resolutions.
              </p>
              <div className="flex items-center text-indigo-600 font-bold text-sm uppercase tracking-wide">
                <span>Open Tool</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-0 group-hover:w-full transition-all duration-300"></div>
          </div>

           {/* Valuation Compare Card (New) */}
           <div 
            onClick={() => onNavigate('valuationCompare')}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden relative"
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
                <i className="fas fa-car-side text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Valuation Compare</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Compare CCC Valuation reports against CarFax history. Detect outliers in Mileage, Options, and Condition ratings.
              </p>
              <div className="flex items-center text-blue-600 font-bold text-sm uppercase tracking-wide">
                <span>Open Tool</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-0 group-hover:w-full transition-all duration-300"></div>
          </div>
        </div>
      </main>
    </div>
  );
};
