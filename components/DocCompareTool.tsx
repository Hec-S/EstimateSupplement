import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { ComparisonTable } from './ComparisonTable';
import { analyzeDocuments } from '../services/geminiService';
import { generateDiffPDF } from '../utils/pdfGenerator';
import { FileData, DocType, ComparisonResult } from '../types';

interface DocCompareToolProps {
  onBack: () => void;
}

export const DocCompareTool: React.FC<DocCompareToolProps> = ({ onBack }) => {
  const [originalFile, setOriginalFile] = useState<FileData | null>(null);
  const [supplementFile, setSupplementFile] = useState<FileData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (type: DocType, file: File, base64: string) => {
    const newData: FileData = {
      file,
      base64,
      mimeType: file.type,
      previewUrl: null
    };

    if (type === DocType.ORIGINAL) {
      setOriginalFile(newData);
    } else {
      setSupplementFile(newData);
    }
    setResult(null);
    setError(null);
  };

  const handleClear = (type: DocType) => {
    if (type === DocType.ORIGINAL) {
      setOriginalFile(null);
    } else {
      setSupplementFile(null);
    }
    setResult(null);
    setError(null);
  };

  const handleCompare = async () => {
    if (!originalFile || !supplementFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeDocuments(
        originalFile.base64,
        originalFile.mimeType,
        supplementFile.base64,
        supplementFile.mimeType
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      generateDiffPDF(result);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Back to Dashboard"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                <i className="fas fa-layer-group"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">DocCompare<span className="text-brand-500">AI</span></h1>
            </div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            <i className="fas fa-shield-alt text-brand-500"></i>
            <span>Secure Processing</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Compare Estimates & Supplements</h2>
          <p className="text-slate-600">
            Upload your original estimate and the supplement record. Our AI will extract line items, 
            identify additions, and generate a clean PDF report for you.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="h-64">
            <FileUploader 
              type={DocType.ORIGINAL} 
              fileData={originalFile} 
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              disabled={isAnalyzing}
            />
          </div>
          <div className="h-64">
            <FileUploader 
              type={DocType.SUPPLEMENT} 
              fileData={supplementFile} 
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleCompare}
            disabled={!originalFile || !supplementFile || isAnalyzing}
            className={`
              relative px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
              flex items-center gap-3 min-w-[240px] justify-center
              ${!originalFile || !supplementFile 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : isAnalyzing 
                  ? 'bg-brand-600 text-white cursor-wait' 
                  : 'bg-brand-500 hover:bg-brand-600 text-white transform hover:-translate-y-0.5'
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Analyzing Documents...</span>
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i>
                <span>Analyze & Compare</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 animate-fade-in-up">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Comparison Results</h2>
              <button 
                onClick={handleDownload}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-file-pdf"></i>
                Download PDF
              </button>
            </div>
            
            <ComparisonTable result={result} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} DocCompare AI. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};