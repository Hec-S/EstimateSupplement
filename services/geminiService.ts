import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ComparisonResult, LineItem, SubroResult, ValuationResult } from "../types";

// Note: process.env.API_KEY is assumed to be available as per instructions.

const docCompareSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    claimNumber: { type: Type.STRING, description: "The Insurance Claim Number found in the header." },
    vehicleInfo: { type: Type.STRING, description: "Year, Make, and Model of the vehicle." },
    vin: { type: Type.STRING, description: "Vehicle Identification Number." },
    
    financials: {
      type: Type.OBJECT,
      properties: {
        total: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.NUMBER, description: "Total Gross Amount of the Original Estimate" },
            added: { type: Type.NUMBER, description: "Net Added Amount (Supplement Total - Original Total)" },
            final: { type: Type.NUMBER, description: "Total Gross Amount of the Supplement/Final Record" }
          },
          required: ["original", "added", "final"]
        },
        parts: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.NUMBER, description: "Total Cost of Parts in Original Estimate" },
            added: { type: Type.NUMBER, description: "Net Added Parts Cost" },
            final: { type: Type.NUMBER, description: "Total Cost of Parts in Supplement/Final Record" }
          },
          required: ["original", "added", "final"]
        },
        labor: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.NUMBER, description: "Total Cost of Labor (INCLUDING Paint Supplies/Materials) in Original Estimate" },
            added: { type: Type.NUMBER, description: "Net Added Labor Cost (INCLUDING Paint Supplies/Materials)" },
            final: { type: Type.NUMBER, description: "Total Cost of Labor (INCLUDING Paint Supplies/Materials) in Supplement/Final Record" }
          },
          required: ["original", "added", "final"]
        },
        tax: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.NUMBER, description: "Total Tax in Original Estimate" },
            added: { type: Type.NUMBER, description: "Net Added Tax" },
            final: { type: Type.NUMBER, description: "Total Tax in Supplement/Final Record" }
          },
          required: ["original", "added", "final"]
        }
      },
      required: ["total", "parts", "labor", "tax"]
    },

    categorySummaries: {
      type: Type.ARRAY,
      description: "List of Section Headers that have ADDED costs. Identify the Header and the Net Added amount.",
      items: {
        type: Type.OBJECT,
        properties: {
          categoryName: { type: Type.STRING, description: "The Section Header Name (e.g. 'Roof', 'Rear Bumper')" },
          finalTotal: { type: Type.NUMBER, description: "The Final Gross Total $ amount for this section." },
          finalLabor: { type: Type.NUMBER, description: "The Final Labor $ amount for this section." },
          addedTotal: { type: Type.NUMBER, description: "The NET ADDED $ amount for this section (Supplement - Original)." },
          addedLabor: { type: Type.NUMBER, description: "The NET ADDED Labor $ amount for this section." }
        },
        required: ["categoryName", "finalTotal", "finalLabor", "addedTotal", "addedLabor"]
      }
    },

    addedItems: {
      type: Type.ARRAY,
      description: "List of line items found in the supplement that were not in the original, or quantity increases.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Description of the line item" },
          category: { type: Type.STRING, description: "The specific Estimate Section Header (e.g., 'Front Bumper', 'Rear Lamp', 'Roof', 'Quarter Panel', 'Rear Body'). Use the exact header text found in the document." },
          partNumber: { type: Type.STRING, description: "The specific Part Number if available (e.g., 55396-0E090). Leave empty if not a part." },
          operation: { type: Type.STRING, description: "The Operation code found on the line (e.g., 'Repl', 'Rpr', 'R&I', 'Subl')." },
          itemType: { type: Type.STRING, enum: ["Part", "Labor", "Sublet", "Other"], description: "Classify the item type." },
          quantity: { type: Type.NUMBER, description: "The quantity added" },
          unitPrice: { type: Type.NUMBER, description: "Price per unit" },
          totalPrice: { type: Type.NUMBER, description: "Total cost of this addition" },
          reasonForAddition: { type: Type.STRING, description: "Short inference on why this was added" }
        },
        required: ["description", "category", "totalPrice", "quantity", "unitPrice", "itemType"]
      }
    }
  },
  required: ["claimNumber", "vehicleInfo", "vin", "financials", "categorySummaries", "addedItems"]
};

const subroSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    claimNumber: { type: Type.STRING },
    insuredName: { type: Type.STRING },
    dateOfLoss: { type: Type.STRING },
    vehicleInfo: { type: Type.STRING },
    demandDate: { type: Type.STRING },
    offerDate: { type: Type.STRING },
    
    liability: {
      type: Type.OBJECT,
      properties: {
        demandPercent: { type: Type.NUMBER },
        offerPercent: { type: Type.NUMBER },
        isDisputed: { type: Type.BOOLEAN }
      }
    },

    totalDemand: { type: Type.NUMBER },
    totalOffer: { type: Type.NUMBER },
    totalGap: { type: Type.NUMBER },
    gapPercentage: { type: Type.NUMBER },

    rentalSpecifics: {
      type: Type.OBJECT,
      properties: {
        demandDays: { type: Type.NUMBER },
        demandRate: { type: Type.NUMBER },
        offerDays: { type: Type.NUMBER },
        offerRate: { type: Type.NUMBER }
      }
    },

    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          demandTotal: { type: Type.NUMBER },
          offerTotal: { type: Type.NUMBER },
          delta: { type: Type.NUMBER }
        }
      }
    },

    lineItemDisputes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          itemDescription: { type: Type.STRING },
          demandAmount: { type: Type.NUMBER },
          offerAmount: { type: Type.NUMBER },
          delta: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ['RESOLVED', 'IMPROVED', 'DISPUTED', 'WORSENED'] },
          notes: { type: Type.STRING }
        }
      }
    },

    negotiationDirection: { type: Type.STRING, enum: ['POSITIVE', 'STALLED', 'NEGATIVE'] },
    summaryText: { type: Type.STRING, description: "A detailed 2-3 sentence executive summary explaining the main changes." }
  },
  required: ["claimNumber", "totalDemand", "totalOffer", "summaryText"]
};

const valuationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vehicleInfo: {
      type: Type.OBJECT,
      properties: {
        vin: { type: Type.STRING, description: "The 17-character Vehicle Identification Number. Scan headers of BOTH docs. Return 'N/A' if completely missing." },
        yearMakeModel: { type: Type.STRING, description: "e.g., 2020 Toyota Camry. Scan headers of BOTH docs." },
        trim: { type: Type.STRING, description: "Trim level if available." }
      },
      required: ["vin", "yearMakeModel"]
    },
    comparison: {
      type: Type.OBJECT,
      properties: {
        cccTotalValue: { type: Type.NUMBER, description: "Total Adjusted Value from CCC" },
        carfaxTotalValue: { type: Type.NUMBER, description: "Retail Value from CarFax History Based Value" },
        valueDelta: { type: Type.NUMBER },
        cccMileage: { type: Type.NUMBER },
        carfaxMileage: { type: Type.NUMBER },
        matchStatus: { type: Type.STRING, enum: ['PERFECT_MATCH', 'MINOR_DISCREPANCIES', 'SIGNIFICANT_OUTLIERS'] }
      },
      required: ["cccTotalValue", "carfaxTotalValue", "matchStatus"]
    },
    outliers: {
      type: Type.ARRAY,
      description: "List ANY discrepancies found between the two reports (Options, Mileage, Condition, etc.)",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of mismatch (e.g. Mileage, Options, Condition)" },
          description: { type: Type.STRING, description: "THE SPECIFIC ITEM NAME (e.g., 'Navigation System', 'Panoramic Roof', 'Leather Seats'). Do NOT use generic terms." },
          cccValue: { type: Type.STRING, description: "Value as stated in CCC" },
          carfaxValue: { type: Type.STRING, description: "Value as stated in CarFax" },
          severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
          note: { type: Type.STRING }
        },
        required: ["category", "description", "severity"]
      }
    },
    summary: { type: Type.STRING, description: "A short text summary of the comparison results." }
  },
  required: ["vehicleInfo", "comparison", "outliers", "summary"]
};

// Permissive safety settings to avoid blocking insurance/damage content
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

// Helper to clean markdown code blocks from response and repair common JSON syntax errors
const cleanJsonText = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  
  // Remove markdown wrapping
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

  // Find first '{' and last '}' to extract the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Repair common JSON errors:
  // 1. Missing comma between objects: } { -> }, {
  cleaned = cleaned.replace(/}\s*{/g, "},{");
  
  // 2. Trailing commas before closing brace/bracket
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  return cleaned;
};

export const analyzeDocuments = async (
  originalBase64: string,
  originalMime: string,
  supplementBase64: string,
  supplementMime: string
): Promise<ComparisonResult> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Explicitly inject schema into prompt to avoid 500 errors from strict server-side schema validation on large tokens
  const systemInstruction = `
    You are an expert Insurance Adjuster and AI Document Analyst.
    Your task is to compare an "Original Estimate" PDF against a "Supplement Record" PDF.

    CRITICAL DOCUMENT STRUCTURE DEFINITIONS:
    1. "ESTIMATE TOTALS" TABLE: In the Supplement PDF, the table labeled "ESTIMATE TOTALS" (and the detailed line items listed BEFORE it) represents the CUMULATIVE FINAL STATE (Original Estimate + All Supplements combined). 
       - USE THIS TABLE to extract the "Final" values for the schema (e.g., financials.total.final, financials.parts.final).
       - The line items in this main section represent the complete final list.
       
    2. "TOTALS SUMMARY" TABLE: In the Supplement PDF, the table labeled "TOTALS SUMMARY" (and the short list of items near it) represents the SUPPLEMENT SPECIFIC changes/additions. 
       - Values here represent the "Added" or "Delta" amounts.

    OBJECTIVES:
    1. HEADER INFO: Extract Claim Number, Vehicle (Year/Make/Model), and VIN. If missing, use "N/A".
    
    2. FINANCIALS: 
       - Locate the "ESTIMATE TOTALS" section in the Supplement PDF to get the TRUE Final Gross Total, Final Parts, Final Labor.
       - Locate the "Totals" in the Original Estimate to get Original values.
       - "Total Labor" = All Labor Operations + Paint Supplies/Materials + Hazardous Materials. (Paint Supplies are Labor, NOT Parts).
       - Calculate "Added" values: (Final - Original) OR extract directly from "TOTALS SUMMARY" if available.
    
    3. LINE ITEMS & HEADERS (CRITICAL):
       - PRIMARY IDENTIFICATION RULE: Look for line items marked with Supplement codes "S01", "S02", "S03", "S04", "S05", etc.
       - Any line item containing "S01", "S02", "S03", "S04", or "S05" is DEFINITIVELY an added supplement item and MUST be extracted into 'addedItems'.
       
       - PART NUMBERS, OPERATIONS & TYPES:
         - Extract the "Part Number" for any item that is a replacement part. These are usually alphanumeric codes (e.g., "55396-0E090") listed next to the description.
         - Extract the "Operation" code (e.g., 'Repl', 'Rpr', 'R&I', 'Subl') usually found in the first column or near the description.
         - Classify 'itemType' accurately: 'Part' (physical parts), 'Labor' (repair hours, refinish hours), 'Sublet' (towing, glass), or 'Other'.
         - Paint Supplies are 'Labor' or 'Other', NOT 'Part'.
         
       - SEQUENTIAL HEADER SCANNING: 
         - Scan the document top-to-bottom.
         - Identify EVERY Estimate Section Header (e.g., "FRONT BUMPER", "REAR LAMPS", "ROOF", "QUARTER PANEL", "LID/GATE", "REAR BODY", "ALIGNMENT").
         - When you find a Supplement Item (S01, etc.), look IMMEDIATELY ABOVE it to find which Section Header it belongs to.
         
    4. CATEGORY SUMMARIES (Page 2 Requirement):
       - This section MUST show the "ADDED" amounts, NOT just Final totals.
       - For every Section Header found in the Supplement items:
         - Calculate 'addedTotal': The sum of the Net Added costs for that section.
         - Calculate 'addedLabor': The sum of the Net Added Labor costs for that section.
    
    OUTPUT:
    Return strictly structured JSON matching the following schema. Do not use Markdown formatting in the response.
    
    ${JSON.stringify(docCompareSchema, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // responseSchema: docCompareSchema, // Removed to prevent INTERNAL 500 errors on large complex docs
        temperature: 0.1,
        maxOutputTokens: 65536, // Maximum for high-volume JSON output
        safetySettings: SAFETY_SETTINGS,
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: "DOCUMENT 1: ORIGINAL ESTIMATE" },
            { inlineData: { mimeType: originalMime, data: originalBase64 } },
            { text: "DOCUMENT 2: SUPPLEMENT RECORD" },
            { inlineData: { mimeType: supplementMime, data: supplementBase64 } },
            { text: "Analyze the differences. Remember: 'Estimate Totals' = Cumulative Final. 'Totals Summary' = Supplement Specific. Extract header info, financial breakdowns. Identify all S01+ items, extract PART NUMBERS and OPERATION CODES (Repl, Rpr), and ensure itemType is correct." }
          ]
        }
      ]
    });

    let text = response.text;
    if (!text) {
      console.warn("No text in response. Finish Reason:", response.candidates?.[0]?.finishReason);
      throw new Error(`AI generated empty response. Finish Reason: ${response.candidates?.[0]?.finishReason || 'Unknown'}`);
    }

    text = cleanJsonText(text);

    const result = JSON.parse(text) as ComparisonResult;
    
    // Polyfill totalAddedValue for backward compatibility if needed, or ensure it matches
    result.totalAddedValue = result.financials.total.added;

    return result;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    const errorMessage = error.toString();
    if (errorMessage.includes("xhr error") || errorMessage.includes("Rpc failed") || errorMessage.includes("500") || errorMessage.includes("503")) {
      throw new Error("Network error or AI Service Overload. Please try again or compress PDFs to under 4MB.");
    }
    
    if (errorMessage.includes("JSON") || errorMessage.includes("Expected")) {
       throw new Error("Analysis failed. The document output was incomplete or invalid JSON.");
    }

    throw new Error(error.message || "Failed to analyze documents.");
  }
};

export const analyzeSubroDocuments = async (
  demandBase64: string,
  demandMime: string,
  offerBase64: string,
  offerMime: string
): Promise<SubroResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Insurance Subrogation and Arbitration Analyst. 
    Your job is to compare an Initial Demand Package against a Counter Offer/Arbitration Response.

    OBJECTIVES:
    1. METADATA: Extract Claim #, Insured Name, Date of Loss.
    2. LIABILITY: Look for liability arguments. Extract percentages admitted by both sides.
    3. RENTAL: Subrogation disputes often focus on Rental Days and Daily Rate. Extract these specifically.
    4. FINANCIALS:
       - Auto Damage (Repairs): Demand vs Offer.
       - Towing/Storage/Admin fees: Demand vs Offer.
       - Salvage: Demand vs Offer.
    5. DISPUTES:
       - Identify specific line items where the Offer < Demand.
       - Categorize status:
         - RESOLVED (Offer == Demand)
         - IMPROVED (Offer > 0 but < Demand)
         - DISPUTED (Offer is 0 or significantly low)
         - WORSENED (Offer is lower than previous or unexpected)
       - IMPORTANT: Focus on items with a Delta > $5.00 to save tokens. Group insignificant miscellaneous items if needed.
    6. EXECUTIVE SUMMARY (CRITICAL):
       - In the 'summaryText' field, provide a high-quality, 2-3 sentence narrative overview.
       - Explicitly state the MAIN reason for the gap (e.g., "The Counter Offer accepted 100% liability but reduced rental duration by 5 days and reduced the daily rate by $10.")
       - Mention if the negotiation is progressing positively or stalled.
    
    OUTPUT FORMAT:
    Return strictly structured JSON matching the following schema:
    ${JSON.stringify(subroSchema, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // responseSchema: subroSchema, // Removed to prevent 500 errors
        temperature: 0.1,
        maxOutputTokens: 65536, // Increased to prevent truncation
        safetySettings: SAFETY_SETTINGS,
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: "DOCUMENT 1: INITIAL DEMAND" },
            { inlineData: { mimeType: demandMime, data: demandBase64 } },
            { text: "DOCUMENT 2: COUNTER OFFER / ARBITRATION RESPONSE" },
            { inlineData: { mimeType: offerMime, data: offerBase64 } },
            { text: "Perform a detailed subrogation audit. Compare demand vs offer. Analyze liability, rental days/rate, and repair costs. Provide a strong Executive Summary narrative." }
          ]
        }
      ]
    });

    let text = response.text;
    if (!text) {
      console.warn("No text in subro response. Finish Reason:", response.candidates?.[0]?.finishReason);
      throw new Error(`AI generated empty response. Finish Reason: ${response.candidates?.[0]?.finishReason || 'Unknown'}`);
    }

    text = cleanJsonText(text);

    return JSON.parse(text) as SubroResult;

  } catch (error: any) {
    console.error("Subro Analysis Error:", error);
    const errorMessage = error.toString();
    if (errorMessage.includes("xhr error") || errorMessage.includes("Rpc failed") || errorMessage.includes("500") || errorMessage.includes("503")) {
      throw new Error("Network error or AI Service Overload. Please retry.");
    }
    if (errorMessage.includes("JSON") || errorMessage.includes("Expected")) {
       throw new Error("Analysis failed due to response complexity. Please try again.");
    }
    throw new Error(error.message || "Failed to analyze subro documents.");
  }
};

export const analyzeValuationDocuments = async (
  cccBase64: string,
  cccMime: string,
  carfaxBase64: string,
  carfaxMime: string
): Promise<ValuationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Auto Valuation Analyst. 
    Your job is to compare a "CCC Valuation Report" against a "CarFax Valuation/History Report".

    CRITICAL PRIORITY: DATA EXTRACTION & MAPPING

    1. VEHICLE IDENTIFICATION (Find in Headers):
       - CCC Report: Scan the top section (Page 1-4) for "VIN", "Year", "Make", "Model", "Trim".
       - CarFax Report: Scan the top Blue Banner or "Subject Vehicle" section on Page 1.
       - ACTION: Extract the VIN (17-char) and the full Vehicle String (e.g., "2022 BMW X5 xDrive40i").

    2. VALUE EXTRACTION (Find Specific Labels):
       - CCC Value: Locate the "VALUATION SUMMARY" section (usually Page 1). Extract the "Adjusted Vehicle Value".
         * DO NOT use "Base Vehicle Value".
         * DO NOT use "Total" (which includes tax).
         * Target: "Adjusted Vehicle Value".
       - CarFax Value: Locate the large blue value on Page 1 labeled "Your Vehicle's Value" OR Page 3 "History Based Value".
       - ACTION: Populate 'cccTotalValue' and 'carfaxTotalValue'.

    3. MILEAGE EXTRACTION:
       - CCC: Look under "VEHICLE INFORMATION" -> "Odometer" (e.g., 42,894).
       - CarFax: Look on Page 1 under "Odometer" OR "Your Vehicle Details" -> "Good" -> "42,894 miles".
       - ACTION: Populate 'cccMileage' and 'carfaxMileage'.

    4. OUTLIER ANALYSIS (The Core Task):
       - COMPARE OPTIONS (High Severity):
         * Scan CCC's "VEHICLE EQUIPMENT" and "COMPARABLE VEHICLES" columns for the Loss Vehicle (check marks vs red Xs).
         * Scan CarFax's "Your Vehicle Details"looking for Green Checkmarks next to features.
         * RULE: If CarFax says a feature is PRESENT (Green Check) but CCC says it is ABSENT (Red X or missing from Equipment list), this is a HIGH SEVERITY OUTLIER.
         * IMPORTANT: When populating the 'description' field for an outlier, use the SPECIFIC FEATURE NAME (e.g., "Panoramic Moonroof", "Navigation System"). Do NOT use generic terms like "Options".
       
       - COMPARE CONDITION:
         * CCC uses terms like "Average", "Moderate Wear", "Dealer", "Private".
         * CarFax uses terms like "Good", "Great", "Excellent".
         * NOTE: "Moderate Wear" in CCC often equals "Good" in CarFax. Do NOT flag this as an outlier unless the difference is extreme (e.g., "Poor" vs "Excellent").
         
       - COMPARE MILEAGE:
         * Flag if difference > 500 miles.

    5. OUTPUT RULES:
       - Return strictly structured JSON.
       - Return 'matchStatus': 'PERFECT_MATCH', 'MINOR_DISCREPANCIES', or 'SIGNIFICANT_OUTLIERS'.
       - Return ALL found outliers in the 'outliers' array.
       - Ensure you place a comma between every item in the 'outliers' array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // Removed strict responseSchema to prevent syntax errors on arrays
        temperature: 0.2,
        maxOutputTokens: 16384,
        safetySettings: SAFETY_SETTINGS,
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: "DOCUMENT 1: CCC VALUATION REPORT" },
            { inlineData: { mimeType: cccMime, data: cccBase64 } },
            { text: "DOCUMENT 2: CARFAX VALUATION REPORT" },
            { inlineData: { mimeType: carfaxMime, data: carfaxBase64 } },
            { text: "Compare these two reports. EXTRACT Adjusted Value vs Retail Value. CHECK Mileage. CHECK Options (CarFax Checkmarks vs CCC Equipment List). Return JSON matching the schema: " + JSON.stringify(valuationSchema) }
          ]
        }
      ]
    });

    let text = response.text;
    if (!text) {
      throw new Error(`AI generated empty response.`);
    }

    text = cleanJsonText(text);
    return JSON.parse(text) as ValuationResult;

  } catch (error: any) {
    console.error("Valuation Analysis Error:", error);
    const errorMessage = error.toString();
    if (errorMessage.includes("xhr error") || errorMessage.includes("Rpc failed") || errorMessage.includes("500") || errorMessage.includes("503")) {
       throw new Error("AI Service Overload (503). Please try again in a few moments.");
    }
    throw new Error(error.message || "Failed to analyze valuation documents.");
  }
};
