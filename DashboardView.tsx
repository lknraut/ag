import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { format, isToday, parseISO, subDays } from 'date-fns';
import { IndianRupee, FileText, ShoppingBag, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';

interface DashboardViewProps {
  sales: Sale[];
}

export default function DashboardView({ sales }: DashboardViewProps) {
  const stats = useMemo(() => {
    let todayTotal = 0;
    let todayCount = 0;
    let allTimeTotal = 0;
    let itemsSoldToday = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    sales.forEach(sale => {
      allTimeTotal += sale.total;
      try {
        if (sale.date === todayStr) {
          todayTotal += sale.total;
          todayCount += 1;
          itemsSoldToday += sale.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      } catch (e) {
        // Handle invalid dates
      }
    });

    return { todayTotal, todayCount, allTimeTotal, itemsSoldToday };
  }, [sales]);

  // Chart Logic (Last 7 days)
  const chartData = useMemo(() => {
    const days = Array.from({length: 7}, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'yyyy-MM-dd');
    });

    const data = days.map(day => {
      const total = sales.filter(s => s.date === day).reduce((sum, s) => sum + s.total, 0);
      return { 
        day, 
        label: format(parseISO(day), 'd MMM'), 
        val: total 
      };
    });

    const maxVal = Math.max(...data.map(d => d.val), 1);
    return { data, maxVal };
  }, [sales]);

  // Top Products
  const topProducts = useMemo(() => {
    const productMap: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        productMap[item.name] = (productMap[item.name] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, val]) => ({ name, val }));
  }, [sales]);
  const maxProductVal = Math.max(...topProducts.map(p => p.val), 1);

  // Payment Breakdown
  const payments = useMemo(() => {
    const pModes = { cash: 0, upi: 0, credit: 0, cheque: 0 };
    sales.forEach(s => {
      if ((pModes as any)[s.payMode] !== undefined) {
         (pModes as any)[s.payMode] += s.total;
      }
    });
    return pModes;
  }, [sales]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col pt-4 md:pt-0 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sales Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of your agricultural shop's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl"></div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Revenue</p>
            <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">₹{stats.todayTotal.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Bills</p>
            <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl"></div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Items Sold Today</p>
            <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">{stats.itemsSoldToday}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-xl"></div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <CreditCard size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">All Time Revenue</p>
             <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">₹{stats.allTimeTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span> 
            Last 7 Days Sales
          </h2>
          <div className="flex items-end justify-between gap-2 h-36 border-b border-slate-100 pb-2">
             {chartData.data.map(d => (
               <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                   ₹{d.val/1000 >= 1 ? (d.val/1000).toFixed(1)+'k' : d.val}
                 </div>
                 <div 
                   className="w-full bg-emerald-400 rounded-t-sm hover:bg-emerald-500 transition-colors relative"
                   style={{ height: `${Math.max((d.val / chartData.maxVal) * 100, 2)}%` }}
                 ></div>
                 <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
           <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
             <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span> 
             Top Products (Revenue)
           </h2>
           <div className="flex flex-col gap-4">
             {topProducts.length === 0 ? (
               <div className="text-sm text-slate-400 italic">No sales data yet.</div>
             ) : (
               topProducts.map(p => (
                 <div key={p.name}>
                   <div className="flex justify-between items-end mb-1.5">
                     <span className="font-bold text-sm text-slate-700">{p.name}</span>
                     <span className="font-mono text-sm font-bold text-blue-600">₹{p.val.toLocaleString()}</span>
                   </div>
                   <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-blue-500 rounded-full" 
                       style={{ width: `${(p.val / maxProductVal) * 100}%` }}
                     ></div>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

      {/* Payment Modes */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
           <span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span> 
           Revenue by Payment Mode
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
              <Banknote size={40} className="absolute -right-2 -bottom-2 text-emerald-500 opacity-10" />
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cash</div>
              <div className="text-xl font-black font-mono text-slate-800">₹{payments.cash.toLocaleString()}</div>
           </div>
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
              <Smartphone size={40} className="absolute -right-2 -bottom-2 text-blue-500 opacity-10" />
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> UPI / Online</div>
              <div className="text-xl font-black font-mono text-slate-800">₹{payments.upi.toLocaleString()}</div>
           </div>
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
              <Receipt size={40} className="absolute -right-2 -bottom-2 text-amber-500 opacity-10" />
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Credit / Udhar</div>
              <div className="text-xl font-black font-mono text-slate-800">₹{payments.credit.toLocaleString()}</div>
           </div>
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
              <FileText size={40} className="absolute -right-2 -bottom-2 text-purple-500 opacity-10" />
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Cheque</div>
              <div className="text-xl font-black font-mono text-slate-800">₹{payments.cheque.toLocaleString()}</div>
           </div>
        </div>
      </div>
    </div>
  );
}
