import React, { useState } from 'react';
import { Product, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  settings: AppSettings;
}

export default function ProductsView({ products, setProducts, settings }: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [unit, setUnit] = useState('bag');
  const [hsn, setHsn] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');

  const filteredProducts = products.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(settings.categories?.[0] || '');
    setPrice('');
    setCost('');
    setUnit('bag');
    setHsn('');
    setStock('0');
    setMinStock('5');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || '');
    setPrice(product.price.toString());
    setCost((product.cost || '').toString());
    setUnit(product.unit || 'bag');
    setHsn(product.hsn || '');
    setStock((product.stock || 0).toString());
    setMinStock((product.minStock || 5).toString());
    setIsModalOpen(true);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || isNaN(Number(price))) return;

    const data: Product = {
      id: editingProduct ? editingProduct.id : uuidv4(),
      name: name.trim(),
      category: category || settings.categories?.[0] || 'Uncategorized',
      price: Number(price),
      cost: Number(cost) || 0,
      unit,
      hsn: hsn.trim(),
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? data : p));
    } else {
      setProducts([...products, data]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
          <p className="text-slate-500 text-sm">Manage items, prices, and categories</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          New Product
        </button>
      </div>

      <div className="bg-white border text-center border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden mb-8 flex-1">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full text-sm text-slate-800"
            />
          </div>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-emerald-500 text-sm text-slate-800"
          >
            <option value="all">All Categories</option>
            {settings.categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="hidden sm:block ml-auto text-sm text-slate-500 font-medium">
            {filteredProducts.length} items
          </div>
        </div>

        <div className="overflow-x-auto flex-1 text-left">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Sell Price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Cost Price</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Unit</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">HSN</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800">{product.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600 font-mono">
                    ₹{product.price}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-500 font-mono hidden sm:table-cell">
                    {product.cost ? `₹${product.cost}` : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 font-medium text-sm hidden md:table-cell">
                    {product.unit}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-500 text-sm hidden lg:table-cell">
                    {product.hsn || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-white border border-slate-200 transition-colors shadow-sm"
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded bg-white border border-slate-200 transition-colors shadow-sm"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-md border border-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Product Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="e.g. अंकुर 3028"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {settings.categories?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Cost Price (₹) <span className="font-normal text-slate-400 lowercase">(Optional)</span></label>
                  <input 
                    type="number" 
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Unit</label>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                  >
                    <option value="kg">Kg</option>
                    <option value="bag">Bag</option>
                    <option value="pkt">Packet</option>
                    <option value="ltr">Litre</option>
                    <option value="pcs">Pcs</option>
                    <option value="box">Box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">HSN Code <span className="font-normal text-slate-400 lowercase">(Optional)</span></label>
                  <input 
                    type="text" 
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="e.g. 12011000"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Initial Stock</label>
                    <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Low Stock Alert Level</label>
                    <input 
                      type="number" 
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                      min="0"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 mt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 text-sm bg-emerald-500 text-white font-bold hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
