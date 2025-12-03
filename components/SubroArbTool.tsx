
import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { analyzeSubroDocuments } from '../services/geminiService';
import { FileData, SubroDocType, SubroResult } from '../types';

interface SubroArbToolProps {
  onBack: () => void;
}

export const SubroArbTool: React.FC<SubroArbToolProps> = ({ onBack }) => {
  const [demandFile, setDemandFile] = useState<FileData | null>(null);
  const [offerFile, setOfferFile] = useState<FileData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SubroResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (type: SubroDocType, file: File, base64: string) => {
    const newData: FileData = {
      file,
      base64,
      mimeType: file.type,
      previewUrl: null
    };

    if (type === SubroDocType.DEMAND) {
      setDemandFile(newData);
    } else {
      setOfferFile(newData);
    }
    setResult(null);
    setError(null);
  };

  const handleClear = (type: SubroDocType) => {
    if (type === SubroDocType.DEMAND) {
      setDemandFile(null);
    } else {
      setOfferFile(null);
    }
    setResult(null);
    setError(null);
  };

  const handleCompare = async () => {
    if (!demandFile || !offerFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeSubroDocuments(
        demandFile.base64,
        demandFile.mimeType,
        offerFile.base64,
        offerFile.mimeType
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during subro analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <i className="fas fa-gavel"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Subro/Arb<span className="text-indigo-600">Audit</span></h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro */}
        {!result && (
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Audit Negotiation Documents</h2>
            <p className="text-slate-600">
              Upload the Initial Demand and the Counter Offer/Arbitration response. 
              We'll analyze liability, financial gaps, and specific line item disputes.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`h-64 ${result ? 'hidden md:block' : ''}`}>
            <FileUploader 
              // @ts-ignore - Reusing component but mapping enum
              type={SubroDocType.DEMAND} 
              fileData={demandFile} 
              // @ts-ignore
              onFileSelect={(t, f, b) => handleFileSelect(SubroDocType.DEMAND, f, b)}
              // @ts-ignore
              onClear={() => handleClear(SubroDocType.DEMAND)}
              disabled={isAnalyzing}
            />
          </div>
          <div className={`h-64 ${result ? 'hidden md:block' : ''}`}>
            <FileUploader 
              // @ts-ignore
              type={SubroDocType.OFFER} 
              fileData={offerFile} 
              // @ts-ignore
              onFileSelect={(t, f, b) => handleFileSelect(SubroDocType.OFFER, f, b)}
              // @ts-ignore
              onClear={() => handleClear(SubroDocType.OFFER)}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Action Button */}
        {!result && (
          <div className="flex justify-center mb-10">
            <button
              onClick={handleCompare}
              disabled={!demandFile || !offerFile || isAnalyzing}
              className={`
                relative px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                flex items-center gap-3 min-w-[240px] justify-center
                ${!demandFile || !offerFile 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : isAnalyzing 
                    ? 'bg-indigo-600 text-white cursor-wait' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:-translate-y-0.5'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Auditing Claims...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-search-dollar"></i>
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            {error}
          </div>
        )}

        {/* Dashboard Results */}
        {result && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* 1. Header Metadata Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Claim #</div>
                  <div className="font-mono text-slate-900 font-medium">{result.claimNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Insured</div>
                  <div className="text-slate-900 font-medium">{result.insuredName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Date of Loss</div>
                  <div className="text-slate-900 font-medium">{result.dateOfLoss}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Vehicle</div>
                  <div className="text-slate-900 font-medium truncate" title={result.vehicleInfo}>{result.vehicleInfo}</div>
                </div>
              </div>
            </div>

            {/* 2. Executive Summary (FULL WIDTH) */}
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <h3 className="text-indigo-900 font-bold uppercase text-sm mb-3 flex items-center gap-2">
                <i className="fas fa-align-left"></i>
                Audit Executive Summary
              </h3>
              <p className="text-slate-700 text-lg leading-relaxed font-medium">
                {result.summaryText}
              </p>
            </div>

            {/* 3. Key Metrics Grid - Removed Negotiation Trend, updated to 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Financial Gap */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-slate-500 font-semibold uppercase text-xs mb-4">Settlement Gap</h3>
                 <div className="flex items-end gap-2 mb-2">
                   <span className="text-3xl font-bold text-slate-800">${result.totalGap.toLocaleString()}</span>
                   <span className="text-sm font-medium text-red-500 mb-1">({result.gapPercentage.toFixed(1)}% Apart)</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                   <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${Math.max(0, 100 - result.gapPercentage)}%` }}
                   ></div>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500 font-mono">
                   <span>Offer: ${result.totalOffer.toLocaleString()}</span>
                   <span>Demand: ${result.totalDemand.toLocaleString()}</span>
                 </div>
              </div>

              {/* Liability */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                <h3 className="text-slate-500 font-semibold uppercase text-xs mb-4">Liability Dispute</h3>
                <div className="flex items-center justify-center h-24 relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">
                          {result.liability.offerPercent}%
                        </div>
                        <div className="text-xs text-slate-400">Accepted</div>
                      </div>
                   </div>
                   <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className={`${result.liability.isDisputed ? 'text-red-500' : 'text-green-500'}`} strokeDasharray={`${result.liability.offerPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                   </svg>
                </div>
                {result.liability.isDisputed && (
                  <div className="absolute bottom-4 right-4 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                    DISPUTED ({result.liability.demandPercent}% Demanded)
                  </div>
                )}
              </div>
            </div>

            {/* 4. Category Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-700">Financial Breakdown</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Demand</th>
                    <th className="px-6 py-3 text-right">Offer</th>
                    <th className="px-6 py-3 text-right">Delta</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.categories.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{cat.name}</td>
                      <td className="px-6 py-4 text-right font-mono">${cat.demandTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono">${cat.offerTotal.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${cat.delta > 50 ? 'text-red-600' : 'text-slate-400'}`}>
                        -${cat.delta.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {cat.delta === 0 ? (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Match</span>
                        ) : cat.offerTotal === 0 ? (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Denied</span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Partial</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Rental Analysis (If applicable) */}
            {result.rentalSpecifics && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Rental Analysis</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                     <div className="text-xs text-slate-500 uppercase mb-1">Days Disputed</div>
                     <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div>
                          <div className="text-sm font-semibold">Demand: {result.rentalSpecifics.demandDays} days</div>
                          <div className="text-sm font-semibold text-indigo-600">Offer: {result.rentalSpecifics.offerDays} days</div>
                        </div>
                        <div className="text-xl font-bold text-slate-400">
                          {result.rentalSpecifics.demandDays - result.rentalSpecifics.offerDays} Day Gap
                        </div>
                     </div>
                  </div>
                  <div>
                     <div className="text-xs text-slate-500 uppercase mb-1">Daily Rate</div>
                     <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div>
                          <div className="text-sm font-semibold">Demand: ${result.rentalSpecifics.demandRate}/day</div>
                          <div className="text-sm font-semibold text-indigo-600">Offer: ${result.rentalSpecifics.offerRate}/day</div>
                        </div>
                        <div className="text-xl font-bold text-slate-400">
                          ${(result.rentalSpecifics.demandRate - result.rentalSpecifics.offerRate).toFixed(2)} Diff
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Specific Line Item Disputes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                 <h3 className="font-bold text-slate-700">Detailed Line Item Disputes</h3>
              </div>
              <div className="p-6 space-y-4">
                {result.lineItemDisputes.map((item, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 ${
                    item.status === 'RESOLVED' ? 'border-green-200 bg-green-50' :
                    item.status === 'DISPUTED' ? 'border-red-200 bg-red-50' :
                    'border-amber-200 bg-amber-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">{item.category}</span>
                         <h4 className="font-bold text-slate-800 inline">{item.itemDescription}</h4>
                       </div>
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          item.status === 'RESOLVED' ? 'bg-green-200 text-green-800' :
                          item.status === 'DISPUTED' ? 'bg-red-200 text-red-800' :
                          'bg-amber-200 text-amber-800'
                       }`}>
                         {item.status}
                       </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                       <div className="bg-white/50 p-2 rounded">
                          <span className="block text-xs text-slate-500">Demand</span>
                          <span className="font-mono font-semibold">${item.demandAmount.toFixed(2)}</span>
                       </div>
                       <div className="bg-white/50 p-2 rounded">
                          <span className="block text-xs text-slate-500">Offer</span>
                          <span className="font-mono font-semibold">${item.offerAmount.toFixed(2)}</span>
                       </div>
                       <div className="bg-white/50 p-2 rounded">
                          <span className="block text-xs text-slate-500">Delta</span>
                          <span className="font-mono font-bold text-slate-700">-${item.delta.toFixed(2)}</span>
                       </div>
                    </div>
                    {item.notes && (
                      <div className="text-sm text-slate-600 italic">
                        <i className="fas fa-info-circle mr-2 opacity-50"></i>
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
