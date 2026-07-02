/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, IncomeEntry, ExpenseEntry, InvoiceEntry } from './types';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import IncomesList from './components/IncomesList';
import ExpensesList from './components/ExpensesList';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Profile from './components/Profile';
import AdminConsole from './components/AdminConsole';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  LayoutDashboard, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Award, 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  Building2, 
  ChevronRight,
  Calculator,
  ShieldCheck,
  Calendar,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incomes' | 'expenses' | 'invoices' | 'reports' | 'profile' | 'admin'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Auth Change Listener
  useEffect(() => {
    // If user previously selected local sandbox, set local mock user directly
    if (localStorage.getItem('gsthst_use_local_sandbox') === 'true') {
      setUser({
        uid: 'local_sandbox_user',
        email: 'sandbox@canadatgstracker.local',
        emailVerified: true,
        isAnonymous: true,
      } as any);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (localStorage.getItem('gsthst_use_local_sandbox') === 'true') {
        return;
      }
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIncomes([]);
        setExpenses([]);
        setInvoices([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Database Listeners for Active Tenant (User)
  useEffect(() => {
    if (!user) return;

    if (user.uid === 'local_sandbox_user') {
      setLoading(true);
      // Load Profile from local storage
      const cachedProfile = localStorage.getItem('gsthst_sandbox_profile');
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      } else {
        const defaultProfile: UserProfile = {
          email: 'sandbox@canadatgstracker.local',
          businessName: 'My Sandbox Business',
          province: 'ON',
          gstNumber: '123456789 RT 0001',
          address: '123 Sandbox Lane, Toronto, ON',
          phone: '416-555-0199',
          eiTargetHours: 15,
          eiClaimStartDate: new Date().toISOString().split('T')[0]
        };
        setProfile(defaultProfile);
        localStorage.setItem('gsthst_sandbox_profile', JSON.stringify(defaultProfile));
      }

      // Load Incomes from local storage
      const cachedIncomes = localStorage.getItem('gsthst_sandbox_incomes');
      if (cachedIncomes) {
        setIncomes(JSON.parse(cachedIncomes));
      } else {
        setIncomes([]);
      }

      // Load Expenses from local storage
      const cachedExpenses = localStorage.getItem('gsthst_sandbox_expenses');
      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
      } else {
        setExpenses([]);
      }

      // Load Invoices from local storage
      const cachedInvoices = localStorage.getItem('gsthst_sandbox_invoices');
      if (cachedInvoices) {
        setInvoices(JSON.parse(cachedInvoices));
      } else {
        setInvoices([]);
      }

      setLoading(false);
      return;
    }

    setLoading(true);

    // Profile listener
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Create initial default profile if it doesn't exist yet
        const defaultProfile: UserProfile = {
          email: user.email || 'demo@canadatgstracker.local',
          businessName: 'My Sole Proprietorship',
          province: 'ON',
          gstNumber: '',
          address: '',
          phone: '',
          eiTargetHours: 15,
          eiClaimStartDate: new Date().toISOString().split('T')[0]
        };
        setDoc(doc(db, 'users', user.uid), defaultProfile);
      }
    });

    // Incomes listener
    const unsubIncomes = onSnapshot(collection(db, 'users', user.uid, 'incomes'), (snap) => {
      const list: IncomeEntry[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as IncomeEntry);
      });
      // Sort by date descending
      setIncomes(list.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // Expenses listener
    const unsubExpenses = onSnapshot(collection(db, 'users', user.uid, 'expenses'), (snap) => {
      const list: ExpenseEntry[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ExpenseEntry);
      });
      // Sort by date descending
      setExpenses(list.sort((a, b) => b.date.localeCompare(a.date)));
    });

    // Invoices listener
    const unsubInvoices = onSnapshot(collection(db, 'users', user.uid, 'invoices'), (snap) => {
      const list: InvoiceEntry[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as InvoiceEntry);
      });
      // Sort by invoice number descending or creation date
      setInvoices(list.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubIncomes();
      unsubExpenses();
      unsubInvoices();
    };
  }, [user]);

  // Firestore Write Operations (scoped strictly to current user ID)
  const handleAddIncome = async (income: Omit<IncomeEntry, 'id'>) => {
    if (!user) return;
    const initialLogs = income.auditLogs || [{
      action: 'Created' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    }];
    const recordWithLog = { ...income, auditLogs: initialLogs };
    if (user.uid === 'local_sandbox_user') {
      const newIncome: IncomeEntry = { id: 'inc_' + Date.now(), ...recordWithLog };
      const updated = [newIncome, ...incomes];
      setIncomes(updated.sort((a, b) => b.date.localeCompare(a.date)));
      localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify(updated));
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'incomes'), recordWithLog);
  };

  const handleUpdateIncome = async (id: string, updatedFields: Partial<IncomeEntry>) => {
    if (!user) return;
    const existing = incomes.find(item => item.id === id);
    const existingLogs = existing?.auditLogs || [];
    const newLog = {
      action: 'Updated' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    const fieldsWithLog = { ...updatedFields, auditLogs: updatedLogs };
    if (user.uid === 'local_sandbox_user') {
      const updated = incomes.map(item => item.id === id ? { ...item, ...fieldsWithLog } : item);
      setIncomes(updated.sort((a, b) => b.date.localeCompare(a.date)));
      localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'incomes', id), fieldsWithLog);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!user) return;
    if (user.uid === 'local_sandbox_user') {
      const updated = incomes.filter(item => item.id !== id);
      setIncomes(updated);
      localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify(updated));
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'incomes', id));
  };

  const handleAddExpense = async (expense: Omit<ExpenseEntry, 'id'>) => {
    if (!user) return;
    const initialLogs = [{
      action: 'Created' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    }];
    const recordWithLog = { ...expense, auditLogs: initialLogs };
    if (user.uid === 'local_sandbox_user') {
      const newExpense: ExpenseEntry = { id: 'exp_' + Date.now(), ...recordWithLog };
      const updated = [newExpense, ...expenses];
      setExpenses(updated.sort((a, b) => b.date.localeCompare(a.date)));
      localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify(updated));
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'expenses'), recordWithLog);
  };

  const handleUpdateExpense = async (id: string, updatedFields: Partial<ExpenseEntry>) => {
    if (!user) return;
    const existing = expenses.find(item => item.id === id);
    const existingLogs = existing?.auditLogs || [];
    const newLog = {
      action: 'Updated' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    const fieldsWithLog = { ...updatedFields, auditLogs: updatedLogs };
    if (user.uid === 'local_sandbox_user') {
      const updated = expenses.map(item => item.id === id ? { ...item, ...fieldsWithLog } : item);
      setExpenses(updated.sort((a, b) => b.date.localeCompare(a.date)));
      localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'expenses', id), fieldsWithLog);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    if (user.uid === 'local_sandbox_user') {
      const updated = expenses.filter(item => item.id !== id);
      setExpenses(updated);
      localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify(updated));
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
  };

  const handleAddInvoice = async (invoice: Omit<InvoiceEntry, 'id'>) => {
    if (!user) return;
    const initialLogs = [{
      action: 'Created' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    }];
    const recordWithLog = { ...invoice, auditLogs: initialLogs };
    if (user.uid === 'local_sandbox_user') {
      const newInvoice: InvoiceEntry = { id: 'inv_' + Date.now(), ...recordWithLog };
      const updated = [newInvoice, ...invoices];
      setInvoices(updated.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)));
      localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify(updated));
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'invoices'), recordWithLog);
  };

  const handleUpdateInvoice = async (id: string, updatedFields: Partial<InvoiceEntry>) => {
    if (!user) return;
    const existing = invoices.find(item => item.id === id);
    const existingLogs = existing?.auditLogs || [];
    const newLog = {
      action: 'Updated' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    const fieldsWithLog = { ...updatedFields, auditLogs: updatedLogs };
    if (user.uid === 'local_sandbox_user') {
      const updated = invoices.map(item => item.id === id ? { ...item, ...fieldsWithLog } : item);
      setInvoices(updated.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)));
      localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'invoices', id), fieldsWithLog);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!user) return;
    if (user.uid === 'local_sandbox_user') {
      const updated = invoices.filter(item => item.id !== id);
      setInvoices(updated);
      localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify(updated));
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'invoices', id));
  };

  const handleLogPrintIncome = async (id: string) => {
    if (!user) return;
    const existing = incomes.find(item => item.id === id);
    if (!existing) return;
    const existingLogs = existing.auditLogs || [];
    const newLog = {
      action: 'Printed' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    if (user.uid === 'local_sandbox_user') {
      const updated = incomes.map(item => item.id === id ? { ...item, auditLogs: updatedLogs } : item);
      setIncomes(updated);
      localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'incomes', id), { auditLogs: updatedLogs });
  };

  const handleLogPrintExpense = async (id: string) => {
    if (!user) return;
    const existing = expenses.find(item => item.id === id);
    if (!existing) return;
    const existingLogs = existing.auditLogs || [];
    const newLog = {
      action: 'Printed' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    if (user.uid === 'local_sandbox_user') {
      const updated = expenses.map(item => item.id === id ? { ...item, auditLogs: updatedLogs } : item);
      setExpenses(updated);
      localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'expenses', id), { auditLogs: updatedLogs });
  };

  const handleLogPrintInvoice = async (id: string) => {
    if (!user) return;
    const existing = invoices.find(item => item.id === id);
    if (!existing) return;
    const existingLogs = existing.auditLogs || [];
    const newLog = {
      action: 'Printed' as const,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'unknown@canadatgstracker.local'
    };
    const updatedLogs = [...existingLogs, newLog];
    if (user.uid === 'local_sandbox_user') {
      const updated = invoices.map(item => item.id === id ? { ...item, auditLogs: updatedLogs } : item);
      setInInvoicesStateAndLS(updated);
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'invoices', id), { auditLogs: updatedLogs });
  };

  // Helper inside local updates to avoid duplicate declaration of setInvoices and localStorage
  const setInInvoicesStateAndLS = (updated: InvoiceEntry[]) => {
    setInvoices(updated.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)));
    localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify(updated));
  };

  const handleTruncateExpenses = async () => {
    if (!user || user.email !== 'ywaa2025@gmail.com') return;
    if (user.uid === 'local_sandbox_user') {
      setExpenses([]);
      localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify([]));
      return;
    }
    const deletePromises = expenses.map(exp => {
      if (exp.id) {
        return deleteDoc(doc(db, 'users', user.uid, 'expenses', exp.id));
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  };

  const handleTruncateInvoices = async () => {
    if (!user || user.email !== 'ywaa2025@gmail.com') return;
    if (user.uid === 'local_sandbox_user') {
      setInvoices([]);
      localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify([]));
      return;
    }
    const deletePromises = invoices.map(inv => {
      if (inv.id) {
        return deleteDoc(doc(db, 'users', user.uid, 'invoices', inv.id));
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    if (!user) return;
    if (user.uid === 'local_sandbox_user') {
      setProfile(updatedProfile);
      localStorage.setItem('gsthst_sandbox_profile', JSON.stringify(updatedProfile));
      return;
    }
    await setDoc(doc(db, 'users', user.uid), updatedProfile);
  };

  // Real-time Automatic Ledger Synchronization from Invoices
  useEffect(() => {
    if (!user || loading) return;

    let isMounted = true;

    const syncInvoicesToLedger = async () => {
      try {
        // 1. Sync Paid Invoices to Incomes Ledger
        for (const invoice of invoices) {
          if (!invoice.id) continue;
          const matchingIncome = incomes.find(inc => inc.invoiceId === invoice.id);

          if (invoice.status === 'Paid') {
            const expectedIncome: Omit<IncomeEntry, 'id'> = {
              date: invoice.dueDate || invoice.dateIssued,
              clientName: invoice.clientName,
              description: `Payment received for Invoice ${invoice.invoiceNumber}`,
              subtotal: invoice.subtotal,
              gstHstCollected: invoice.gstHstAmount,
              total: invoice.total,
              category: 'Consulting',
              invoiceId: invoice.id,
              createdAt: invoice.createdAt || new Date().toISOString()
            };

            if (!matchingIncome) {
              if (isMounted) {
                console.log(`Auto-creating income entry for Paid Invoice ${invoice.invoiceNumber}`);
                await handleAddIncome(expectedIncome);
              }
            } else {
              // Check if fields need updating
              const needsUpdate = 
                matchingIncome.date !== expectedIncome.date ||
                matchingIncome.clientName !== expectedIncome.clientName ||
                matchingIncome.subtotal !== expectedIncome.subtotal ||
                matchingIncome.gstHstCollected !== expectedIncome.gstHstCollected ||
                matchingIncome.total !== expectedIncome.total ||
                matchingIncome.description !== expectedIncome.description;

              if (needsUpdate && matchingIncome.id) {
                if (isMounted) {
                  console.log(`Auto-updating income entry for Paid Invoice ${invoice.invoiceNumber}`);
                  await handleUpdateIncome(matchingIncome.id, expectedIncome);
                }
              }
            }
          } else {
            // If invoice is NOT Paid, but has a matching income entry, remove it
            if (matchingIncome && matchingIncome.id) {
              if (isMounted) {
                console.log(`Auto-removing income entry for invoice ${invoice.invoiceNumber} as status is no longer Paid (${invoice.status})`);
                await handleDeleteIncome(matchingIncome.id);
              }
            }
          }
        }

        // 2. Remove orphaned income entries that have an invoiceId which no longer exists in invoices
        for (const income of incomes) {
          if (income.invoiceId) {
            const invoiceExists = invoices.some(inv => inv.id === income.invoiceId);
            if (!invoiceExists && income.id) {
              if (isMounted) {
                console.log(`Auto-removing orphaned income entry ${income.id} linked to deleted/missing invoice`);
                await handleDeleteIncome(income.id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Ledger sync error:", err);
      }
    };

    syncInvoicesToLedger();

    return () => {
      isMounted = false;
    };
  }, [user, loading, invoices, incomes]);

  // Helper to record income automatically when client paid an invoice
  const handleRecordIncomeFromInvoice = async (invoice: InvoiceEntry) => {
    if (!invoice.id) return;
    // Simply update invoice status to Paid. The automatic sync useEffect will handle the ledger entry.
    await handleUpdateInvoice(invoice.id, { status: 'Paid' });
  };

  const handleSignOut = () => {
    localStorage.removeItem('gsthst_use_local_sandbox');
    setUser(null);
    signOut(auth);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans relative overflow-hidden" id="app-loading">
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 z-10"></div>
        <p className="text-slate-300 font-semibold z-10">Loading secure Canadian tenant space...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  const isSuperAdmin = user && (
    user.email === 'ywaa2025@gmail.com' ||
    user.email === 'youniswael2017@gmail.com' ||
    user.uid === 'local_sandbox_user'
  );

  const navItems = [
    { id: 'dashboard', label: 'Financial KPI Dashboard', icon: LayoutDashboard },
    { id: 'incomes', label: 'Income & Sales Ledger', icon: TrendingUp },
    { id: 'expenses', label: 'Business Expenses', icon: Receipt },
    { id: 'invoices', label: 'Invoice Generator', icon: FileText },
    { id: 'reports', label: 'CRA & EI Reports', icon: Award },
    { id: 'profile', label: 'Business Profile', icon: UserCircle },
    ...(isSuperAdmin ? [{ id: 'admin', label: 'Super Admin Console', icon: ShieldAlert }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden" id="app-workspace">
      {/* Background Mesh Gradients */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full"></div>

      {/* Mobile Header (no-print) */}
      <div className="md:hidden bg-white/5 backdrop-blur-xl border-b border-white/10 text-white flex items-center justify-between p-4 no-print z-20" id="mobile-top-bar">
        <div className="flex items-center space-x-2">
          <Landmark className="h-6 w-6 text-blue-400" />
          <span className="font-extrabold text-base tracking-tight text-white">Canada GST Tracker</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white focus:outline-none p-1"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation Drawer (no-print) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/90 md:bg-white/5 backdrop-blur-xl border-r border-white/10 text-slate-300 flex flex-col justify-between p-5 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen shrink-0 no-print overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} id="sidebar-drawer">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-white/10">
            <div className="p-2 bg-blue-600/80 backdrop-blur-md rounded-lg text-white border border-blue-500/30">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight block">GST/HST Monitor</span>
              <span className="text-[10px] text-slate-400 font-medium">Tenant Workspace</span>
            </div>
          </div>

          {/* Active Profile Info */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center text-xs font-bold text-white truncate">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
              {profile?.businessName || 'Loading...'}
            </div>
            <div className="text-[10px] text-slate-400 truncate flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" />
              {user.email}
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 group cursor-pointer ${
                    isActive 
                      ? 'bg-white/10 text-white border border-white/10 shadow-md shadow-white/5' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center">
                    <Icon className={`h-4.5 w-4.5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    {item.label}
                  </span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out */}
        <div className="pt-5 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 mr-3" />
            Sign Out Tenant
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-auto md:h-screen z-10" id="main-frame">
        {/* Workspace Active Tab Router */}
        <div className="flex-1 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard incomes={incomes} expenses={expenses} profile={profile} />
              )}
              {activeTab === 'incomes' && (
                <IncomesList 
                  incomes={incomes} 
                  onAddIncome={handleAddIncome} 
                  onUpdateIncome={handleUpdateIncome} 
                  onDeleteIncome={handleDeleteIncome} 
                  profile={profile}
                  onLogPrintIncome={handleLogPrintIncome}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesList 
                  expenses={expenses} 
                  onAddExpense={handleAddExpense} 
                  onUpdateExpense={handleUpdateExpense} 
                  onDeleteExpense={handleDeleteExpense} 
                  profile={profile}
                  isSuperAdmin={user.email === 'ywaa2025@gmail.com'}
                  onTruncateExpenses={handleTruncateExpenses}
                  onLogPrintExpense={handleLogPrintExpense}
                />
              )}
              {activeTab === 'invoices' && (
                <Invoices 
                  invoices={invoices} 
                  onAddInvoice={handleAddInvoice} 
                  onUpdateInvoice={handleUpdateInvoice} 
                  onDeleteInvoice={handleDeleteInvoice} 
                  onRecordIncomeFromInvoice={handleRecordIncomeFromInvoice}
                  profile={profile}
                  isSuperAdmin={user.email === 'ywaa2025@gmail.com'}
                  onTruncateInvoices={handleTruncateInvoices}
                  onLogPrintInvoice={handleLogPrintInvoice}
                />
              )}
              {activeTab === 'reports' && (
                <Reports incomes={incomes} expenses={expenses} profile={profile} />
              )}
              {activeTab === 'profile' && (
                <Profile profile={profile} onUpdateProfile={handleUpdateProfile} />
              )}
              {activeTab === 'admin' && (
                <AdminConsole user={user} profile={profile} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Internal Small Status Footer (no-print) */}
        <div className="text-center text-[10px] text-slate-400 border-t border-white/10 pt-4 mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 no-print" id="workspace-status">
          <div className="flex items-center justify-center space-x-4">
            <span className="flex items-center"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mr-1" /> Canada Cloud Storage</span>
            <span>CRA Registered Format</span>
          </div>
          <p>© 2026 Canada GST/HST & EI Tracker. Securely isolated tenant environment.</p>
        </div>
      </main>
    </div>
  );
}
