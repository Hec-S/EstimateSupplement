import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { analyzeValuationDocuments } from '../services/geminiService';
import { FileData, ValuationDocType, ValuationResult } from '../types';

interface ValuationCompareToolProps {
  onBack: () => void;
}

export const ValuationCompareTool: React.FC<ValuationCompareToolProps> = ({ onBack }) => {
  const [cccFile, setCccFile] = useState<FileData | null>(null);
  const [carfaxFile, setCarfaxFile] = useState<FileData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (type: ValuationDocType, file: File, base64: string) => {
    const newData: FileData = {
      file,
      base64,
      mimeType: file.type,
      previewUrl: null
    };

    if (type === ValuationDocType.CCC) {
      setCccFile(newData);
    } else {
      setCarfaxFile(newData);
    }
    setResult(null);
    setError(null);
  };

  const handleClear = (type: ValuationDocType) => {
    if (type === ValuationDocType.CCC) {
      setCccFile(null);
    } else {
      setCarfaxFile(null);
    }
    setResult(null);
    setError(null);
  };

  const handleCompare = async () => {
    if (!cccFile || !carfaxFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeValuationDocuments(
        cccFile.base64,
        cccFile.mimeType,
        carfaxFile.base64,
        carfaxFile.mimeType
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during valuation analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Safe data accessors
  const vehicle = result?.vehicleInfo || { vin: 'N/A', yearMakeModel: 'Unknown Vehicle', trim: '' };
  const comparison = result?.comparison || { cccTotalValue: 0, carfaxTotalValue: 0, valueDelta: 0, cccMileage: 0, carfaxMileage: 0 };
  const outliers = result?.outliers || [];
  const hasOutliers = outliers.length > 0;

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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <i className="fas fa-car-side"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Valuation<span className="text-blue-600">Check</span></h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro */}
        {!result && (
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Compare Valuation Reports</h2>
            <p className="text-slate-600">
              Upload the CCC Valuation and CarFax Report. 
              We'll detect outliers in options, condition, mileage, and value.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`h-64 ${result ? 'hidden md:block' : ''}`}>
            <FileUploader 
              // @ts-ignore
              type={ValuationDocType.CCC} 
              fileData={cccFile} 
              // @ts-ignore
              onFileSelect={(t, f, b) => handleFileSelect(ValuationDocType.CCC, f, b)}
              // @ts-ignore
              onClear={() => handleClear(ValuationDocType.CCC)}
              disabled={isAnalyzing}
            />
          </div>
          <div className={`h-64 ${result ? 'hidden md:block' : ''}`}>
            <FileUploader 
              // @ts-ignore
              type={ValuationDocType.CARFAX} 
              fileData={carfaxFile} 
              // @ts-ignore
              onFileSelect={(t, f, b) => handleFileSelect(ValuationDocType.CARFAX, f, b)}
              // @ts-ignore
              onClear={() => handleClear(ValuationDocType.CARFAX)}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Action Button */}
        {!result && (
          <div className="flex justify-center mb-10">
            <button
              onClick={handleCompare}
              disabled={!cccFile || !carfaxFile || isAnalyzing}
              className={`
                relative px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                flex items-center gap-3 min-w-[240px] justify-center
                ${!cccFile || !carfaxFile 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : isAnalyzing 
                    ? 'bg-blue-600 text-white cursor-wait' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:-translate-y-0.5'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Comparing Data...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check-double"></i>
                  <span>Compare Reports</span>
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

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Header / Vehicle */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {vehicle.yearMakeModel && vehicle.yearMakeModel !== 'Unknown Vehicle' ? vehicle.yearMakeModel : "Vehicle Info Not Found"}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-slate-500">
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm select-all">
                    VIN: {vehicle.vin || "N/A"}
                  </span>
                  <span>{vehicle.trim || ""}</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold border whitespace-nowrap text-center md:text-left ${
                !hasOutliers 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {hasOutliers ? 'Outliers Detected' : 'All Data Matches'}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h4 className="text-xs text-slate-500 font-bold uppercase mb-4">Market Value Comparison</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-slate-400">CCC Value</div>
                    <div className="text-xl font-bold text-slate-700">
                      ${comparison.cccTotalValue?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">CarFax Value</div>
                    <div className="text-xl font-bold text-slate-700">
                      ${comparison.carfaxTotalValue?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Difference</span>
                  <span className={`font-bold ${Math.abs(comparison.valueDelta ?? 0) > 500 ? 'text-red-600' : 'text-slate-500'}`}>
                    ${Math.abs(comparison.valueDelta ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h4 className="text-xs text-slate-500 font-bold uppercase mb-4">Mileage Comparison</h4>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-slate-400">CCC Mileage</div>
                    <div className="text-xl font-bold text-slate-700">
                      {comparison.cccMileage?.toLocaleString() ?? "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">CarFax Mileage</div>
                    <div className="text-xl font-bold text-slate-700">
                      {comparison.carfaxMileage?.toLocaleString() ?? "N/A"}
                    </div>
                  </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Discrepancy</span>
                  <span className={`font-bold ${Math.abs((comparison.cccMileage || 0) - (comparison.carfaxMileage || 0)) > 500 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs((comparison.cccMileage || 0) - (comparison.carfaxMileage || 0)).toLocaleString()} mi
                  </span>
                </div>
              </div>
            </div>

            {/* Outliers Table */}
            {hasOutliers ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                  <h3 className="font-bold text-amber-900">Outstanding Outliers Found</h3>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3">Issue / Discrepancy</th>
                      <th className="px-6 py-3">CCC Report</th>
                      <th className="px-6 py-3">CarFax Report</th>
                      <th className="px-6 py-3 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outliers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-base">{item.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border border-slate-200">
                               {item.category}
                             </span>
                             {item.note && <span className="text-slate-500 text-xs">{item.note}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium bg-slate-50/50">{item.cccValue}</td>
                        <td className="px-6 py-4 text-slate-700 font-medium bg-indigo-50/20">{item.carfaxValue}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${
                            item.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 
                            item.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-green-50 rounded-xl border border-green-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                  <i className="fas fa-check-circle text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">No Outliers Detected</h3>
                <p className="text-green-700">The CCC Valuation data is consistent with the CarFax report regarding options, mileage, and condition.</p>
              </div>
            )}

            {/* Summary Text */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Analysis Summary</h4>
              <p className="text-slate-700">{result.summary || "No summary available."}</p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};