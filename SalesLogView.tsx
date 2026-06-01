import React, { useState } from 'react';
import { Sale, AppSettings } from '../types';
import { ClipboardList, Printer, CheckCircle2, Search } from 'lucide-react';
import { format } from 'date-fns';
import BillPrintPreview from '../components/BillPrintPreview';

interface SalesLogViewProps {
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  settings: AppSettings;
}

export default function SalesLogView({ sales, setSales, settings }: SalesLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(s => {
    const matchSearch = (s.billNo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                       (s.customerName || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchDate = dateFilter ? s.date === dateFilter : true;
    return matchSearch && matchDate;
  });

  const getPayModeLabel = (mode: string) => {
    switch(mode) {
      case 'cash': return '💵 Cash';
      case 'upi': return '📱 UPI';
      case 'credit': return '📒 Credit';
      case 'cheque': return '🏦 Cheque';
      default: return mode;
    }
  };

  const getPayModeColor = (mode: string) => {
    switch(mode) {
      case 'cash': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'upi': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'credit': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cheque': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Log</h1>
          <p className="text-slate-500 text-sm">View transaction history and reprint bills</p>
        </div>
      </div>

      <div className="bg-white border text-center border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden mb-8 flex-1">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Bill No or Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full text-sm font-medium"
            />
          </div>
          <div className="w-full sm:w-auto">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 text-sm text-slate-800 w-full font-medium"
            />
          </div>
          <div className="hidden sm:block ml-auto text-sm text-slate-500 font-medium">
            {filteredSales.length} records
          </div>
        </div>

        <div className="overflow-x-auto flex-1 text-left">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bill No.</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left">
              {[...filteredSales].reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-slate-700 text-sm">{sale.billNo}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-800">{format(new Date(sale.date), 'dd MMM yyyy')}</div>
                    <div className="text-xs text-slate-500">{sale.time}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-700">{sale.customerName || '-'}</div>
                    {sale.customerPhone && <div className="text-xs text-slate-400">{sale.customerPhone}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getPayModeColor(sale.payMode)}`}>
                      {getPayModeLabel(sale.payMode)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-emerald-600 font-mono text-base">₹{sale.total.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {sale.synced ? (
                         <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase mr-1" title="Synced to Sheets">
                           <CheckCircle2 size={12}/> Sync
                         </span>
                      ) : (
                         <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase mr-1" title="Pending Sync">
                           Pending
                         </span>
                      )}
                      <button 
                        onClick={() => setPrintingSale(sale)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded bg-white border border-slate-200 transition-colors shadow-sm flex items-center justify-center gap-1 text-xs font-bold"
                        title="View / Print Bill"
                      >
                        <Printer size={14} /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                     <div className="flex flex-col items-center justify-center text-slate-400">
                       <ClipboardList size={40} className="mb-3 opacity-30" />
                       <p className="font-medium text-slate-500">No sales records found</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printingSale && (
        <BillPrintPreview 
          sale={printingSale} 
          settings={settings} 
          onClose={() => setPrintingSale(null)} 
        />
      )}
    </div>
  );
}
