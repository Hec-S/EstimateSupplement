import React, { ChangeEvent, useState } from 'react';
import { FileData, DocType } from '../types';

interface FileUploaderProps {
  type: DocType;
  fileData: FileData | null;
  onFileSelect: (type: DocType, file: File, base64: string) => void;
  onClear: (type: DocType) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  type, 
  fileData, 
  onFileSelect, 
  onClear,
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API usage (keep strictly base64)
        const base64Content = base64String.split(',')[1];
        onFileSelect(type, file, base64Content);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const isPDF = fileData?.file.type === 'application/pdf';

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <i className={`fas ${type === DocType.ORIGINAL ? 'fa-file-invoice' : 'fa-file-signature'} text-brand-500`}></i>
        {type}
      </h3>
      
      {!fileData ? (
        <label className={`
          flex-1 flex flex-col items-center justify-center 
          border-2 border-dashed border-slate-300 rounded-xl 
          bg-white hover:bg-slate-50 transition-colors cursor-pointer
          min-h-[200px] group relative
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}>
          <div className="bg-brand-50 p-4 rounded-full mb-3 group-hover:bg-brand-100 transition-colors">
            <i className="fas fa-cloud-upload-alt text-3xl text-brand-500"></i>
          </div>
          <span className="text-slate-600 font-medium">Click to upload document</span>
          <span className="text-slate-400 text-sm mt-1">PDF, PNG, or JPG (Max {MAX_FILE_SIZE_MB}MB)</span>
          
          {error && (
            <div className="absolute bottom-4 left-0 right-0 text-center px-4">
               <span className="text-red-500 text-sm font-semibold bg-white/80 px-2 py-1 rounded">{error}</span>
            </div>
          )}

          <input 
            type="file" 
            className="hidden" 
            accept="image/png, image/jpeg, application/pdf"
            onChange={handleFileChange}
            disabled={disabled}
            onClick={(e) => (e.currentTarget.value = '')} // Allow re-selecting the same file
          />
        </label>
      ) : (
        <div className="flex-1 border border-slate-200 rounded-xl bg-white p-4 relative overflow-hidden">
          <button 
            onClick={() => onClear(type)}
            className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
            title="Remove file"
          >
            <i className="fas fa-times"></i>
          </button>
          
          <div className="h-full flex flex-col items-center justify-center">
             {isPDF ? (
               <div className="text-center">
                 <i className="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
                 <p className="text-slate-700 font-medium truncate max-w-[200px]">{fileData.file.name}</p>
                 <p className="text-slate-400 text-sm">PDF Document</p>
               </div>
             ) : (
               <div className="relative w-full h-full flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
                 {/* Reconstruct data URI for preview */}
                 <img 
                   src={`data:${fileData.mimeType};base64,${fileData.base64}`} 
                   alt="Preview" 
                   className="max-w-full max-h-[200px] object-contain shadow-sm"
                 />
               </div>
             )}
             <div className="mt-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready for Analysis
                </span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};