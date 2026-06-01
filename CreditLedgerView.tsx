import React, { useState, useMemo } from 'react';
import { Sale, PaymentRecord } from '../types';
import { Search, History, CheckCircle2, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreditLedgerViewProps {
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
}

export default function CreditLedgerView({ sales, setSales }: CreditLedgerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('pending');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');

  const creditSales = useMemo(() => {
    return sales.filter(s => s.payMode === 'credit');
  }, [sales]);

  const filteredSales = useMemo(() => {
    return creditSales.filter(s => {
      const remaining = s.total - (s.amountPaid || 0);
      const isSettled = remaining <= 0;
      
      const searchMatch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.customerPhone || '').includes(searchTerm);
                          
      const filterMatch = filter === 'all' ? true : (filter === 'settled' ? isSettled : !isSettled);

      return searchMatch && filterMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [creditSales, searchTerm, filter]);

  const totalOutstanding = useMemo(() => {
    return creditSales.reduce((acc, s) => {
      const remaining = s.total - (s.amountPaid || 0);
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);
  }, [creditSales]);

  const handleAddPayment = (saleId: string, maxAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0) return;
    if (paymentAmount > maxAmount) {
      alert('Payment amount cannot exceed remaining balance.');
      return;
    }

    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localDateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];

    const newRecord: PaymentRecord = {
      id: uuidv4(),
      date: localDateStr,
      amount: Number(paymentAmount),
      note: paymentNote
    };

    setSales(sales.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          amountPaid: (s.amountPaid || 0) + Number(paymentAmount),
          paymentHistory: [...(s.paymentHistory || []), newRecord],
          synced: false
        };
      }
      return s;
    }));

    setPaymentAmount('');
    setPaymentNote('');
    setExpandedSaleId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Credit Ledger</h1>
          <p className="text-slate-500 font-medium mt-1">Manage unsettled bills and partial payments</p>
        </div>
        <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-xl flex items-center justify-between min-w-[200px]">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-red-500 mb-0.5">Total Outstanding</p>
            <p className="text-2xl font-black font-mono text-red-600">₹{totalOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customer, phone or bill no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            {[
              { id: 'pending', label: 'Pending' },
              { id: 'settled', label: 'Settled' },
              { id: 'all', label: 'All Credits' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id as any)} 
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${filter === f.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          {filteredSales.length === 0 ? (
             <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <History size={48} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-slate-600">No records found</p>
                <p className="text-sm">Try adjusting your filters or search term</p>
             </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSales.map(sale => {
                const remaining = sale.total - (sale.amountPaid || 0);
                const isSettled = remaining <= 0;
                const isExpanded = expandedSaleId === sale.id;

                return (
                  <div key={sale.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer" onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isSettled ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {isSettled ? <CheckCircle2 size={24} /> : <DollarSign size={24} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            {sale.customerName || 'Walk-in Customer'}
                            <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded tracking-wider border border-slate-200">
                              #{sale.billNo}
                            </span>
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {sale.date} {sale.customerPhone && `• ${sale.customerPhone}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                          <p className="font-mono font-bold text-slate-700">₹{sale.total.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Paid</p>
                          <p className="font-mono font-bold text-emerald-600">₹{(sale.amountPaid || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isSettled ? 'text-slate-400' : 'text-red-400'}`}>Remaining</p>
                          <p className={`font-mono font-black ${isSettled ? 'text-slate-400' : 'text-red-600'}`}>₹{remaining > 0 ? remaining.toLocaleString() : '0'}</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-md border shadow-sm">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid md:grid-cols-2 gap-6 pl-14">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Payment History</h4>
                          {(!sale.paymentHistory || sale.paymentHistory.length === 0) ? (
                            <p className="text-sm text-slate-400 italic">No payments recorded yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {sale.paymentHistory.map(pr => (
                                <div key={pr.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-200">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-700">{pr.date}</span>
                                    {pr.note && <span className="text-xs text-slate-500">{pr.note}</span>}
                                  </div>
                                  <span className="font-mono font-bold text-emerald-600">+₹{pr.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {!isSettled && (
                          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">Add Payment</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Amount Given (₹)</label>
                                <input 
                                  type="number" 
                                  value={paymentAmount}
                                  onChange={e => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                                  min="1"
                                  max={remaining}
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 border border-slate-200 rounded focus:border-emerald-500 focus:outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Note (Optional)</label>
                                <input 
                                  type="text" 
                                  value={paymentNote}
                                  onChange={e => setPaymentNote(e.target.value)}
                                  placeholder="e.g. UPI trxn id"
                                  className="w-full px-3 py-2 border border-slate-200 rounded focus:border-emerald-500 focus:outline-none text-sm"
                                />
                              </div>
                              <button 
                                onClick={() => handleAddPayment(sale.id, remaining)}
                                disabled={!paymentAmount || paymentAmount <= 0 || paymentAmount > remaining}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-2 rounded transition-colors text-sm"
                              >
                                Record Payment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
