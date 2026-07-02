import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, AuditLogEntry } from '../types';
import { 
  ShieldAlert, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Database, 
  Loader2,
  RefreshCw,
  FileText,
  Receipt
} from 'lucide-react';

interface AdminConsoleProps {
  user: any;
  profile: UserProfile | null;
}

interface TenantUser {
  uid: string;
  email: string;
  businessName: string;
  province: string;
  phone?: string;
  address?: string;
}

export default function AdminConsole({ user, profile }: AdminConsoleProps) {
  const [tenants, setTenants] = useState<TenantUser[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantUser | null>(null);
  
  // Stats for the selected tenant
  const [statsLoading, setStatsLoading] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [expenseCount, setExpenseCount] = useState<number | null>(null);
  const [incomeCount, setIncomeCount] = useState<number | null>(null);

  // Actions states
  const [truncating, setTruncating] = useState<'invoices' | 'expenses' | 'incomes' | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isLocalSandbox = user?.uid === 'local_sandbox_user';

  // Load Tenants
  const loadTenants = async () => {
    setLoadingTenants(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      if (isLocalSandbox) {
        // Mock tenants for Sandbox play
        const mockTenants: TenantUser[] = [
          {
            uid: 'local_sandbox_user',
            email: 'sandbox@canadatgstracker.local',
            businessName: profile?.businessName || 'My Sandbox Business',
            province: profile?.province || 'ON',
            phone: profile?.phone,
            address: profile?.address
          },
          {
            uid: 'mock_tenant_jane',
            email: 'jane.consulting@canadatgstracker.local',
            businessName: 'Jane Consulting Services',
            province: 'QC',
            phone: '514-555-0122',
            address: '456 Rue Saint-Denis, Montreal, QC'
          },
          {
            uid: 'mock_tenant_john',
            email: 'john.smith.builders@canadatgstracker.local',
            businessName: 'John Smith Contracting',
            province: 'BC',
            phone: '604-555-0188',
            address: '789 Granville St, Vancouver, BC'
          }
        ];
        setTenants(mockTenants);
        setLoadingTenants(false);
        return;
      }

      // Real Firestore Users
      const snap = await getDocs(collection(db, 'users'));
      const list: TenantUser[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          uid: docSnap.id,
          email: data.email || 'unknown@canadatgstracker.local',
          businessName: data.businessName || 'Unnamed Business',
          province: data.province || 'ON',
          phone: data.phone || '',
          address: data.address || ''
        });
      });
      setTenants(list);
    } catch (err: any) {
      console.error("Error loading tenants:", err);
      setActionError(`Failed to fetch tenant database: ${err.message || err.toString()}. Ensure security rules are deployed and you are authorized.`);
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [user, profile]);

  // Load stats when tenant is selected
  const fetchTenantStats = async (tenantId: string) => {
    setStatsLoading(true);
    setInvoiceCount(null);
    setExpenseCount(null);
    setIncomeCount(null);
    try {
      if (isLocalSandbox) {
        if (tenantId === 'local_sandbox_user') {
          const cachedInvoices = localStorage.getItem('gsthst_sandbox_invoices');
          const cachedExpenses = localStorage.getItem('gsthst_sandbox_expenses');
          const cachedIncomes = localStorage.getItem('gsthst_sandbox_incomes');
          setInvoiceCount(cachedInvoices ? JSON.parse(cachedInvoices).length : 0);
          setExpenseCount(cachedExpenses ? JSON.parse(cachedExpenses).length : 0);
          setIncomeCount(cachedIncomes ? JSON.parse(cachedIncomes).length : 0);
        } else {
          // Initialize mock quantities for demo accounts
          const cachedInvoices = localStorage.getItem(`gsthst_mock_invoices_${tenantId}`);
          const cachedExpenses = localStorage.getItem(`gsthst_mock_expenses_${tenantId}`);
          
          if (cachedInvoices === null) {
            // Seed default values for demo
            localStorage.setItem(`gsthst_mock_invoices_${tenantId}`, JSON.stringify([
              { id: '1', invoiceNumber: 'INV-101', total: 1500, dateIssued: '2026-01-10' },
              { id: '2', invoiceNumber: 'INV-102', total: 850, dateIssued: '2026-02-14' }
            ]));
            setInvoiceCount(2);
          } else {
            setInvoiceCount(JSON.parse(cachedInvoices).length);
          }

          if (cachedExpenses === null) {
            // Seed default values for demo
            localStorage.setItem(`gsthst_mock_expenses_${tenantId}`, JSON.stringify([
              { id: '1', supplierName: 'Rogers Telecom', total: 113, category: 'Utilities' }
            ]));
            setExpenseCount(1);
          } else {
            setExpenseCount(JSON.parse(cachedExpenses).length);
          }
          setIncomeCount(0);
        }
        setStatsLoading(false);
        return;
      }

      // Fetch from Firestore
      const invoicesSnap = await getDocs(collection(db, 'users', tenantId, 'invoices'));
      const expensesSnap = await getDocs(collection(db, 'users', tenantId, 'expenses'));
      const incomesSnap = await getDocs(collection(db, 'users', tenantId, 'incomes'));

      setInvoiceCount(invoicesSnap.size);
      setExpenseCount(expensesSnap.size);
      setIncomeCount(incomesSnap.size);
    } catch (err: any) {
      console.error("Error loading stats:", err);
      setActionError("Could not retrieve tenant data statistics. Check read permissions.");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantStats(selectedTenant.uid);
    } else {
      setInvoiceCount(null);
      setExpenseCount(null);
      setIncomeCount(null);
    }
  }, [selectedTenant]);

  const handleTruncate = async () => {
    if (!selectedTenant || !truncating) return;
    if (confirmInput.toUpperCase() !== 'TRUNCATE') {
      setActionError("Invalid confirmation word. Please type TRUNCATE exactly.");
      return;
    }

    const type = truncating;
    setTruncating(null);
    setConfirmInput('');
    setActionSuccess(null);
    setActionError(null);
    setStatsLoading(true);

    try {
      if (isLocalSandbox) {
        if (selectedTenant.uid === 'local_sandbox_user') {
          if (type === 'invoices') {
            localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify([]));
            // Also need to trigger state refresh if applicable, but we do it in local storage
            setInvoiceCount(0);
          } else if (type === 'expenses') {
            localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify([]));
            setExpenseCount(0);
          } else {
            localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify([]));
            setIncomeCount(0);
          }
        } else {
          localStorage.setItem(`gsthst_mock_${type}_${selectedTenant.uid}`, JSON.stringify([]));
          if (type === 'invoices') setInvoiceCount(0);
          if (type === 'expenses') setExpenseCount(0);
          if (type === 'incomes') setIncomeCount(0);
        }
        setActionSuccess(`Successfully truncated all ${type} for sandbox tenant ${selectedTenant.businessName}!`);
        setStatsLoading(false);
        return;
      }

      // Firestore deletion loop
      const collectionPath = collection(db, 'users', selectedTenant.uid, type);
      const snap = await getDocs(collectionPath);
      
      const deletePromises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // If we truncated invoices, we should also delete linked incomes to keep ledger clean?
      // No, user specifically requested to truncate invoices or expenses, let's keep it direct.
      
      setActionSuccess(`Successfully truncated all ${type} records for tenant ${selectedTenant.businessName} in active Cloud Store.`);
      await fetchTenantStats(selectedTenant.uid);
    } catch (err: any) {
      console.error("Truncate error:", err);
      setActionError(`Truncate operation failed: ${err.message || err}`);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-slate-100" id="super-admin-view">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Operations</h1>
            <p className="text-slate-400 text-sm mt-1">
              Select any tenant/user workspace to audit metadata and perform destructive operations (Truncate Records)
            </p>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {actionSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-start space-x-3 text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl flex items-start space-x-3 text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{actionError}</span>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: User selection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              Tenant Directory
            </h3>
            <button 
              onClick={loadTenants}
              disabled={loadingTenants}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              title="Refresh Tenants"
            >
              <RefreshCw className={`h-4 w-4 ${loadingTenants ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingTenants ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <span className="text-xs">Reading cloud registry...</span>
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No registered business tenants found in system.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {tenants.map((t) => {
                const isSelected = selectedTenant?.uid === t.uid;
                return (
                  <button
                    key={t.uid}
                    onClick={() => {
                      setSelectedTenant(t);
                      setActionSuccess(null);
                      setActionError(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col space-y-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="font-bold flex items-center">
                      <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                      {t.businessName}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Mail className="h-3 w-3 mr-1.5" />
                      {t.email}
                    </span>
                    <div className="flex justify-between items-center mt-1 text-[9px] text-slate-500">
                      <span>Prov: <b className="text-slate-300">{t.province}</b></span>
                      <span>UID: {t.uid.slice(0, 8)}...</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right columns: Selected tenant overview & destructive actions */}
        <div className="md:col-span-2 space-y-6">
          {selectedTenant ? (
            <div className="space-y-6">
              {/* Tenant Details Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">ACTIVE SELECTION</span>
                    <h2 className="text-xl font-black text-white mt-1">{selectedTenant.businessName}</h2>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-slate-500" />
                      {selectedTenant.email}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
                    Province: {selectedTenant.province}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="p-3 bg-white/5 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] block">CONTACT PHONE</span>
                    <span className="font-semibold">{selectedTenant.phone || 'None provided'}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] block">POSTAL / STREET ADDRESS</span>
                    <span className="font-semibold">{selectedTenant.address || 'None provided'}</span>
                  </div>
                </div>
              </div>

              {/* Data metrics overview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                  <Database className="h-4 w-4 mr-2 text-emerald-400" />
                  Tenant Workspace Database Payload
                </h3>

                {statsLoading ? (
                  <div className="flex items-center space-x-3 py-6 text-slate-400 text-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                    <span>Analyzing collections...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Invoices */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Invoices</span>
                        <span className="text-2xl font-black text-white">{invoiceCount !== null ? invoiceCount : '—'}</span>
                      </div>
                    </div>

                    {/* Expenses */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4">
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Expenses</span>
                        <span className="text-2xl font-black text-white">{expenseCount !== null ? expenseCount : '—'}</span>
                      </div>
                    </div>

                    {/* Incomes */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Incomes</span>
                        <span className="text-2xl font-black text-white">{incomeCount !== null ? incomeCount : '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Destructive Control Panel */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center">
                    <AlertTriangle className="h-4.5 w-4.5 mr-2 text-rose-400" />
                    Danger Zone Operations
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Truncating records will instantly purge all records in that collection. This action is absolutely irreversible and bypasses normal business limits.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Truncate Incomes Button */}
                  <button
                    onClick={() => {
                      setTruncating('incomes');
                      setConfirmInput('');
                      setActionSuccess(null);
                      setActionError(null);
                    }}
                    disabled={statsLoading || incomeCount === 0}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl shadow-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                    Truncate Incomes
                  </button>

                  {/* Truncate Expenses Button */}
                  <button
                    onClick={() => {
                      setTruncating('expenses');
                      setConfirmInput('');
                      setActionSuccess(null);
                      setActionError(null);
                    }}
                    disabled={statsLoading || expenseCount === 0}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl shadow-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                    Truncate Expenses
                  </button>

                  {/* Truncate Invoices Button */}
                  <button
                    onClick={() => {
                      setTruncating('invoices');
                      setConfirmInput('');
                      setActionSuccess(null);
                      setActionError(null);
                    }}
                    disabled={statsLoading || invoiceCount === 0}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl shadow-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                    Truncate Invoices
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center h-[350px]">
              <ShieldAlert className="h-12 w-12 text-slate-500 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-white">No Tenant Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select a business profile from the tenant directory on the left to review metrics and perform database purging actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {truncating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Confirm Destructive Truncation</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              You are about to completely wipe out/truncate all <strong className="text-rose-400 uppercase">{truncating}</strong> for the business: 
              <br />
              <strong className="text-white text-sm block mt-1">"{selectedTenant?.businessName}"</strong>
              This action is <span className="text-rose-400 font-bold uppercase underline">permanently destructive</span> and cannot be undone.
            </p>

            <div className="bg-rose-950/40 border border-rose-500/20 rounded-lg p-3 mb-4 text-[11px] text-slate-400">
              To proceed, please type <strong className="text-rose-400 font-mono">TRUNCATE</strong> in the box below.
            </div>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type TRUNCATE here"
              className="w-full bg-black/50 border border-rose-500/30 rounded-xl px-4 py-2.5 text-center text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={handleTruncate}
                disabled={confirmInput.toUpperCase() !== 'TRUNCATE'}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
              >
                Permanently Truncate
              </button>
              <button
                onClick={() => setTruncating(null)}
                className="py-2.5 px-4 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
