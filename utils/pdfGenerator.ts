
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComparisonResult } from '../types';

export const generateDiffPDF = (data: ComparisonResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20; // 20mm margin (~0.75 inch) matches template padding
  
  // --- COLORS & STYLES ---
  const colors = {
    headerBlue: [44, 62, 80] as [number, number, number], // #2c3e50
    textGray: [68, 68, 68] as [number, number, number], // #444
    labelGray: [44, 62, 80] as [number, number, number], // Matches header
    bgVehicle: [248, 249, 250] as [number, number, number], // #f8f9fa
    borderLine: [224, 224, 224] as [number, number, number], // #e0e0e0
    disclaimerBg: [255, 245, 245] as [number, number, number], // #fff5f5
    disclaimerBorder: [197, 48, 48] as [number, number, number], // #c53030
    disclaimerText: [197, 48, 48] as [number, number, number] // #c53030
  };

  let yPos = 20;

  // --- PAGE 1: COVER SHEET ---

  // 1. Header
  doc.setFontSize(22); // HTML H1 style
  doc.setTextColor(...colors.headerBlue);
  doc.setFont("helvetica", "bold");
  doc.text("Supplement Analysis Report", margin, yPos);
  
  yPos += 7;
  doc.setFontSize(10); 
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
  
  yPos += 5;
  doc.setDrawColor(...colors.headerBlue);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;

  // 2. Vehicle Info Section (Gray Box)
  const boxPadding = 6;
  const contentWidth = pageWidth - (margin * 2) - (boxPadding * 2);
  
  // Pre-calculate wrapped text for Vehicle description
  doc.setFontSize(11); 
  doc.setFont("helvetica", "normal");
  const vehicleDescLines = doc.splitTextToSize(data.vehicleInfo || "N/A", contentWidth);
  
  // Calculate Height
  const lineHeight = 6;
  const itemSpacing = 6;
  const sectionHeight = (boxPadding * 2) 
    + lineHeight // Claim
    + itemSpacing 
    + lineHeight // Vehicle Label
    + (vehicleDescLines.length * lineHeight) // Vehicle Desc
    + itemSpacing 
    + lineHeight; // VIN

  // Draw Gray Box
  doc.setFillColor(...colors.bgVehicle);
  doc.setDrawColor(...colors.bgVehicle); 
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), sectionHeight, 2, 2, 'F');
  
  let boxY = yPos + boxPadding + lineHeight - 1; // baseline adjustment
  
  // Item 1: Claim
  doc.setTextColor(...colors.labelGray);
  doc.setFont("helvetica", "bold");
  doc.text("Claim #:", margin + boxPadding, boxY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textGray);
  doc.text(data.claimNumber, margin + boxPadding + 30, boxY);
  
  boxY += itemSpacing + lineHeight;
  
  // Item 2: Vehicle
  doc.setTextColor(...colors.labelGray);
  doc.setFont("helvetica", "bold");
  doc.text("Vehicle:", margin + boxPadding, boxY - lineHeight); 
  doc.setTextColor(...colors.textGray);
  doc.setFont("helvetica", "normal");
  doc.text(vehicleDescLines, margin + boxPadding, boxY - lineHeight + 6); 
  
  boxY += (vehicleDescLines.length * lineHeight) + itemSpacing;
  
  // Item 3: VIN
  doc.setTextColor(...colors.labelGray);
  doc.setFont("helvetica", "bold");
  doc.text("VIN:", margin + boxPadding, boxY - lineHeight);
  doc.setTextColor(...colors.textGray);
  doc.setFont("helvetica", "normal");
  doc.text(data.vin, margin + boxPadding + 20, boxY - lineHeight);

  yPos += sectionHeight + 15;

  // 3. Financial Summary (Hierarchical)
  
  // -- Intro Text --
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textGray);
  doc.text("Below shows your original estimate, what was added, and your new total after all changes.", margin, yPos);
  yPos += 8;

  // -- Main Total Header --
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.labelGray);
  doc.text("Total Estimate", margin, yPos);
  yPos += 6;

  // -- Main Total Equation (Mixed Styling) --
  doc.setFontSize(10);
  doc.setTextColor(...colors.textGray);
  
  let currentX = margin;

  // Segment 1: Original
  doc.setFont("helvetica", "normal");
  const mainP1 = `Original Estimate ($${data.financials.total.original.toFixed(2)}) `;
  doc.text(mainP1, currentX, yPos);
  currentX += doc.getTextWidth(mainP1);

  // Segment 2: ADDED (Bold)
  doc.setFont("helvetica", "bold");
  const mainP2 = `ADDED ($${data.financials.total.added.toFixed(2)})`;
  doc.text(mainP2, currentX, yPos);
  currentX += doc.getTextWidth(mainP2);

  // Segment 3: = TOTAL
  doc.setFont("helvetica", "normal");
  const mainP3 = ` = TOTAL `;
  doc.text(mainP3, currentX, yPos);
  currentX += doc.getTextWidth(mainP3);

  // Segment 4: Final (Bold)
  doc.setFont("helvetica", "bold");
  const mainP4 = `($${data.financials.total.final.toFixed(2)})`;
  doc.text(mainP4, currentX, yPos);
  
  yPos += 8; // Spacing before sub-items

  // Helper to draw indented breakdown items with bolding
  const drawBreakdownItem = (label: string, orig: number, added: number, final: number) => {
    const indent = margin + 8; // Indent 8mm
    
    // Bullet Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.labelGray);
    doc.text(`• ${label}`, indent, yPos);
    yPos += 5;

    // Equation with mixed styling
    doc.setTextColor(...colors.textGray);
    let itemX = indent;
    const type = label.includes("Parts") ? "Parts" : "Labor";

    // Seg 1
    doc.setFont("helvetica", "normal");
    const p1 = `Original ${type} ($${orig.toFixed(2)}) `;
    doc.text(p1, itemX, yPos);
    itemX += doc.getTextWidth(p1);

    // Seg 2: ADDED (Bold)
    doc.setFont("helvetica", "bold");
    const p2 = `ADDED ($${added.toFixed(2)})`;
    doc.text(p2, itemX, yPos);
    itemX += doc.getTextWidth(p2);

    // Seg 3
    doc.setFont("helvetica", "normal");
    const p3 = ` = TOTAL `;
    doc.text(p3, itemX, yPos);
    itemX += doc.getTextWidth(p3);

    // Seg 4
    doc.setFont("helvetica", "bold");
    const p4 = `($${final.toFixed(2)})`;
    doc.text(p4, itemX, yPos);
    
    yPos += 8;
  };

  // -- Indented Sub-items --
  drawBreakdownItem("Parts Total", data.financials.parts.original, data.financials.parts.added, data.financials.parts.final);
  drawBreakdownItem("Labor Total", data.financials.labor.original, data.financials.labor.added, data.financials.labor.final);

  // Formula Text (Moved from top)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textGray);
  doc.text("Parts Total + Labor Total = Total Estimate", margin + 8, yPos);
  yPos += 8;

  // Divider Line after the whole block
  yPos += 2;
  doc.setDrawColor(...colors.borderLine);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;

  // 4. Disclaimer Box (Red)
  const dTitle = "IMPORTANT DISCLAIMER:";
  const dText1 = "ALL ESTIMATE AND SUPPLEMENT PAYMENTS WILL BE ISSUED TO THE VEHICLE OWNER.";
  const dText2 = "The repair contract exists solely between the vehicle owner and the repair facility. The insurance company is not involved in this agreement and does not assume responsibility for repair quality, timelines, or costs. All repair-related disputes must be handled directly with the repair facility.";
  const dText3 = "Please note: Any misrepresentation of repairs, labor, parts, or supplements—including unnecessary operations or inflated charges—may constitute insurance fraud and will result in further review or investigation.";

  doc.setFontSize(10);
  const dContentWidth = pageWidth - (margin * 2) - (boxPadding * 2);
  const dLines1 = doc.splitTextToSize(dText1, dContentWidth);
  const dLines2 = doc.splitTextToSize(dText2, dContentWidth);
  const dLines3 = doc.splitTextToSize(dText3, dContentWidth);
  
  // Calculate Box Height
  const dHeight = (boxPadding * 2) 
    + 5 // Title
    + 4 // Spacing
    + (dLines1.length * 5) + 3
    + (dLines2.length * 5) + 3
    + (dLines3.length * 5);

  // Draw Red Box
  doc.setFillColor(...colors.disclaimerBg);
  doc.setDrawColor(...colors.disclaimerBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), dHeight, 2, 2, 'FD');
  
  let dY = yPos + boxPadding + 4;
  
  doc.setTextColor(...colors.disclaimerText);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(dTitle, margin + boxPadding, dY);
  dY += 7;
  
  // Disclaimer Text
  doc.setFontSize(10);
  doc.text(dLines1, margin + boxPadding, dY);
  dY += (dLines1.length * 5) + 3;
  
  doc.setFont("helvetica", "normal");
  doc.text(dLines2, margin + boxPadding, dY);
  dY += (dLines2.length * 5) + 3;
  
  doc.text(dLines3, margin + boxPadding, dY);

  // --- PAGE 2: SUMMARY TABLE ---
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.text("What was Added", margin, 20);

  const summaryBody: any[] = [];
  const summaries = data.categorySummaries || [];
  
  // Filter active summaries and sort by addedTotal (highest first)
  const activeSummaries = summaries.filter(cat => Math.abs(cat.addedTotal) > 0.01);
  activeSummaries.sort((a, b) => b.addedTotal - a.addedTotal);

  activeSummaries.forEach(cat => {
    summaryBody.push([
      cat.categoryName.toUpperCase(),
      { 
        content: `$${cat.addedTotal.toFixed(2)}`, 
        styles: { halign: 'right' } 
      }
    ]);
  });

  // Added Tax Row
  summaryBody.push([
    { content: 'ADDED TAX', styles: { fontStyle: 'bold', halign: 'right', fillColor: [250, 250, 250], textColor: [80, 80, 80] } },
    { content: `$${data.financials.tax.added.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [250, 250, 250], textColor: [80, 80, 80] } }
  ]);

  // Total Added Row
  summaryBody.push([
    { content: 'TOTAL ADDED VALUE', styles: { halign: 'right', fontStyle: 'bold', fillColor: [20, 184, 166], textColor: [255, 255, 255] } },
    { content: `$${data.financials.total.added.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [20, 184, 166], textColor: [255, 255, 255] } }
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Supplement Header', 'Added Amount']],
    body: summaryBody,
    headStyles: { fillColor: [20, 184, 166] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 60, halign: 'right' },
    },
  });

  // --- PAGE 3: NEEDS WARRANTY SECTION ---
  doc.addPage();

  // Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.text("NEEDS WARRANTY", margin, 20);

  // Disclaimer Text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  
  const warrantyText = "Based on the body shop you selected, the following parts should be covered under their warranty since they were newly installed or replaced. Please note that Fred Loya is not involved in, nor responsible for, any repairs performed by the body shop.";
  
  const splitWarranty = doc.splitTextToSize(warrantyText, pageWidth - (margin * 2));
  doc.text(splitWarranty, margin, 30);

  // Items Table Removed

  doc.save('supplement-analysis-report.pdf');
};
