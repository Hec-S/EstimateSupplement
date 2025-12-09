
export interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reasonForAddition?: string;
  partNumber?: string;
  itemType?: 'Part' | 'Labor' | 'Sublet' | 'Other';
  operation?: string; // e.g. "Repl", "Rpr", "R&I"
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

// --- SUBRO/ARB APP TYPES ---

export enum SubroDocType {
  DEMAND = 'Initial Demand',
  OFFER = 'Counter Offer/Arb'
}

export interface SubroDispute {
  category: string;
  itemDescription: string;
  demandAmount: number;
  offerAmount: number;
  delta: number;
  status: 'RESOLVED' | 'IMPROVED' | 'DISPUTED' | 'WORSENED';
  notes: string; // Reason for dispute or resolution
}

export interface SubroCategory {
  name: string; // e.g., "Auto Damage", "Rental", "Towing", "Salvage"
  demandTotal: number;
  offerTotal: number;
  delta: number;
}

export interface SubroResult {
  // Metadata
  claimNumber: string;
  insuredName: string;
  dateOfLoss: string;
  vehicleInfo: string;
  
  // High Level
  demandDate: string;
  offerDate: string;
  liability: {
    demandPercent: number;
    offerPercent: number;
    isDisputed: boolean;
  };
  
  // Financials
  totalDemand: number;
  totalOffer: number;
  totalGap: number; // demand - offer
  gapPercentage: number; 

  // Breakdowns
  categories: SubroCategory[];
  rentalSpecifics?: {
    demandDays: number;
    demandRate: number;
    offerDays: number;
    offerRate: number;
  };

  // Detailed Disputes
  lineItemDisputes: SubroDispute[];
  
  // Analysis
  negotiationDirection: 'POSITIVE' | 'STALLED' | 'NEGATIVE';
  summaryText: string;
}

// --- VALUATION COMPARE TYPES ---

export enum ValuationDocType {
  CCC = 'CCC Valuation Report',
  CARFAX = 'CarFax Valuation Report'
}

export interface ValuationOutlier {
  category: string; // e.g., "Mileage", "Condition", "Options", "Value"
  description: string;
  cccValue: string | number;
  carfaxValue: string | number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW'; // High = Major value impact
  note: string;
}

export interface ValuationResult {
  vehicleInfo: {
    vin: string;
    yearMakeModel: string;
    trim: string;
  };
  
  comparison: {
    cccTotalValue: number;
    carfaxTotalValue: number;
    valueDelta: number;
    
    cccMileage: number;
    carfaxMileage: number;
    
    matchStatus: 'PERFECT_MATCH' | 'MINOR_DISCREPANCIES' | 'SIGNIFICANT_OUTLIERS';
  };

  outliers: ValuationOutlier[];
  
  summary: string;
}
