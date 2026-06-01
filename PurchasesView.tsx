import React, { useState, useMemo } from 'react';
import { Product, Purchase, PurchaseItem, PaymentRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Truck, Plus, Trash2, X, FileText, CheckCircle2, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface PurchasesViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  purchases: Purchase[];
  setPurchases: (purchases: Purchase[]) => void;
}

export default function PurchasesView({ products, setProducts, purchases, setPurchases }: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [supplier, setSupplier] = useState('');
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentStatus, setPaymentStatus] = useState<'paid'|'pending'>('pending');
  const [amountPaidInput, setAmountPaidInput] = useState<number | ''>('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Expanded State for payments
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');

  const openModal = () => {
    setSupplier('');
    setBillNo('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentStatus('pending');
    setAmountPaidInput('');
    setItems([{ productId: '', name: '', quantity: 0, rate: 0 }]);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', name: '', quantity: 0, rate: 0 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const p = products.find(prod => prod.id === value);
      newItems[index].productId = value;
      newItems[index].name = p ? p.name : '';
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId && i.quantity > 0 && i.rate >= 0);
    
    if (!supplier.trim() || validItems.length === 0) {
      alert("Supplier and at least one valid product required.");
      return;
    }

    // Process stock updates
    const updatedProducts = [...products];
    validItems.forEach(item => {
      const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
      if (pIdx > -1) {
        updatedProducts[pIdx] = { 
          ...updatedProducts[pIdx], 
          stock: updatedProducts[pIdx].stock + item.quantity 
        };
      }
    });

    const d = new Date();
    const localDateStr = format(d, 'yyyy-MM-dd');

    const newPurchase: Purchase = {
      id: uuidv4(),
      supplier: supplier.trim(),
      billNo: billNo.trim(),
      date,
      total: totalAmount,
      paymentStatus: paymentStatus === 'paid' || Number(amountPaidInput) >= totalAmount ? 'paid' : 'pending',
      amountPaid: paymentStatus === 'paid' ? totalAmount : (Number(amountPaidInput) || 0),
      paymentHistory: paymentStatus === 'pending' && Number(amountPaidInput) > 0 ? [{ id: uuidv4(), date: localDateStr, amount: Number(amountPaidInput), note: 'Advance paid' }] : [],
      items: validItems
    };

    setProducts(updatedProducts);
    setPurchases([newPurchase, ...purchases]);
    setIsModalOpen(false);
  };

  const handleAddPayment = (purchaseId: string, maxAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0) return;
    if (paymentAmount > maxAmount) {
      alert('Payment amount cannot exceed remaining balance.');
      return;
    }

    const d = new Date();
    const localDateStr = format(d, 'yyyy-MM-dd');

    const newRecord: PaymentRecord = {
      id: uuidv4(),
      date: localDateStr,
      amount: Number(paymentAmount),
      note: paymentNote
    };

    setPurchases(purchases.map(p => {
      if (p.id === purchaseId) {
        const newPaid = (p.amountPaid || 0) + Number(paymentAmount);
        return {
          ...p,
          amountPaid: newPaid,
          paymentStatus: newPaid >= p.total ? 'paid' : 'pending',
          paymentHistory: [...(p.paymentHistory || []), newRecord]
        };
      }
      return p;
    }));

    setPaymentAmount('');
    setPaymentNote('');
    setExpandedPurchaseId(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock In / Purchases</h1>
          <p className="text-slate-500 text-sm">Add inventory from suppliers and track purchase bills</p>
        </div>
        <button 
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          New Purchase Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-8">
        {purchases.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-xl">
            <Truck size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Purchase Records</h3>
            <p className="text-slate-500 text-sm">Create a new purchase entry to add stock to your inventory</p>
          </div>
        ) : (
          purchases.map(purchase => {
            const isSettled = purchase.paymentStatus === 'paid' || (purchase.amountPaid && purchase.amountPaid >= purchase.total);
            const remaining = purchase.total - (purchase.amountPaid || 0);
            const isExpanded = expandedPurchaseId === purchase.id;

            return (
            <div key={purchase.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col hover:border-blue-300 transition-colors">
              <div 
                className="flex justify-between items-start mb-4 cursor-pointer"
                onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
              >
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{purchase.supplier}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <FileText size={12} />
                    {purchase.billNo || 'No Bill No'} • {format(new Date(purchase.date), 'dd MMM yy')}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="font-bold text-slate-800 font-mono">₹{purchase.total.toLocaleString()}</div>
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1">
                        <CheckCircle2 size={10} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1">
                        Pending (-₹{remaining > 0 ? remaining.toLocaleString() : '0'})
                      </span>
                    )}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 border border-slate-200 rounded">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs flex flex-col gap-1.5 flex-1">
                {purchase.items.slice(0,3).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600 border-b border-slate-200/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="truncate pr-2 font-medium">{item.name}</span>
                    <span className="flex-shrink-0 font-mono text-slate-500">{item.quantity} x ₹{item.rate}</span>
                  </div>
                ))}
                {purchase.items.length > 3 && (
                  <div className="text-slate-400 text-center pt-1 font-medium text-[10px] uppercase tracking-wider">
                    + {purchase.items.length - 3} more items
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Payment History</h4>
                  {(!purchase.paymentHistory || purchase.paymentHistory.length === 0) ? (
                    <p className="text-sm text-slate-400 italic mb-4">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {purchase.paymentHistory.map(pr => (
                        <div key={pr.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{pr.date}</span>
                            {pr.note && <span className="text-xs text-slate-500">{pr.note}</span>}
                          </div>
                          <span className="font-mono font-bold text-blue-600">+₹{pr.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isSettled && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1">
                        <DollarSign size={14} /> Add Payment
                      </h4>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Amount (₹)</label>
                            <input 
                              type="number" 
                              value={paymentAmount}
                              onChange={e => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                              min="1"
                              max={remaining}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Note</label>
                            <input 
                              type="text" 
                              value={paymentNote}
                              onChange={e => setPaymentNote(e.target.value)}
                              placeholder="e.g. details"
                              className="w-full px-3 py-2 border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddPayment(purchase.id, remaining)}
                          disabled={!paymentAmount || paymentAmount <= 0 || paymentAmount > remaining}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2 rounded transition-colors text-sm"
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
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Truck size={20} className="text-blue-600" />
                Add Stock / Purchase Entry
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-md border border-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Supplier Name*</label>
                  <input 
                    type="text" 
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Bill Number</label>
                  <input 
                    type="text" 
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 lg:col-span-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Payment Context</label>
                    <select 
                      value={paymentStatus}
                      onChange={(e) => {
                        setPaymentStatus(e.target.value as any);
                        if(e.target.value === 'paid') setAmountPaidInput('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                    >
                      <option value="pending">Credit/Pending</option>
                      <option value="paid">Fully Paid</option>
                    </select>
                  </div>
                  {paymentStatus === 'pending' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Advance Paid (₹)</label>
                      <input 
                        type="number" 
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-700 text-sm">Products Received</h3>
                  <button type="button" onClick={addItemRow} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-sm transition-colors">
                    + Add Row
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex-1 w-full">
                        <select 
                          value={item.productId}
                          onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm font-medium"
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <div className="w-24 flex-shrink-0">
                          <input 
                            type="number" 
                            placeholder="Qty"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm font-medium"
                            min="0"
                          />
                        </div>
                        <div className="w-28 flex-shrink-0 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="Rate"
                            value={item.rate || ''}
                            onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm font-medium"
                            min="0"
                          />
                        </div>
                        <div className="w-24 text-right flex-shrink-0 py-2 font-bold text-slate-800 font-mono text-sm hidden sm:block">
                          ₹{(item.quantity * item.rate) || 0}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItemRow(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded bg-slate-50 border border-slate-200 transition-colors flex-shrink-0"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-4">Total Amount</span>
                    <span className="text-2xl font-black text-blue-600 font-mono">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 font-bold hover:bg-slate-200/50 rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                Save Purchase & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
