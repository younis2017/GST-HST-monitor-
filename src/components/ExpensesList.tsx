/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ExpenseEntry, CANADIAN_PROVINCES, UserProfile } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Receipt, 
  DollarSign, 
  Calendar,
  Filter,
  GraduationCap,
  Eye,
  Printer,
  Clock,
  Flame
} from 'lucide-react';

interface ExpensesListProps {
  expenses: ExpenseEntry[];
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, expense: Partial<ExpenseEntry>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  profile: UserProfile | null;
  isSuperAdmin?: boolean;
  onTruncateExpenses?: () => Promise<void>;
  onLogPrintExpense?: (id: string) => Promise<void>;
}

export const CRA_EXPENSE_CATEGORIES = [
  { value: 'Advertising', label: 'Advertising (CRA 8521)' },
  { value: 'Office Expenses', label: 'Office Expenses (CRA 8810)' },
  { value: 'Office Supplies', label: 'Office Supplies & Stationery (CRA 8811)' },
  { value: 'Professional Fees', label: 'Professional Fees (Legal & Acct) (CRA 8860)' },
  { value: 'Utilities & Telephone', label: 'Utilities & Telephone (CRA 9224)' },
  { value: 'Travel Expenses', label: 'Travel Expenses (CRA 9200)' },
  { value: 'Software & Internet', label: 'Software, Cloud & Internet (CRA 9270)' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment (50% Deductible) (CRA 8523)' },
  { value: 'Delivery & Shipping', label: 'Delivery, Freight & Express (CRA 9275)' },
  { value: 'Other Business Expenses', label: 'Other Business Expenses (CRA 9270)' }
];

export default function ExpensesList({ 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense, 
  profile,
  isSuperAdmin,
  onTruncateExpenses,
  onLogPrintExpense
}: ExpensesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewLogsItem, setViewLogsItem] = useState<ExpenseEntry | null>(null);
 
  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Office Expenses');
  const [paymentMethod, setPaymentMethod] = useState<'Debit' | 'Credit' | 'Cash'>('Debit');
  const [subtotalStr, setSubtotalStr] = useState('');
  const [gstHstRate, setGstHstRate] = useState<number>(13); // Default to ON
  const [gstHstPaidStr, setGstHstPaidStr] = useState('');
  const [totalStr, setTotalStr] = useState('');
 
  // Set default tax rate based on profile province
  useMemo(() => {
    if (profile?.province) {
      const provRate = CANADIAN_PROVINCES.find(p => p.code === profile.province);
      if (provRate) {
        setGstHstRate(provRate.rate);
      }
    }
  }, [profile]);
 
  // Recalculate tax and total when subtotal or tax rate changes
  const handleSubtotalChange = (val: string) => {
    setSubtotalStr(val);
    const sub = parseFloat(val);
    if (!isNaN(sub)) {
      const tax = (sub * (gstHstRate / 100));
      setGstHstPaidStr(tax.toFixed(2));
      setTotalStr((sub + tax).toFixed(2));
    } else {
      setGstHstPaidStr('');
      setTotalStr('');
    }
  };
 
  const handleTaxRateChange = (rate: number) => {
    setGstHstRate(rate);
    const sub = parseFloat(subtotalStr);
    if (!isNaN(sub)) {
      const tax = (sub * (rate / 100));
      setGstHstPaidStr(tax.toFixed(2));
      setTotalStr((sub + tax).toFixed(2));
    }
  };
 
  const handlePaidChange = (val: string) => {
    setGstHstPaidStr(val);
    const sub = parseFloat(subtotalStr);
    const tax = parseFloat(val);
    if (!isNaN(sub) && !isNaN(tax)) {
      setTotalStr((sub + tax).toFixed(2));
    } else if (!isNaN(sub)) {
      setTotalStr(sub.toFixed(2));
    }
  };
 
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !subtotalStr || !date) return;
 
    const sub = parseFloat(subtotalStr);
    const tax = parseFloat(gstHstPaidStr) || 0;
    const tot = parseFloat(totalStr) || (sub + tax);
 
    const payload: Omit<ExpenseEntry, 'id'> = {
      date,
      supplierName,
      description,
      category,
      paymentMethod,
      subtotal: sub,
      gstHstPaid: tax,
      total: tot,
      createdAt: new Date().toISOString()
    };
 
    try {
      if (editingId) {
        await onUpdateExpense(editingId, payload);
      } else {
        await onAddExpense(payload);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Error saving expense transaction.');
    }
  };
 
  const startEdit = (exp: ExpenseEntry) => {
    if (!exp.id) return;
    setEditingId(exp.id);
    setDate(exp.date);
    setSupplierName(exp.supplierName);
    setDescription(exp.description || '');
    setCategory(exp.category || 'Office Expenses');
    setPaymentMethod(exp.paymentMethod || 'Debit');
    setSubtotalStr(String(exp.subtotal));
    setGstHstPaidStr(String(exp.gstHstPaid));
    setTotalStr(String(exp.total));
    
    // Find closest rate
    const ratio = exp.subtotal > 0 ? (exp.gstHstPaid / exp.subtotal) * 100 : 0;
    const matchedProvince = CANADIAN_PROVINCES.reduce((prev, curr) => {
      return Math.abs(curr.rate - ratio) < Math.abs(prev.rate - ratio) ? curr : prev;
    });
    setGstHstRate(ratio > 1 ? matchedProvince.rate : 0);
    
    setShowForm(true);
  };
 
  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setSupplierName('');
    setDescription('');
    setCategory('Office Expenses');
    setPaymentMethod('Debit');
    setSubtotalStr('');
    setGstHstPaidStr('');
    setTotalStr('');
    setShowForm(false);
  };
 
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = 
        exp.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === '' || exp.category === categoryFilter;
      const matchMethod = methodFilter === '' || (exp.paymentMethod || 'Debit') === methodFilter;
      return matchSearch && matchCat && matchMethod;
    });
  }, [expenses, searchTerm, categoryFilter, methodFilter]);

  const totalSum = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => ({
      subtotal: acc.subtotal + (curr.subtotal || 0),
      gst: acc.gst + (curr.gstHstPaid || 0),
      total: acc.total + (curr.total || 0)
    }), { subtotal: 0, gst: 0, total: 0 });
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 font-sans text-slate-100" id="expenses-view">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Business Expenses Ledger</h1>
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-semibold select-none animate-pulse">
              <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
              <span>CRA Audit Mentor Active</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Record supplier receipts, invoices, and track Input Tax Credits (GST/HST paid on operations)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isSuperAdmin && onTruncateExpenses && (
            <button
              onClick={async () => {
                if (confirm('🚨 SUPER ADMIN ALERT: Are you sure you want to TRUNCATE (clear all) expenses? This will wipe out all expense data and is absolutely IRREVERSIBLE!')) {
                  await onTruncateExpenses();
                }
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-lg shadow-lg hover:bg-rose-900/60 font-semibold text-sm transition-all cursor-pointer"
            >
              <Flame className="h-4 w-4 mr-2 text-rose-400" />
              Truncate Expenses
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-blue-500/30 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-500 font-semibold text-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Slide-over Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end" id="expense-form-modal">
          <div className="bg-slate-900 border-l border-white/10 w-full max-w-lg h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto text-white animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-blue-400" />
                  {editingId ? 'Edit Expense Transaction' : 'Log Expense Receipt'}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Bell Canada, Staples, AWS"
                    className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Transaction Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mt-1 block w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                    >
                      <option value="Debit" className="bg-slate-950 text-white">Debit</option>
                      <option value="Credit" className="bg-slate-950 text-white">Credit</option>
                      <option value="Cash" className="bg-slate-950 text-white">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">CRA Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                  >
                    {CRA_EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-slate-950 text-white">{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the item or service purchased"
                    className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Subtotal (CAD)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={subtotalStr}
                          onChange={(e) => handleSubtotalChange(e.target.value)}
                          placeholder="0.00"
                          className="block w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300">CRA Tax Rate</label>
                      <select
                        value={gstHstRate}
                        onChange={(e) => handleTaxRateChange(parseFloat(e.target.value))}
                        className="mt-1 block w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                      >
                        <option value={13} className="bg-slate-950 text-white">13% HST (Ontario)</option>
                        <option value={15} className="bg-slate-950 text-white">15% HST (NS, NB, NL, PEI)</option>
                        <option value={5} className="bg-slate-950 text-white">5% GST (AB, BC, SK, MB, Terr.)</option>
                        <option value={14.975} className="bg-slate-950 text-white">14.975% GST/QST (Quebec)</option>
                        <option value={12} className="bg-slate-950 text-white">12% GST/PST (BC, MB)</option>
                        <option value={11} className="bg-slate-950 text-white">11% GST/PST (SK)</option>
                        <option value={0} className="bg-slate-950 text-white">0% Tax Exempt / Zero-rated</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">GST/HST Paid (ITC)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={gstHstPaidStr}
                          onChange={(e) => handlePaidChange(e.target.value)}
                          placeholder="0.00"
                          className="block w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300">Gross Total (CAD)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="h-4 w-4 font-bold text-slate-300" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          disabled
                          value={totalStr}
                          className="block w-full pl-8 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white font-bold focus:outline-none text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none cursor-pointer"
                  >
                    {editingId ? 'Update Ledger' : 'Save Ledger Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 px-4 border border-white/10 rounded-lg text-sm font-semibold text-white bg-white/5 hover:bg-white/10 focus:outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by supplier or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-white/10 bg-slate-900 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-950 text-white">All Categories</option>
              {CRA_EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-slate-950 text-white">{cat.value}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-300 font-medium">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-white/10 bg-slate-900 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-950 text-white">All Methods</option>
              <option value="Debit" className="bg-slate-950 text-white">Debit</option>
              <option value="Credit" className="bg-slate-950 text-white">Credit</option>
              <option value="Cash" className="bg-slate-950 text-white">Cash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table List */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl shadow-black/10 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex p-4 bg-white/5 text-slate-400 rounded-full mb-3 border border-white/5">
              <Plus className="h-6 w-6 stroke-1" />
            </div>
            <p className="text-white text-sm font-semibold">No expense records found</p>
            <p className="text-slate-400 text-xs mt-1">Get started by entering your deductible receipts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 font-semibold text-slate-300 text-left text-xs uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Supplier & Description</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Subtotal</th>
                  <th className="px-6 py-3.5 text-right">GST/HST Paid (ITC)</th>
                  <th className="px-6 py-3.5 text-right">Gross Total</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {exp.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{exp.supplierName}</div>
                      <div className="text-xs text-slate-400 max-w-xs truncate">{exp.description || 'No description provided'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/5">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                        exp.paymentMethod === 'Credit'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : exp.paymentMethod === 'Cash'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {exp.paymentMethod || 'Debit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-white">
                      ${exp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-medium text-indigo-400 font-semibold">
                      ${exp.gstHstPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-white">
                      ${exp.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setViewLogsItem(exp)}
                          className="text-slate-400 hover:text-teal-400 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                          title="View Transaction Audit Logs"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEdit(exp)}
                          className="text-slate-400 hover:text-blue-400 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (exp.id && confirm('Delete this expense record? This will deduct from your ITCs.')) {
                              await onDeleteExpense(exp.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 border-t border-white/10 font-bold text-white text-right">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-left">Ledger Totals:</td>
                  <td className="px-6 py-4">${totalSum.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-indigo-400">${totalSum.gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-blue-400">${totalSum.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {viewLogsItem && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print" id="expense-audit-modal">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setViewLogsItem(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-4">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold text-white">CRA Audit & History Monitor</h3>
                <p className="text-xs text-slate-400">Secure real-time transaction activity log</p>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6 space-y-2 text-sm text-slate-300 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier / Payee:</span>
                <span className="font-bold text-white">{viewLogsItem.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-white">{viewLogsItem.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-blue-400 font-semibold">{viewLogsItem.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="text-amber-400 font-semibold">{viewLogsItem.paymentMethod || 'Debit'}</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base mt-2">
                <span className="text-slate-200">Gross Deductible Expense:</span>
                <span className="text-rose-400">${viewLogsItem.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Audit Trail Activity Logs
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[17px] before:w-[2px] before:bg-white/10 max-h-48 overflow-y-auto pr-2">
                {(!viewLogsItem.auditLogs || viewLogsItem.auditLogs.length === 0) ? (
                  <p className="text-xs text-slate-400 italic pl-10">No audit logs recorded for this transaction.</p>
                ) : (
                  viewLogsItem.auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-4 relative pl-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border ${
                        log.action === 'Created' 
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                          : log.action === 'Updated'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      }`}>
                        {log.action === 'Created' && <Plus className="h-3 w-3" />}
                        {log.action === 'Updated' && <Edit2 className="h-3.5 w-3.5" />}
                        {log.action === 'Printed' && <Printer className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{log.action}</span>
                          <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">By: {log.userEmail}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  if (viewLogsItem.id && onLogPrintExpense) {
                    await onLogPrintExpense(viewLogsItem.id);
                    // Update local state copy to immediately show printed log
                    const updatedLogs = [...(viewLogsItem.auditLogs || []), {
                      action: 'Printed' as const,
                      timestamp: new Date().toISOString(),
                      userEmail: profile?.email || 'user@canadatgstracker.local'
                    }];
                    setViewLogsItem({ ...viewLogsItem, auditLogs: updatedLogs });
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 px-4 border border-blue-500/30 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/15 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Transaction Voucher</span>
              </button>
              <button
                onClick={() => setViewLogsItem(null)}
                className="py-2.5 px-4 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
