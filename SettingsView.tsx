import React, { useState } from 'react';
import { AppSettings, Sale } from '../types';
import { Settings2, CloudUpload, Store, MonitorPlay, Trash2, ShieldCheck, AlertCircle, Download } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  sales: Sale[];
}

export default function SettingsView({ settings, setSettings, sales }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [syncStatus, setSyncStatus] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Derive pending sales
  const pendingSales = sales.filter(s => !s.synced);

  const handleSaveShopInfo = () => {
    setSettings({ ...settings, ...localSettings });
    alert("Settings saved successfully!");
  };

  const handleExportCSV = () => {
    if (sales.length === 0) {
      alert("No sales data available to export.");
      return;
    }

    const headers = ['Bill No', 'Date', 'Time', 'Customer', 'Product', 'Qty', 'Unit', 'Rate', 'Amount', 'Discount', 'Grand Total', 'Payment Mode'];
    const rows: string[] = [];
    rows.push(headers.join(','));

    sales.forEach(s => {
      s.items.forEach(item => {
        const row = [
          s.billNo,
          s.date,
          s.time,
          `"${s.customerName || ''}"`,
          `"${item.name}"`,
          item.quantity,
          item.unit,
          item.price,
          item.price * item.quantity,
          s.discount,
          s.total,
          s.payMode
        ];
        rows.push(row.join(','));
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = () => {
    const isConfirmed = window.confirm("WARNING: You are about to permanently delete all data from this device! This cannot be undone.\n\nPlease ensure you have exported your data first.\n\nType 'YES' to confirm, or click Cancel to abort.");
    if (isConfirmed) {
      // Just double confirm
      const finalCheck = window.prompt("Type 'DELETE' to confirm clearing all data:");
      if (finalCheck === "DELETE") {
        localStorage.clear();
        alert("All data cleared. The application will now reload.");
        window.location.reload();
      } else {
        alert("Action cancelled.");
      }
    }
  };

  const handleExecuteSync = async () => {
    if (!settings.googleWebAppUrl) {
      setSyncStatus({ type: 'error', text: 'Please configure Google App Script Web App URL first.' });
      return;
    }

    if (pendingSales.length === 0) {
      setSyncStatus({ type: 'success', text: 'No pending sales to sync.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      const rows = [];
      pendingSales.forEach(s => {
        s.items.forEach(item => {
          rows.push({
            billNo: s.billNo,
            date: s.date,
            time: s.time,
            customer: s.customerName || '',
            product: item.name,
            qty: item.quantity,
            unit: item.unit,
            rate: item.price,
            amount: item.price * item.quantity,
            discount: s.discount,
            grandTotal: s.total,
            payMode: s.payMode
          });
        });
      });

      // Fire and forget via no-cors for apps script
      await fetch(settings.googleWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetName: settings.sheetName || 'Sales', rows })
      });

      // Blind success since no-cors masks response
      setSyncStatus({ type: 'success', text: `Sync request for ${rows.length} rows sent. Refresh the sales log to see updates, or check your Google Sheet.` });
      // In a real app we'd need a backend to confirm, but no-cors forces us to assume success if no network error.
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Sync failed: ${e.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col pt-4 md:pt-0 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure your shop, billing preferences, and cloud sync</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Info Settings */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 font-bold text-slate-800">
            <Store size={18} className="text-emerald-600" /> Shop Details
          </div>
          <div className="p-5 flex flex-col gap-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Shop Name</label>
                 <input 
                   type="text" 
                   value={localSettings.shopName}
                   onChange={e => setLocalSettings({...localSettings, shopName: e.target.value})}
                   className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
                 <input 
                   type="text" 
                   value={localSettings.shopPhone}
                   onChange={e => setLocalSettings({...localSettings, shopPhone: e.target.value})}
                   className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                 />
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Address</label>
              <textarea 
                rows={2}
                value={localSettings.shopAddress}
                onChange={e => setLocalSettings({...localSettings, shopAddress: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">GST Number</label>
              <input 
                type="text" 
                value={localSettings.shopGst}
                onChange={e => setLocalSettings({...localSettings, shopGst: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Billing Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 font-bold text-slate-800">
            <MonitorPlay size={18} className="text-purple-600" /> POS & Billing Settings
          </div>
          <div className="p-5 flex flex-col gap-5 bg-white">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Bill Print Size</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${localSettings.printSize === 'thermal' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                  <input type="radio" name="printSize" checked={localSettings.printSize === 'thermal'} onChange={() => setLocalSettings({...localSettings, printSize: 'thermal'})} className="hidden" />
                  <span className="font-bold text-sm">Thermal (80mm)</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${localSettings.printSize === 'a4' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                  <input type="radio" name="printSize" checked={localSettings.printSize === 'a4'} onChange={() => setLocalSettings({...localSettings, printSize: 'a4'})} className="hidden" />
                  <span className="font-bold text-sm">A4 Size</span>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Customer Details Collection</label>
              
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={localSettings.enableCustomerDetails} 
                  onChange={e => setLocalSettings({...localSettings, enableCustomerDetails: e.target.checked})}
                  className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <div>
                  <div className="font-bold text-slate-800 text-sm">Capture Customer Name & Phone</div>
                  <div className="text-xs text-slate-500">Show fields on POS screen to record customer details</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={localSettings.enableCustomerGst} 
                  onChange={e => setLocalSettings({...localSettings, enableCustomerGst: e.target.checked})}
                  className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <div>
                  <div className="font-bold text-slate-800 text-sm">Capture Customer GST / Address</div>
                  <div className="text-xs text-slate-500">Enable advanced details for B2B billing</div>
                </div>
              </label>
            </div>
            
            <div className="mt-auto pt-4 flex justify-end">
               <button 
                 onClick={handleSaveShopInfo}
                 className="px-6 py-2 bg-emerald-500 text-white font-bold hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
               >
                 Save All Settings
               </button>
            </div>
          </div>
        </div>

        {/* Cloud Sync Settings */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
             <div className="font-bold text-slate-800 flex items-center gap-2">
               <CloudUpload size={18} className="text-blue-600" /> Google Sheets Sync Configuration
             </div>
             {pendingSales.length > 0 ? (
               <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-1 rounded">
                 {pendingSales.length} Pending
               </span>
             ) : (
               <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-1 rounded">
                 Up to date
               </span>
             )}
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Google Apps Script Web App URL</label>
                <input 
                  type="text" 
                  value={localSettings.googleWebAppUrl}
                  onChange={e => setLocalSettings({...localSettings, googleWebAppUrl: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sheet Name</label>
                <input 
                  type="text" 
                  value={localSettings.sheetName}
                  onChange={e => setLocalSettings({...localSettings, sheetName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium"
                  placeholder="Sales"
                />
              </div>

              {syncStatus && (
                <div className={`p-3 rounded-lg flex items-start gap-2 text-sm font-medium mb-4 ${syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {syncStatus.type === 'success' ? <ShieldCheck size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <span>{syncStatus.text}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={handleSaveShopInfo}
                  className="px-6 py-2 bg-slate-800 text-white font-bold hover:bg-slate-900 rounded-lg shadow-sm transition-colors"
                >
                  Save URL
                </button>
                <button 
                  onClick={handleExecuteSync}
                  disabled={isSyncing}
                  className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSyncing ? "Syncing..." : "📤 Push Data Now"}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-slate-300 font-mono text-[10px] md:text-xs overflow-x-auto shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
               <div className="text-slate-400 font-sans font-bold text-xs mb-2 flex justify-between items-center">
                 <span>Apps Script Setup Code</span>
                 <button className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-slate-800">Copy</button>
               </div>
               <pre className="text-emerald-400">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheetName = data.sheetName || 'Sales';
  var rows = data.rows || [];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ['Bill No', 'Date', 'Time', 'Customer', 'Product', 'Qty', 'Unit', 'Rate', 'Amount', 'Discount', 'Grand Total', 'Payment Mode'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  rows.forEach(function(row) {
    sheet.appendRow([row.billNo, row.date, row.time, row.customer, row.product, row.qty, row.unit, row.rate, row.amount, row.discount, row.grandTotal, row.payMode]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
               </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Local Data Management */}
      <div className="bg-white border border-red-200 rounded-xl shadow-sm flex flex-col overflow-hidden mt-6">
        <div className="p-4 border-b border-red-100 flex items-center justify-between bg-red-50 text-red-800 font-bold">
          <div className="flex items-center gap-2">
             <Trash2 size={18} /> Data Management
          </div>
        </div>
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white">
          <div>
            <h3 className="font-bold text-slate-800">Export & Clear Data</h3>
            <p className="text-sm text-slate-500 mt-1">Export all your billing data to CSV before clearing the memory.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 text-white font-bold hover:bg-slate-900 rounded-lg shadow-sm transition-colors"
            >
              <Download size={18} /> Export CSV
            </button>
            <button 
              onClick={handleClearData}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-red-100 text-red-700 font-bold hover:bg-red-200 rounded-lg shadow-sm transition-colors"
            >
              <Trash2 size={18} /> Clear Data
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
