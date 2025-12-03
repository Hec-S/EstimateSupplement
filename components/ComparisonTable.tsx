import React from 'react';
import { ComparisonResult, LineItem } from '../types';

interface ComparisonTableProps {
  result: ComparisonResult;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ result }) => {
  // Group items by category
  const groupedItems = result.addedItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, LineItem[]>);

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Info Section */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase block">Claim #</span>
          <span className="text-slate-900 font-mono font-medium">{result.claimNumber}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase block">Vehicle</span>
          <span className="text-slate-900 font-medium">{result.vehicleInfo}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase block">VIN</span>
          <span className="text-slate-900 font-mono font-medium">{result.vin}</span>
        </div>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-3 border-b border-slate-200 divide-x divide-slate-100">
        <div className="p-4 text-center">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Added</div>
          <div className="text-xl font-bold text-green-600">+${result.financials.total.added.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Total Estimate: ${result.financials.total.final.toFixed(2)}</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Parts Added</div>
          <div className="text-lg font-bold text-slate-700">+${result.financials.parts.added.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Total Parts: ${result.financials.parts.final.toFixed(2)}</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Labor Added</div>
          <div className="text-lg font-bold text-slate-700">+${result.financials.labor.added.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Total Labor: ${result.financials.labor.final.toFixed(2)}</div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-center">Qty</th>
              <th className="px-6 py-4 text-right">Unit Price</th>
              <th className="px-6 py-4 text-right">Total Added</th>
              <th className="px-6 py-4">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.addedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                  No added line items detected.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <React.Fragment key={category}>
                  {/* Category Section Header */}
                  <tr className="bg-slate-100/80">
                    <td colSpan={5} className="px-6 py-3 font-bold text-brand-800 uppercase text-xs tracking-wider border-y border-slate-200">
                      {category}
                    </td>
                  </tr>
                  {/* Items in Category */}
                  {groupedItems[category].map((item, index) => (
                    <tr key={`${category}-${index}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-600">
                        +${item.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {item.reasonForAddition}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
            
            {/* Tax Row */}
            <tr className="bg-slate-50/50">
               <td colSpan={3} className="px-6 py-4 font-bold text-slate-600 text-right">
                TAX
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-700 font-mono">
                ${result.financials.tax.added.toFixed(2)}
              </td>
              <td></td>
            </tr>

          </tbody>
          <tfoot className="bg-brand-50 border-t border-brand-100">
            <tr>
              <td colSpan={3} className="px-6 py-4 font-bold text-brand-900 text-right">
                TOTAL ADDED VALUE
              </td>
              <td className="px-6 py-4 text-right font-bold text-brand-700 text-lg">
                ${result.financials.total.added.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};