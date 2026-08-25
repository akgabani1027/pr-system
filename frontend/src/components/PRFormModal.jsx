import React, { useState } from 'react';
import { prAPI } from '../services/api';
import { X, Plus, Trash2, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PRFormModal = ({ isOpen, onClose, onSuccess, onOpenImportCSV }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Engineering');
  const [category, setCategory] = useState('IT Equipment');
  const [priority, setPriority] = useState('Medium');
  const [currency, setCurrency] = useState('USD');
  const [vendorName, setVendorName] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [justification, setJustification] = useState('');
  
  const [items, setItems] = useState([
    { item_name: '', quantity: 1, unit_price: 0, specification: '' }
  ]);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, unit_price: 0, specification: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0);

  const handleSubmit = async (isDraft = false) => {
    setError('');
    if (!title.trim()) {
      setError('Please provide a title for the requisition.');
      return;
    }
    if (items.some(it => !it.item_name.trim())) {
      setError('Please provide a valid item name for all line items.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title,
        description,
        department,
        category,
        priority,
        currency,
        items,
        vendor_name: vendorName,
        required_by_date: requiredByDate || null,
        justification,
        is_draft: isDraft
      };

      const res = await prAPI.create(payload);
      const createdPR = res.data;

      // If file attached, upload it
      if (file && createdPR.id) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          await prAPI.uploadAttachment(createdPR.id, formData);
        } catch (uploadErr) {
          console.error("Failed to upload attachment:", uploadErr);
        }
      }

      onSuccess(createdPR);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit requisition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Purchase Requisition</h2>
            <p className="text-xs text-slate-500">Fill in requisition details or upload an Excel/CSV spreadsheet.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Quick Import Banner inside Modal */}
          {onOpenImportCSV && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Want to import from Excel or CSV?</span>
                  <span className="text-[11px] text-emerald-700">Bulk upload your spreadsheet instead of typing one-by-one.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportCSV();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition whitespace-nowrap"
              >
                Import Excel / CSV
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requisition Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q3 Cloud Server Expansion & Software Licenses"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="IT Equipment">IT Equipment</option>
                <option value="Software & Subscriptions">Software & Subscriptions</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Consulting & Services">Consulting & Services</option>
                <option value="Marketing & Events">Marketing & Events</option>
                <option value="Travel & Expense">Travel & Expense</option>
                <option value="Operations">Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Delivery Date</label>
              <input
                type="date"
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Supplier Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g., Apple Enterprise, Dell Direct, AWS, Figma Inc."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Purpose</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this purchase requisition covers..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Requisition Items</h3>
                <p className="text-xs text-slate-500">Add all line items with quantity and unit cost.</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-12 sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Item Name / Product"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Specifications / notes (e.g. 64GB RAM, Space Gray, Part #123)"
                      value={item.specification}
                      onChange={(e) => handleItemChange(idx, 'specification', e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200/80 bg-white text-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div className="mt-3 flex justify-end items-center gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
              <span className="text-xs font-semibold text-slate-600">Calculated Total Spend:</span>
              <span className="text-lg font-bold text-brand-700">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
            </div>
          </div>

          {/* Business Justification & Document Upload */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Justification</label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Why is this purchase necessary for company / team goals?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Supporting Quote / Invoice</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="pr-attachment"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <label
                  htmlFor="pr-attachment"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {file ? file.name : 'Choose PDF/Doc File'}
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 border border-slate-200 transition disabled:opacity-50"
          >
            Save as Draft
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
