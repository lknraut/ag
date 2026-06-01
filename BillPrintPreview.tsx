import React from 'react';
import { Sale, AppSettings } from '../types';
import { format } from 'date-fns';
import { Printer, X } from 'lucide-react';

interface BillPrintPreviewProps {
  sale: Sale;
  settings: AppSettings;
  onClose: () => void;
}

export default function BillPrintPreview({ sale, settings, onClose }: BillPrintPreviewProps) {
  const isA4 = settings.printSize === 'a4';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 print:static print:bg-white print:p-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {/* Non-printable outer container holding the modal */}
      <div className="w-full max-w-4xl max-h-screen flex flex-col">
        <div className="print:hidden bg-white rounded-t-xl p-4 flex justify-between items-center border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Printer size={20} className="text-slate-500" />
            Print Preview ({isA4 ? 'A4 Size' : 'Thermal 80mm'})
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
              Print Document
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto print:overflow-visible print:p-0 print:bg-white p-8 bg-slate-100 flex justify-center rounded-b-xl items-start">
          
          {/* THE PRINTABLE AREA */}
          <div 
            id="printable-bill"
            className={`bg-white shadow-xl flex-shrink-0 print:shadow-none print:m-0 ${isA4 ? 'w-[794px] p-10 min-h-[1123px]' : 'w-[300px] p-4 text-xs'}`}
            style={{ fontFamily: isA4 ? 'Inter, sans-serif' : 'Courier New, monospace' }}
          >
            {/* Header */}
            <div className={`text-center border-b ${isA4 ? 'border-slate-300 pb-6 mb-6' : 'border-dashed border-slate-800 pb-3 mb-3'}`}>
              <h1 className={`${isA4 ? 'text-3xl font-black text-slate-800 tracking-tight' : 'text-lg font-bold uppercase'}`}>
                {settings.shopName || 'AgriPOS'}
              </h1>
              {settings.shopAddress && (
                <div className={`${isA4 ? 'text-sm text-slate-500 mt-2 max-w-sm mx-auto' : 'text-[10px] mt-1'}`}>
                  {settings.shopAddress}
                </div>
              )}
              {settings.shopPhone && (
                <div className={`${isA4 ? 'text-sm font-semibold text-slate-600 mt-1' : 'text-[10px] mt-0.5'}`}>
                  Ph: {settings.shopPhone}
                </div>
              )}
              {settings.shopGst && (
                <div className={`${isA4 ? 'text-sm font-bold text-slate-500 mt-1' : 'text-[10px] mt-0.5'}`}>
                  GSTIN: {settings.shopGst}
                </div>
              )}
            </div>

            {/* Meta data */}
            <div className={`flex justify-between ${isA4 ? 'text-sm mb-6' : 'text-[10px] mb-3'}`}>
              <div>
                <span className="font-bold">Bill No:</span> {sale.billNo}<br/>
                <span className="font-bold">Date:</span> {format(new Date(sale.date), 'dd MMM yyyy')} {sale.time}
              </div>
              <div className="text-right">
                <span className="font-bold">Payment:</span> <span className="uppercase">{sale.payMode}</span>
              </div>
            </div>

            {/* Customer Details */}
            {(sale.customerName || sale.customerPhone || sale.customerGst || sale.customerAddress) && (
              <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 ${isA4 ? 'mb-6 text-sm flex gap-12' : 'mb-3 text-[10px] flex flex-col gap-1'}`}>
                <div>
                  <div className="font-bold text-slate-700 uppercase text-xs mb-1">Billed To:</div>
                  <div className="font-bold">{sale.customerName || 'Cash Customer'}</div>
                  {sale.customerPhone && <div>Ph: {sale.customerPhone}</div>}
                </div>
                <div>
                   {sale.customerGst && <div className="mt-1 sm:mt-0 font-bold bg-white px-2 py-1 border rounded inline-block">GSTIN: {sale.customerGst}</div>}
                   {sale.customerAddress && <div className="mt-1 text-slate-600 max-w-xs">{sale.customerAddress}</div>}
                </div>
              </div>
            )}

            {/* Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                 <tr className={`border-b ${isA4 ? 'border-slate-200 text-sm' : 'border-dashed border-slate-800 text-[10px]'}`}>
                   <th className={`${isA4 ? 'py-3' : 'py-1'}`}>Item</th>
                   <th className={`${isA4 ? 'py-3 text-center' : 'py-1 text-center'}`}>Qty</th>
                   <th className={`${isA4 ? 'py-3 text-right' : 'py-1 text-right'}`}>Amount</th>
                 </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx} className={`border-b ${isA4 ? 'border-slate-100 last:border-slate-300' : 'border-b-0 border-slate-100'}`}>
                    <td className={`${isA4 ? 'py-3' : 'py-1 align-top'}`}>
                      <div className="font-bold">{item.name}</div>
                      {isA4 && <div className="text-xs text-slate-500">Rate: ₹{item.price} / {item.unit}</div>}
                    </td>
                    <td className={`${isA4 ? 'py-3 text-center font-mono' : 'py-1 text-center align-top whitespace-nowrap'}`}>
                      {item.quantity} {!isA4 && <span className="text-[9px]">x{item.price}</span>}
                    </td>
                    <td className={`${isA4 ? 'py-3 text-right font-mono font-bold' : 'py-1 text-right align-top'}`}>
                      ₹{(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className={`flex flex-col items-end ${isA4 ? 'mt-4 text-sm' : 'mt-2 text-[10px] border-t border-dashed border-slate-800 pt-2'}`}>
               <div className="w-full sm:w-64 flex justify-between py-1">
                 <span className="font-bold text-slate-600">Subtotal:</span>
                 <span className="font-mono">₹{sale.subtotal}</span>
               </div>
               {sale.discount > 0 && (
                 <div className="w-full sm:w-64 flex justify-between py-1 text-red-600">
                   <span className="font-bold">Discount:</span>
                   <span className="font-mono">-₹{sale.discount}</span>
                 </div>
               )}
               <div className={`w-full sm:w-64 flex justify-between font-bold ${isA4 ? 'py-3 mt-2 text-xl border-t-2 border-slate-800' : 'py-1 mt-1 text-sm border-t border-dashed border-slate-800'}`}>
                 <span>Grand Total:</span>
                 <span className="font-mono">₹{sale.total}</span>
               </div>
            </div>

            {/* Footer */}
            <div className={`text-center font-bold text-slate-500 ${isA4 ? 'mt-16 text-sm' : 'mt-6 text-[10px]'}`}>
               *** Thank you for your business ***
               {isA4 && <div className="text-xs font-normal mt-2">Goods once sold will not be taken back or exchanged.</div>}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
