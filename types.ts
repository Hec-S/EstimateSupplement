
export interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reasonForAddition?: string;
}

export interface FinancialBreakdown {
  original: number;
  added: number;
  final: number;
}

export interface CategorySummary {
  categoryName: string;
  finalTotal: number;
  finalLabor: number;
  addedTotal: number;
  addedLabor: number;
}

export interface ComparisonResult {
  // Header Info
  claimNumber: string;
  vehicleInfo: string;
  vin: string;

  // Financials
  financials: {
    total: FinancialBreakdown;
    parts: FinancialBreakdown;
    labor: FinancialBreakdown;
    tax: FinancialBreakdown;
  };

  // Section Summaries
  categorySummaries: CategorySummary[];

  // Line Items
  addedItems: LineItem[];
  totalAddedValue: number; // Kept for backward compatibility, same as financials.total.added
}

export interface FileData {
  file: File;
  previewUrl: string | null;
  base64: string;
  mimeType: string;
}

export enum DocType {
  ORIGINAL = 'Original Estimate',
  SUPPLEMENT = 'Supplement Record'
}
