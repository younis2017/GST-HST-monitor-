/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { InvoiceEntry, InvoiceItem, UserProfile, CANADIAN_PROVINCES } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Printer, 
  X, 
  FileText, 
  Mail, 
  Calendar, 
  DollarSign, 
  Send, 
  CheckCircle,
  Building,
  User,
  PlusCircle,
  Info,
  GraduationCap,
  Eye,
  Clock,
  Flame
} from 'lucide-react';

interface InvoicesProps {
  invoices: InvoiceEntry[];
  onAddInvoice: (invoice: Omit<InvoiceEntry, 'id'>) => Promise<void>;
  onUpdateInvoice: (id: string, invoice: Partial<InvoiceEntry>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onRecordIncomeFromInvoice?: (invoice: InvoiceEntry) => Promise<void>;
  profile: UserProfile | null;
  isSuperAdmin?: boolean;
  onTruncateInvoices?: () => Promise<void>;
  onLogPrintInvoice?: (id: string) => Promise<void>;
}

export default function Invoices({ 
  invoices, 
  onAddInvoice, 
  onUpdateInvoice, 
  onDeleteInvoice, 
  onRecordIncomeFromInvoice,
  profile,
  isSuperAdmin,
  onTruncateInvoices,
  onLogPrintInvoice
}: InvoicesProps) {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState<InvoiceEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewLogsItem, setViewLogsItem] = useState<InvoiceEntry | null>(null);

  // Form States
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [gstHstRate, setGstHstRate] = useState<number>(13);
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Paid' | 'Overdue'>('Draft');
  
  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Consulting Services', quantity: 1, rate: 1000, amount: 1000 }
  ]);

  // Set default tax rate based on profile province
  useMemo(() => {
    if (profile?.province) {
      const provRate = CANADIAN_PROVINCES.find(p => p.code === profile.province);
      if (provRate) {
        setGstHstRate(provRate.rate);
      }
    }
    // Generate next invoice number based on invoices length
    const nextNum = invoices.length + 1;
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`);
    
    // Set default due date to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
  }, [profile, invoices]);

  // Calculations for active form invoice
  const formTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const gstHstAmount = subtotal * (gstHstRate / 100);
    const total = subtotal + gstHstAmount;
    return { subtotal, gstHstAmount, total };
  }, [items, gstHstRate]);

  // Item helpers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !invoiceNumber || items.some(i => !i.description)) {
      alert('Please fill out all required fields and complete line items.');
      return;
    }

    const payload: Omit<InvoiceEntry, 'id'> = {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      dateIssued,
      dueDate,
      items,
      subtotal: formTotals.subtotal,
      gstHstRate,
      gstHstAmount: formTotals.gstHstAmount,
      total: formTotals.total,
      status,
      businessName: profile?.businessName || 'My Business',
      gstNumber: profile?.gstNumber || '',
      createdAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await onUpdateInvoice(editingId, payload);
      } else {
        await onAddInvoice(payload);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Error saving invoice.');
    }
  };

  const startEdit = (inv: InvoiceEntry) => {
    if (!inv.id) return;
    setEditingId(inv.id);
    setInvoiceNumber(inv.invoiceNumber);
    setClientName(inv.clientName);
    setClientEmail(inv.clientEmail || '');
    setClientAddress(inv.clientAddress || '');
    setDateIssued(inv.dateIssued);
    setDueDate(inv.dueDate);
    setItems(inv.items);
    setGstHstRate(inv.gstHstRate);
    setStatus(inv.status);
    setShowForm(true);
  };

  const handlePrint = async () => {
    if (showPreview?.id && onLogPrintInvoice) {
      try {
        await onLogPrintInvoice(showPreview.id);
        if (showPreview.auditLogs) {
          showPreview.auditLogs.push({
            action: 'Printed',
            timestamp: new Date().toISOString(),
            userEmail: profile?.email || 'user@canadatgstracker.local'
          });
        }
      } catch (err) {
        console.error('Error logging invoice print action', err);
      }
    }
    window.print();
  };

  const resetForm = () => {
    setEditingId(null);
    setClientName('');
    setClientEmail('');
    setClientAddress('');
    setItems([{ id: '1', description: 'Consulting Services', quantity: 1, rate: 1000, amount: 1000 }]);
    setStatus('Draft');
    setShowForm(false);
  };

  const handleMarkAsPaid = async (inv: InvoiceEntry) => {
    if (!inv.id) return;
    try {
      await onUpdateInvoice(inv.id, { status: 'Paid' });
      // Proactively prompt or automatically record an Income Ledger entry for paid invoices
      if (onRecordIncomeFromInvoice) {
        await onRecordIncomeFromInvoice(inv);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="invoices-view">
      {/* Printable Area Specific Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Generator</h1>
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-semibold select-none animate-pulse">
              <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
              <span>CRA Audit Mentor Active</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Generate and dispatch CRA-compliant GST/HST invoices for your consulting or freelance clients
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isSuperAdmin && onTruncateInvoices && (
            <button
              onClick={async () => {
                if (confirm('🚨 SUPER ADMIN ALERT: Are you sure you want to TRUNCATE (clear all) invoices? This will wipe out all invoice data and is absolutely IRREVERSIBLE!')) {
                  await onTruncateInvoices();
                }
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-lg shadow-lg hover:bg-rose-900/60 font-semibold text-sm transition-all cursor-pointer"
            >
              <Flame className="h-4 w-4 mr-2 text-rose-400" />
              Truncate Invoices
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-blue-500/30 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-500 font-semibold text-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Profile Warning */}
      {!profile?.gstNumber && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 flex items-start text-sm">
          <Info className="h-5 w-5 mr-3 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">GST/HST Account Number Missing:</span> You should configure your Business Profile with a registered CRA GST/HST number (e.g. 123456789 RT 0001) for legal invoicing compliance in Canada.
          </div>
        </div>
      )}

      {/* Form Dialog Slider */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end" id="invoice-form-modal">
          <div className="bg-slate-900 border-l border-white/10 w-full max-w-2xl h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto text-white animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-400" />
                  {editingId ? 'Edit Invoice' : 'Generate New GST/HST Invoice'}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Invoice Number</label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-001"
                      className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Invoice Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 block w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                    >
                      <option value="Draft" className="bg-slate-950">Draft</option>
                      <option value="Sent" className="bg-slate-950">Sent to Client</option>
                      <option value="Paid" className="bg-slate-950">Paid</option>
                      <option value="Overdue" className="bg-slate-950">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Client Section */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center">
                    <User className="h-4 w-4 mr-2 text-slate-400" /> Client Details
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Client / Company Name</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Acme Corp Canada"
                      className="mt-1 bg-white/5 block w-full px-3 py-2 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Client Email</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="billing@acme.ca"
                        className="mt-1 bg-white/5 block w-full px-3 py-2 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Client Billing Address</label>
                      <input
                        type="text"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="456 Wellington St, Toronto, ON"
                        className="mt-1 bg-white/5 block w-full px-3 py-2 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={dateIssued}
                      onChange={(e) => setDateIssued(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-300">Line Items</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-semibold text-blue-400 flex items-center hover:text-blue-300 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> Add Line
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-center border-b border-white/10 pb-3">
                        <div className="col-span-6">
                          <input
                            type="text"
                            required
                            placeholder="Description of services or products"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Qty"
                            className="block w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="Rate (CAD)"
                            className="block w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Taxes */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="font-semibold text-white">${formTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">GST/HST Rate:</span>
                    <select
                      value={gstHstRate}
                      onChange={(e) => setGstHstRate(parseFloat(e.target.value))}
                      className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">GST/HST Amount ({gstHstRate}%):</span>
                    <span className="font-semibold text-white">${formTotals.gstHstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base text-white">
                    <span>Invoice Total:</span>
                    <span>${formTotals.total.toFixed(2)} CAD</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none cursor-pointer"
                  >
                    {editingId ? 'Update Invoice' : 'Generate & Save Invoice'}
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

      {/* Invoice Grid / Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm">
            <div className="inline-flex p-4 bg-white/5 text-slate-400 rounded-full mb-3 border border-white/5">
              <FileText className="h-6 w-6 stroke-1" />
            </div>
            <p className="text-white text-sm font-semibold">No invoices issued yet</p>
            <p className="text-slate-400 text-xs mt-1">Generate dynamic tax invoices for your consulting clients</p>
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === 'Paid';
            return (
              <div 
                key={inv.id} 
                className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col justify-between hover:bg-white/10 transition-all relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400">{inv.invoiceNumber}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                    inv.status === 'Sent' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                    inv.status === 'Overdue' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-white/5 text-slate-300 border border-white/10'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <h4 className="font-bold text-white text-base">{inv.clientName}</h4>
                  <p className="text-xs text-slate-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" /> Due: {inv.dueDate}
                  </p>
                  <p className="text-xs text-slate-400">
                    Subtotal: ${inv.subtotal.toLocaleString()} + Tax: ${inv.gstHstAmount.toLocaleString()} ({inv.gstHstRate}%)
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 mt-auto flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                    <span className="text-lg font-black text-white">${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                                   <div className="flex items-center space-x-1.5">
                    {!isPaid && (
                      <button
                        onClick={() => handleMarkAsPaid(inv)}
                        className="text-xs bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold px-2.5 py-1.5 rounded-lg flex items-center transition-colors cursor-pointer"
                        title="Mark as Paid & record income"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Paid
                      </button>
                    )}
                    <button
                      onClick={() => setViewLogsItem(inv)}
                      className="text-slate-300 hover:text-teal-400 p-1.5 rounded-lg hover:bg-white/10 border border-white/10 transition-colors cursor-pointer bg-white/5"
                      title="View Invoice Audit Logs"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowPreview(inv)}
                      className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 border border-white/10 transition-colors cursor-pointer bg-white/5"
                      title="View Invoice Sheet"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEdit(inv)}
                      className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 border border-white/10 transition-colors cursor-pointer bg-white/5"
                      title="Edit Invoice"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (inv.id && confirm('Are you sure you want to delete this invoice?')) {
                          await onDeleteInvoice(inv.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Sheet Print Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" id="invoice-preview-modal">
          <div className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header / Controls */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
              <span className="font-bold text-white text-sm">CRA Compliant Invoice Sheet</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-blue-500/30 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 font-semibold text-sm transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4 mr-2" /> Print / Export to PDF
                </button>
                <button
                  onClick={() => setShowPreview(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 overflow-y-auto flex-1 bg-white rounded-b-2xl" id="print-invoice-area">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-6 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">INVOICE</h2>
                  <p className="text-sm font-semibold text-blue-600 mt-1">{showPreview.invoiceNumber}</p>
                </div>
                <div className="text-right sm:text-right text-slate-600 text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{showPreview.businessName}</p>
                  <p className="font-bold text-indigo-600">GST/HST No: {showPreview.gstNumber || 'N/A'}</p>
                  <p>{profile?.address}</p>
                  <p>{profile?.phone}</p>
                  <p>{profile?.email}</p>
                </div>
              </div>

              {/* Bill To & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 text-xs text-slate-600 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="uppercase font-bold text-slate-400 tracking-wider">Bill To</p>
                  <p className="font-bold text-slate-900 text-sm">{showPreview.clientName}</p>
                  <p>{showPreview.clientAddress}</p>
                  <p>{showPreview.clientEmail}</p>
                </div>
                <div className="sm:text-right space-y-1">
                  <p className="uppercase font-bold text-slate-400 tracking-wider">Invoice Timeline</p>
                  <p><span className="font-semibold text-slate-800">Date Issued:</span> {showPreview.dateIssued}</p>
                  <p><span className="font-semibold text-slate-800">Payment Due:</span> {showPreview.dueDate}</p>
                  <p><span className="font-semibold text-slate-800">Payment Status:</span> {showPreview.status}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-center w-16">Qty</th>
                      <th className="py-2.5 text-right w-24">Unit Price</th>
                      <th className="py-2.5 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {showPreview.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-semibold text-slate-900">{item.description}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">${item.rate.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-200 pt-4 flex flex-col items-end text-xs text-slate-600 space-y-2">
                <div className="flex justify-between w-64">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-950">${showPreview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 pb-2 border-b border-slate-100">
                  <span>GST/HST ({showPreview.gstHstRate}%):</span>
                  <span className="font-bold text-slate-950">${showPreview.gstHstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 font-black text-sm text-slate-900">
                  <span>Invoice Total:</span>
                  <span>${showPreview.total.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                <p>Thank you for your business! Legal registered GST/HST consulting Invoice.</p>
                <p className="mt-1">Generated and verified through Canada GST/HST & EI Self-Employed Monitor.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewLogsItem && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print" id="invoice-audit-modal">
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
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-bold text-white">{viewLogsItem.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client / Customer:</span>
                <span className="font-bold text-white">{viewLogsItem.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-white">{viewLogsItem.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax rate applied:</span>
                <span className="text-blue-400 font-semibold">{viewLogsItem.gstHstRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="text-amber-400 font-semibold">{viewLogsItem.status}</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base mt-2">
                <span className="text-slate-200">Gross Invoice Total:</span>
                <span className="text-emerald-400">${viewLogsItem.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                        {log.action === 'Updated' && <Edit className="h-3.5 w-3.5" />}
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
                  if (viewLogsItem.id && onLogPrintInvoice) {
                    await onLogPrintInvoice(viewLogsItem.id);
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
