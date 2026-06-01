import React, { useState, useMemo } from 'react';
import { Product, Sale, CartItem, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle2 } from 'lucide-react';
import BillPrintPreview from '../components/BillPrintPreview';

interface POSViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  settings: AppSettings;
}

export default function POSView({ products, setProducts, sales, setSales, settings }: POSViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Billing specific state
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat'|'pct'>('flat');
  const [payMode, setPayMode] = useState<string>('cash');
  
  // Customer details (conditionally enabled via settings)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState<number | ''>('');

  // Print support
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, categoryFilter]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Cannot add more than available stock.');
          return current;
        }
        return current.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(current => current.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return { ...item, quantity: 1 };
        if (product && newQuantity > product.stock) {
          alert('Stock limit reached.');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (discountVal > 0) {
    if (discountType === 'pct') discountAmount = subtotal * (discountVal / 100);
    else discountAmount = discountVal;
  }
  const grandTotal = Math.max(0, subtotal - discountAmount);
  
  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      setDiscountVal(0);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerGst('');
      setPayMode('cash');
    }
  };

  const getLocalDateString = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const checkout = () => {
    if (cart.length === 0) return;

    // Generate Bill Number B{YY}{MM}{DD}-XXXX
    const d = new Date();
    const bd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const billNo = `B${bd}-${String(Date.now()).slice(-4)}`;
    
    const localDateStr = getLocalDateString(d);

    const newSale: Sale = {
      id: uuidv4(),
      billNo,
      date: localDateStr,
      time: d.toTimeString().slice(0,5),
      items: cart,
      subtotal,
      discount: discountAmount,
      discountType,
      total: grandTotal,
      payMode,
      amountPaid: payMode === 'credit' ? (Number(amountPaidInput) || 0) : grandTotal,
      paymentHistory: payMode === 'credit' && Number(amountPaidInput) > 0 ? [{ id: uuidv4(), date: localDateStr, amount: Number(amountPaidInput), note: 'Advance paid' }] : [],
      customerName,
      customerPhone,
      customerAddress,
      customerGst,
      synced: false
    };

    // Deduct stock
    const updatedProducts = [...products];
    cart.forEach(item => {
      const pIdx = updatedProducts.findIndex(p => p.id === item.id);
      if (pIdx > -1) {
        updatedProducts[pIdx] = { 
          ...updatedProducts[pIdx], 
          stock: Math.max(0, updatedProducts[pIdx].stock - item.quantity)
        };
      }
    });

    setProducts(updatedProducts);
    setSales([...sales, newSale]);
    
    // reset UI
    setCart([]);
    setDiscountVal(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerGst('');
    setAmountPaidInput('');
    setPayMode('cash');

    setPrintingSale(newSale); // show print preview immediately
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-100 overflow-hidden">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls */}
        <div className="bg-white p-4 pt-4 md:pt-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center flex-shrink-0 z-10 shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 w-full text-sm font-medium transition-colors"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setCategoryFilter('all')} 
              className={`px-4 py-1.5 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${categoryFilter === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Items
            </button>
            {settings.categories?.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)} 
                className={`px-4 py-1.5 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map(product => {
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= product.minStock;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={isOut}
                  className={`relative bg-white p-3 md:p-4 rounded-xl border text-left h-32 flex flex-col justify-between transition-all ${
                    isOut 
                      ? 'border-slate-200 opacity-60 cursor-not-allowed grayscale-[0.5]' 
                      : 'border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <span className={`absolute top-2.5 right-2.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-wider ${
                    isOut ? 'bg-red-50 text-red-600 border-red-200' 
                          : isLow ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {isOut ? 'Out' : product.stock}
                  </span>
                  
                  <h3 className={`font-bold leading-tight line-clamp-2 pr-6 mt-1 text-sm md:text-base ${isOut ? 'text-slate-500' : 'text-slate-800'}`}>
                    {product.name}
                  </h3>
                  <div>
                    <p className={`font-mono font-black text-lg ${isOut ? 'text-slate-400' : 'text-emerald-600'}`}>₹{product.price}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{product.unit}</p>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-slate-500 mb-1">No products found</p>
                <p className="text-sm">Try adjusting your filters or search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[400px] flex-shrink-0 bg-white shadow-xl flex flex-col h-full z-20 border-l border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <ShoppingCart size={20} className="text-emerald-500" />
            <span>Current Bill</span>
          </div>
          <button 
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors uppercase tracking-wider"
          >
            Clear All
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 flex flex-col gap-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="font-medium">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 text-sm leading-tight pr-2">{item.name}</div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 rounded-md hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <div className="font-mono font-bold text-emerald-600">₹{(item.price * item.quantity).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md border border-slate-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 shadow-sm transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold font-mono text-slate-700 text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 shadow-sm transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Controls Area */}
        <div className="bg-white border-t border-slate-200 flex-shrink-0 flex flex-col">
          {/* Customer Details Toggle */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <input 
                   type="text" 
                   placeholder="Customer Name" 
                   value={customerName}
                   onChange={e => setCustomerName(e.target.value)}
                   className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                 />
                 <input 
                   type="text" 
                   placeholder="Phone Number" 
                   value={customerPhone}
                   onChange={e => setCustomerPhone(e.target.value)}
                   className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                 />
               </div>
               <div className="grid grid-cols-2 gap-3 mb-2">
                 <input 
                   type="text" 
                   placeholder="GSTIN (Optional)" 
                   value={customerGst}
                   onChange={e => setCustomerGst(e.target.value)}
                   className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                 />
                 <input 
                   type="text" 
                   placeholder="Address" 
                   value={customerAddress}
                   onChange={e => setCustomerAddress(e.target.value)}
                   className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                 />
               </div>

            {/* Discount and Totals */}
            <div className="flex gap-4 items-center mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount</label>
              <div className="flex flex-1 rounded border border-slate-200 shadow-sm overflow-hidden">
                <input 
                  type="number" 
                  value={discountVal || ''} 
                  onChange={e => setDiscountVal(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2 py-1 flex-1 min-w-0 text-sm font-mono focus:outline-none"
                  min="0"
                />
                <select 
                  value={discountType} 
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="bg-slate-100 border-l border-slate-200 px-2 py-1 text-sm font-bold text-slate-600 focus:outline-none"
                >
                  <option value="flat">₹</option>
                  <option value="pct">%</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 py-4">
             <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Grand Total</span>
                <span className="text-3xl font-black font-mono text-emerald-600">₹{grandTotal.toLocaleString()}</span>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'credit', label: 'Credit' },
                  { id: 'cheque', label: 'Cheque' }
                ].map(pm => (
                  <button 
                    key={pm.id}
                    onClick={() => setPayMode(pm.id)}
                    className={`py-2 text-[11px] uppercase tracking-wider font-bold rounded-lg border transition-all ${
                      payMode === pm.id 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
             </div>

             {payMode === 'credit' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Advance Paid (Optional)</label>
                  <input 
                    type="number" 
                    value={amountPaidInput}
                    onChange={e => setAmountPaidInput(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-200 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    min="0"
                    max={grandTotal}
                  />
                </div>
             )}

             <button 
               onClick={checkout}
               disabled={cart.length === 0}
               className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg py-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
             >
               <CheckCircle2 size={24} />
               Issue Bill
             </button>
          </div>
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
