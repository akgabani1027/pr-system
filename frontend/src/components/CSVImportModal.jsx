import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { prAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Layers
} from 'lucide-react';

export const CSVImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importStats, setImportStats] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setError('');
    setImportStats(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setError('The uploaded spreadsheet is empty or has invalid headers.');
          return;
        }

        // Normalize columns
        const normalized = rawJson.map((row, index) => {
          // Normalize keys to lowercase trimmed
          const getVal = (possibleKeys) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const pk of possibleKeys) {
                if (cleanK === pk.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                  return row[k];
                }
              }
            }
            return '';
          };

          const title = getVal(['title', 'requisition', 'item', 'pr title', 'name']) || `Requisition #${index + 1}`;
          const employeeName = getVal(['employee', 'employee name', 'requester', 'requester name', 'user', 'submitted by']) || user.name;
          const employeeEmail = getVal(['email', 'employee email', 'requester email']) || `${employeeName.toLowerCase().replace(/\s+/g, '.')}@prsystem.com`;
          const department = getVal(['department', 'dept']) || 'Engineering';
          const category = getVal(['category', 'type', 'item category']) || 'IT Equipment';
          const priority = getVal(['priority', 'urgency']) || 'Medium';
          const costVal = parseFloat(getVal(['amount', 'cost', 'estimated cost', 'total', 'price', 'total spend', 'estimated total cost', 'total price'])) || 0;
          const status = getVal(['status', 'approval status', 'pr status']) || 'Pending Manager Approval';
          const vendorName = getVal(['vendor', 'vendor name', 'supplier']) || '';
          const description = getVal(['description', 'notes', 'scope', 'details', 'justification']) || '';
          const prNumber = getVal(['pr number', 'pr #', 'pr', 'requisition number']) || '';

          return {
            title,
            employeeName,
            employeeEmail,
            department,
            category,
            priority,
            estimated_total_cost: costVal,
            status,
            vendor_name: vendorName,
            description,
            pr_number: prNumber
          };
        });

        setParsedData(normalized);
      } catch (err) {
        console.error('File parsing error:', err);
        setError('Failed to read Excel/CSV file. Please check file format.');
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "PR Number": "PR-2026-1001",
        "Title": "Dell 4K Monitors for Engineering Team",
        "Employee Name": "Alex Chen",
        "Department": "Engineering",
        "Category": "IT Equipment",
        "Priority": "High",
        "Estimated Cost": 1798.00,
        "Status": "Pending Manager Approval",
        "Vendor Name": "Dell Direct",
        "Description": "2x 32-inch 4K USB-C monitors for new backend engineers"
      },
      {
        "PR Number": "PR-2026-1002",
        "Title": "Annual Notion Enterprise Renewal",
        "Employee Name": "Jessica Davis",
        "Department": "Product",
        "Category": "Software & Subscriptions",
        "Priority": "Medium",
        "Estimated Cost": 4800.00,
        "Status": "Approved",
        "Vendor Name": "Notion Labs Inc.",
        "Description": "Workspace licenses for product & design teams"
      },
      {
        "PR Number": "PR-2026-1003",
        "Title": "Office Supplies & Whiteboards",
        "Employee Name": "Michael Scott",
        "Department": "Operations",
        "Category": "Office Supplies",
        "Priority": "Low",
        "Estimated Cost": 650.00,
        "Status": "Draft",
        "Vendor Name": "Staples Commercial",
        "Description": "Quarterly stationery and conference room supplies"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requisitions_Template");
    XLSX.writeFile(wb, "PR_System_Sample_Import_Template.xlsx");
  };

  const handleCommitImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError('');

    try {
      let importedCount = 0;
      for (const item of parsedData) {
        await prAPI.create({
          title: item.title,
          description: item.description,
          department: item.department,
          category: item.category,
          priority: item.priority,
          currency: 'USD',
          items: [
            {
              item_name: item.title,
              quantity: 1,
              unit_price: item.estimated_total_cost,
              total_price: item.estimated_total_cost,
              specification: item.description
            }
          ],
          vendor_name: item.vendor_name,
          is_draft: item.status === 'Draft'
        });
        importedCount++;
      }

      setImportStats(importedCount);
      setTimeout(() => {
        onSuccess(importedCount);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError('Failed to import some requisitions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-fade-in my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Requisitions (CSV / Excel)</h2>
              <p className="text-xs text-slate-500">Upload bulk employee requisitions to populate throughout the website.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importStats !== null && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Successfully imported {importStats} requisitions! Refreshing live dashboard...</span>
            </div>
          )}

          {/* Template Download & Instructions */}
          <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-brand-900 block">Need a standard spreadsheet template?</span>
              <span className="text-brand-700 text-[11px]">Download our pre-formatted Excel template with sample employee procurement records.</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 font-semibold shadow-sm transition whitespace-nowrap self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {/* Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer relative">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {file ? file.name : "Click or drag & drop CSV / Excel file here"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Supports .xlsx, .xls, and .csv files</p>
          </div>

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-brand-600" />
                  Preview Detected Requisitions ({parsedData.length} records)
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Spend: <span className="font-bold text-slate-800">${parsedData.reduce((acc, it) => acc + it.estimated_total_cost, 0).toLocaleString()}</span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Employee</th>
                      <th className="py-2 px-3">Dept</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-xs">{row.title}</td>
                        <td className="py-2 px-3 text-slate-600">{row.employeeName}</td>
                        <td className="py-2 px-3 text-slate-600">{row.department}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">${row.estimated_total_cost.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <span className="text-xs text-slate-400">
            {parsedData.length > 0 ? `${parsedData.length} records ready to import` : 'No file selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={loading || parsedData.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {loading ? 'Importing Requisitions...' : `Import ${parsedData.length} Requisitions`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
