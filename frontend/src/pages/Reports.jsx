import React, { useState } from 'react';
import { FileText, Calendar, Printer, FileDown, CheckCircle, Shield } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('Traffic Analytics');
  const [dateRange, setDateRange] = useState('Last 24 Hours');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-800">Compliance Report Generator</h3>
                  <p className="text-xs text-slate-400">Generate certified system activity summaries</p>
               </div>
            </div>
            <Shield className="text-slate-200" size={32} />
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Report Type</label>
                 <select 
                   value={reportType}
                   onChange={(e) => setReportType(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                 >
                   <option>Traffic Analytics Report</option>
                   <option>Security Incident Summary</option>
                   <option>System Uptime & Health</option>
                   <option>User Access Audit Trail</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500"/> Date Range
                 </label>
                 <div className="grid grid-cols-2 gap-3">
                    {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Custom Range'].map(range => (
                      <button 
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          dateRange === range 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="pt-4">
                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                 >
                   {isGenerating ? (
                     <>
                       <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       Aggregating Data...
                     </>
                   ) : (
                     <>Generate Official Report</>
                   )}
                 </button>
              </div>
           </div>

           <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center text-center space-y-4">
              <div className="inline-flex justify-center">
                 <div className="p-4 bg-white rounded-full shadow-sm text-emerald-500">
                    <CheckCircle size={32} />
                 </div>
              </div>
              <h4 className="font-bold text-slate-800">Compliance Ready</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                 All generated reports adhere to ISO/IEC 27001 IoT safety guidelines and including cryptographical integrity checks.
              </p>
           </div>
        </div>
      </div>

      {showPreview && (
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 animate-in zoom-in-95 duration-500 origin-top">
           <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-slate-100">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">IoT System Record</h2>
                 <p className="text-slate-400 font-mono text-xs">REF: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-slate-800">Generated: {new Date().toLocaleDateString()}</p>
                 <p className="text-xs text-slate-500">Target Range: {dateRange}</p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="p-4 bg-slate-50 rounded border-l-4 border-slate-800">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                 <p className="text-xl font-bold text-slate-800">COMPLIANT</p>
              </div>
              <div className="p-4 bg-slate-50 rounded border-l-4 border-slate-800">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Signals</p>
                 <p className="text-xl font-bold text-slate-800">142,501</p>
              </div>
              <div className="p-4 bg-slate-50 rounded border-l-4 border-slate-800">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Anomalies</p>
                 <p className="text-xl font-bold text-red-600">03</p>
              </div>
           </div>

           <div className="space-y-4 mb-12">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-4/6"></div>
           </div>

           <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
                 <Printer size={18} /> Print File
              </button>
              <button className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-600 rounded font-bold hover:bg-slate-50">
                 <FileDown size={18} /> Download CSV
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
