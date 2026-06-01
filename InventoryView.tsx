import React, { useState } from 'react';
import { Product } from '../types';
import { Package, AlertTriangle, AlertCircle, Edit2, X } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export default function InventoryView({ products, setProducts }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAddCount, setStockAddCount] = useState('');
  
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const filteredProducts = products.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    if (filter === 'low') return matchSearch && p.stock > 0 && p.stock <= p.minStock;
    if (filter === 'out') return matchSearch && p.stock === 0;
    return matchSearch;
  });

  const openUpdateModal = (product: Product) => {
    setSelectedProduct(product);
    setStockAddCount('');
    setIsUpdateModalOpen(true);
  };

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    const parts = stockAddCount.trim();
    let newStock = selectedProduct.stock;
    if (parts.startsWith('=')) {
      newStock = Number(parts.substring(1));
    } else {
      newStock += Number(parts);
    }
    
    if (isNaN(newStock) || newStock < 0) newStock = 0;

    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, stock: newStock } : p));
    setIsUpdateModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col pt-4 md:pt-0 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Inventory Status</h1>
        <p className="text-slate-500 text-sm">Monitor stock levels and manage availability</p>
      </div>

      {outOfStockProducts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4">
          <div className="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0"><AlertCircle size={24} /></div>
          <div>
            <h3 className="font-bold text-red-800">Out of Stock Alert</h3>
            <p className="text-sm text-red-600 mt-1">
              The following items are completely out of stock: <span className="font-bold">
                {outOfStockProducts.map(p => p.name).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-lg flex-shrink-0"><AlertTriangle size={24} /></div>
          <div>
            <h3 className="font-bold text-amber-800">Low Stock Warning</h3>
            <p className="text-sm text-amber-600 mt-1">
              The following items are running low: <span className="font-bold">
                {lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border text-center border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50">
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 w-full sm:max-w-xs text-sm font-medium"
          />
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 text-sm font-medium"
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock Only</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1 text-left">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Unit</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left">
              {filteredProducts.map(product => {
                const isOut = product.stock === 0;
                const isLow = product.stock > 0 && product.stock <= product.minStock;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800 leading-tight">
                      {product.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {product.category}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold font-mono text-lg ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-slate-500 font-medium hidden sm:table-cell">
                      {product.unit}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isOut ? 'bg-red-50 text-red-700 border-red-200' : isLow ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                       <button 
                         onClick={() => openUpdateModal(product)}
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                       >
                         <Edit2 size={14} /> Update
                       </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Package size={40} className="mb-3 opacity-30" />
                        <p className="font-medium text-slate-500">No inventory records found</p>
                      </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUpdateModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="font-bold text-slate-800">Quick Stock Update</h2>
               <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
             </div>
             <form onSubmit={handleStockUpdate} className="p-5">
               <div className="mb-4 text-sm text-slate-600 leading-tight">
                 Updating stock for <span className="font-bold text-slate-800">{selectedProduct.name}</span>.<br/>
                 Current Stock: <span className="font-mono font-bold text-emerald-600">{selectedProduct.stock}</span>
               </div>
               <div className="mb-5 bg-blue-50 p-3 rounded-lg text-xs text-blue-700 border border-blue-100 leading-relaxed">
                 <strong>Tip:</strong> Type a number (e.g., <code>10</code>) to add to current stock. Type <code>=</code> followed by a number (e.g., <code>=50</code>) to set exact stock. Type a negative number (e.g., <code>-5</code>) to reduce stock.
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Modifier</label>
                  <input 
                    type="text" 
                    value={stockAddCount}
                    onChange={(e) => setStockAddCount(e.target.value)}
                    placeholder="e.g. 10 or =50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                    autoFocus
                  />
               </div>
               <div className="mt-5 flex gap-3">
                 <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent transition-colors">Cancel</button>
                 <button type="submit" className="flex-1 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Update</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
