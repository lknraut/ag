import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Settings, Package, Menu, X, Sprout, Truck, ClipboardList, BookOpen } from 'lucide-react';
import POSView from './views/POSView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import ProductsView from './views/ProductsView';
import PurchasesView from './views/PurchasesView';
import SalesLogView from './views/SalesLogView';
import CreditLedgerView from './views/CreditLedgerView';
import SettingsView from './views/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Product, Sale, Purchase, AppSettings, INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'inventory' | 'products' | 'purchases' | 'sales_log' | 'credit_ledger' | 'settings'>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-merge new settings fields for existing users
  const [products, setProducts] = useLocalStorage<Product[]>('agripos_products', INITIAL_PRODUCTS);
  const [sales, setSales] = useLocalStorage<Sale[]>('agripos_sales', []);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('agripos_purchases', []);
  const [rawSettings, setSettings] = useLocalStorage<AppSettings>('agripos_settings', DEFAULT_SETTINGS);

  const settings = { ...DEFAULT_SETTINGS, ...rawSettings };

  const navItems = [
    { section: 'Main' },
    { id: 'pos', label: 'Billing', icon: ShoppingCart },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Management' },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'products', label: 'Products', icon: Sprout },
    { id: 'purchases', label: 'Stock In / Purchases', icon: Truck },
    { id: 'sales_log', label: 'Sales Log', icon: ClipboardList },
    { id: 'credit_ledger', label: 'Credit Ledger', icon: BookOpen },
    { section: 'System' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl shadow-sm flex-shrink-0">
          🌾
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-slate-800 leading-tight truncate">{settings.shopName || 'AgriPOS'}</div>
          <div className="text-[11px] text-slate-500 font-medium">Agricultural POS v2.0</div>
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto px-3 flex flex-col gap-1">
        {navItems.map((item, idx) => {
          if ('section' in item) {
            return <div key={`sec-${idx}`} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-4 mb-2 px-3">{item.section}</div>;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
          className="w-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          📤 Cloud Sync
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden text-slate-900 font-sans">
      <div className="md:hidden absolute top-3 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white text-slate-800 rounded-md shadow-sm border border-slate-200"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className="hidden md:block w-64 flex-shrink-0 h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <NavContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="w-64 max-w-sm flex-shrink-0 h-full relative z-50 shadow-2xl">
            <NavContent />
          </aside>
        </div>
      )}

      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-center font-bold text-slate-800 z-10 flex-shrink-0 shadow-sm">
          {navItems.find(i => (i as any).id === activeTab)?.label}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'pos' && <POSView products={products} setProducts={setProducts} sales={sales} setSales={setSales} settings={settings} />}
          {activeTab === 'dashboard' && <DashboardView sales={sales} />}
          {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
          {activeTab === 'products' && <ProductsView products={products} setProducts={setProducts} settings={settings} />}
          {activeTab === 'purchases' && <PurchasesView products={products} setProducts={setProducts} purchases={purchases} setPurchases={setPurchases} />}
          {activeTab === 'sales_log' && <SalesLogView sales={sales} setSales={setSales} settings={settings} />}
          {activeTab === 'credit_ledger' && <CreditLedgerView sales={sales} setSales={setSales} />}
          {activeTab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} sales={sales} />}
        </div>
      </main>
    </div>
  );
}
