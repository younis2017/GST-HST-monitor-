/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { IncomeEntry, ExpenseEntry, UserProfile, CANADIAN_PROVINCES } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calculator, 
  HelpCircle, 
  Calendar, 
  Percent, 
  Hourglass,
  Scale,
  Award,
  GraduationCap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  profile: UserProfile | null;
}

export default function Dashboard({ incomes, expenses, profile }: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Filter list of years dynamically
  const availableYears = useMemo(() => {
    const years = new Set<string>(['2026']);
    incomes.forEach(inc => {
      if (inc.date) years.add(inc.date.split('-')[0]);
    });
    expenses.forEach(exp => {
      if (exp.date) years.add(exp.date.split('-')[0]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [incomes, expenses]);

  // Filtered entries for selected year
  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => inc.date?.startsWith(selectedYear));
  }, [incomes, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date?.startsWith(selectedYear));
  }, [expenses, selectedYear]);

  // Financial calculations
  const stats = useMemo(() => {
    let grossIncome = 0;
    let gstCollected = 0;
    filteredIncomes.forEach(inc => {
      grossIncome += inc.subtotal || 0;
      gstCollected += inc.gstHstCollected || 0;
    });

    let grossExpenses = 0;
    let gstPaid = 0;
    filteredExpenses.forEach(exp => {
      grossExpenses += exp.subtotal || 0;
      gstPaid += exp.gstHstPaid || 0;
    });

    const netIncome = grossIncome - grossExpenses;
    const netGstHst = gstCollected - gstPaid;

    return {
      grossIncome,
      gstCollected,
      grossExpenses,
      gstPaid,
      netIncome,
      netGstHst
    };
  }, [filteredIncomes, filteredExpenses]);

  // Chart data: Monthly breakdown
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.map((month, index) => {
      const monthStr = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
      
      let incTotal = 0;
      let expTotal = 0;
      let gstColl = 0;
      let gstP = 0;

      filteredIncomes.forEach(inc => {
        if (inc.date?.startsWith(monthStr)) {
          incTotal += inc.subtotal || 0;
          gstColl += inc.gstHstCollected || 0;
        }
      });

      filteredExpenses.forEach(exp => {
        if (exp.date?.startsWith(monthStr)) {
          expTotal += exp.subtotal || 0;
          gstP += exp.gstHstPaid || 0;
        }
      });

      return {
        name: month,
        Income: incTotal,
        Expenses: expTotal,
        'GST/HST Collected': gstColl,
        'GST/HST Paid': gstP,
        Profit: incTotal - expTotal
      };
    });
  }, [filteredIncomes, filteredExpenses, selectedYear]);

  // Expense breakdown by category
  const expenseCategories = useMemo(() => {
    const categories: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      categories[cat] = (categories[cat] || 0) + exp.subtotal;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
    return Object.keys(categories).map((cat, i) => ({
      name: cat,
      value: Math.round(categories[cat]),
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // EI self-employed eligibility estimation
  // To be eligible for EI special benefits (sickness, maternity, etc.) as a self-employed person:
  // 1. Must register for the EI special benefits program.
  // 2. Must meet the minimum self-employed earnings threshold in the previous tax year.
  // The threshold for 2025/2026 is approximately $8,753 in self-employed net income.
  const eiStatus = useMemo(() => {
    const threshold = 8753;
    const currentNet = stats.netIncome;
    const pct = Math.min(100, Math.max(0, (currentNet / threshold) * 100));
    const isEligible = currentNet >= threshold;

    return {
      threshold,
      pct: Math.round(pct),
      isEligible,
      needed: Math.max(0, threshold - currentNet)
    };
  }, [stats.netIncome]);

  const activeProvince = useMemo(() => {
    return CANADIAN_PROVINCES.find(p => p.code === (profile?.province || 'ON')) || CANADIAN_PROVINCES[0];
  }, [profile]);

  return (
    <div className="space-y-6 font-sans text-slate-100" id="dashboard-view">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Financial KPI Dashboard</h1>
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-semibold select-none animate-pulse">
              <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
              <span>CRA Audit Mentor Active</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Self-employed tracking for {profile?.businessName || 'Your Business'} in {activeProvince.province}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Tax Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-white/10 bg-slate-900 rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year} className="bg-slate-950 text-white">{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Level Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Income Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Gross Income</p>
            <h3 className="text-3xl font-extrabold text-white">${stats.grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 flex items-center">
              <span className="text-emerald-400 font-semibold inline-flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                Inflows
              </span>
              excluding tax liabilities
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        {/* Gross Expenses Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Business Expenses</p>
            <h3 className="text-3xl font-extrabold text-white">${stats.grossExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 flex items-center">
              <span className="text-rose-400 font-semibold inline-flex items-center mr-1">
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                Deductions
              </span>
              excluding ITCs (GST/HST paid)
            </p>
          </div>
          <div className="p-3 bg-slate-500/10 rounded-xl text-slate-300 border border-white/5">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500"></div>
        </div>

        {/* Net Income (Profit) Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Net Income (Pre-tax Profit)</p>
            <h3 className={`text-3xl font-extrabold ${stats.netIncome >= 0 ? 'text-white' : 'text-rose-400'}`}>
              ${stats.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400">
              Your bottom line taxable business profit
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${stats.netIncome >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <Calculator className="h-6 w-6" />
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${stats.netIncome >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        </div>
      </div>

      {/* GST/HST CRA Position Card & EI Eligibility Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GST/HST Position */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-lg flex items-center">
                <Scale className="h-5 w-5 mr-2 text-indigo-400" />
                CRA GST/HST Account Balance
              </h4>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-semibold border border-indigo-500/30">
                Province: {activeProvince.code} ({activeProvince.rate}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-white/10">
              <div>
                <p className="text-xs text-slate-400">Box 103: GST/HST Collected</p>
                <p className="text-xl font-bold text-white">${stats.gstCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Box 108: Input Tax Credits (Paid)</p>
                <p className="text-xl font-bold text-white">${stats.gstPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">CRA Remittance Status (Box 109):</p>
              <h3 className={`text-2xl font-black ${stats.netGstHst >= 0 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                {stats.netGstHst >= 0 
                  ? `$${stats.netGstHst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Owed`
                  : `$${Math.abs(stats.netGstHst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Refundable`
                }
              </h3>
            </div>
            <div className="text-xs text-slate-400 max-w-xs">
              {stats.netGstHst >= 0 
                ? "You collected more tax than you paid. Budget this amount for your next quarterly or annual CRA filing."
                : "You paid more tax than you collected! You are eligible for a refund from the CRA (Input Tax Credits)."
              }
            </div>
          </div>
        </div>

        {/* EI Special Benefits Eligibility */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white text-base flex items-center">
                <Award className="h-5 w-5 mr-2 text-amber-400" />
                EI Self-Employed Benefits Indicator
              </h4>
              <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" title="To claim sickness, maternity, or caregiver benefits, Service Canada requires minimum net self-employed earnings of $8,753." />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Qualify for maternity, parental, or sickness special benefits through Service Canada.
            </p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Net Earnings Progress</span>
                <span>{eiStatus.pct}%</span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${eiStatus.isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${eiStatus.pct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$0 Profit</span>
                <span>CRA Target: ${eiStatus.threshold.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            {eiStatus.isEligible ? (
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium flex items-center border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
                Earnings threshold met! You qualify financially for EI special benefit claims once registered.
              </div>
            ) : (
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/30">
                You need <strong className="font-bold text-white">${eiStatus.needed.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong> more in net profit to qualify for self-employed EI benefits.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 lg:col-span-2">
          <h4 className="font-bold text-white mb-4 text-lg">Income vs. Expense Trends</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', color: '#fff' }}
                  formatter={(value) => [`$${value}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Income" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" name="Gross Income" />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" name="Business Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Breakdown */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/10 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white mb-2 text-lg">Expense Deductions</h4>
            <p className="text-xs text-slate-400 mb-4">Breakdown of deductible business write-offs for CRA Form T2125.</p>
            
            {expenseCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm">
                <Percent className="h-8 w-8 mb-2 stroke-1" />
                No expenses logged for {selectedYear}
              </div>
            ) : (
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                {expenseCategories.map((cat, i) => {
                  const percent = stats.grossExpenses > 0 ? Math.round((cat.value / stats.grossExpenses) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span className="flex items-center">
                          <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }}></span>
                          {cat.name}
                        </span>
                        <span>${cat.value.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: cat.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
            Ensure you keep receipts for all logged expenses for up to 6 years in case of a CRA audit.
          </div>
        </div>
      </div>
    </div>
  );
}
