/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { IncomeEntry, ExpenseEntry, UserProfile, CANADIAN_PROVINCES } from '../types';
import { 
  Printer, 
  HelpCircle, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  TrendingUp, 
  Percent, 
  Scale, 
  BadgeHelp,
  Landmark,
  GraduationCap,
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';

interface ReportsProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  profile: UserProfile | null;
}

export default function Reports({ incomes, expenses, profile }: ReportsProps) {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [activeTab, setActiveTab] = useState<'cra' | 'ei' | 'builder'>('cra');

  // Custom Report Builder States
  const [reportType, setReportType] = useState<'income' | 'expenses' | 'combined' | 'tax'>('combined');
  const [reportFrequency, setReportFrequency] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  // Keep date boundaries synchronized when selected year is modified
  useEffect(() => {
    setStartDate(`${selectedYear}-01-01`);
    setEndDate(`${selectedYear}-12-31`);
  }, [selectedYear]);

  // Available Years
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

  // Filtered by year
  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => inc.date?.startsWith(selectedYear));
  }, [incomes, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => exp.date?.startsWith(selectedYear));
  }, [expenses, selectedYear]);

  // CRA Return Calculations (GST34 / GST190 Form)
  const craReturn = useMemo(() => {
    let salesRevenue = 0;
    let gstCollected = 0;
    filteredIncomes.forEach(inc => {
      salesRevenue += inc.subtotal || 0;
      gstCollected += inc.gstHstCollected || 0;
    });

    let gstPaidITCs = 0;
    filteredExpenses.forEach(exp => {
      gstPaidITCs += exp.gstHstPaid || 0;
    });

    const netTax = gstCollected - gstPaidITCs;

    return {
      box101_sales: salesRevenue,
      box103_collected: gstCollected,
      box105_adjustments: 0, // Mock or optional adjustments
      box108_itcs: gstPaidITCs,
      box109_netTax: netTax
    };
  }, [filteredIncomes, filteredExpenses]);

  // EI self-employed weekly earnings report calculations
  // Self-employed EI benefit reporting requires providing your weekly net profit.
  // We can calculate weekly net earnings (Income - Expense) by mapping all transactions to weeks.
  const weeklyEarnings = useMemo(() => {
    const weeks: { [weekNumber: number]: { startDate: string, income: number, expense: number, net: number } } = {};
    
    // Initialize 52 weeks
    for (let w = 1; w <= 52; w++) {
      // Approximate start date of the week
      const date = new Date(parseInt(selectedYear), 0, 1 + (w - 1) * 7);
      weeks[w] = {
        startDate: date.toISOString().split('T')[0],
        income: 0,
        expense: 0,
        net: 0
      };
    }

    // Allocate incomes
    filteredIncomes.forEach(inc => {
      if (!inc.date) return;
      const d = new Date(inc.date);
      const start = new Date(parseInt(selectedYear), 0, 1);
      const diff = d.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      const weekNum = Math.min(52, Math.max(1, Math.ceil((day + 1) / 7)));
      weeks[weekNum].income += inc.subtotal;
    });

    // Allocate expenses
    filteredExpenses.forEach(exp => {
      if (!exp.date) return;
      const d = new Date(exp.date);
      const start = new Date(parseInt(selectedYear), 0, 1);
      const diff = d.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      const weekNum = Math.min(52, Math.max(1, Math.ceil((day + 1) / 7)));
      weeks[weekNum].expense += exp.subtotal;
    });

    // Calculate Net
    for (let w = 1; w <= 52; w++) {
      weeks[w].net = weeks[w].income - weeks[w].expense;
    }

    return Object.keys(weeks).map(w => ({
      weekNum: parseInt(w),
      ...weeks[parseInt(w)]
    }));
  }, [filteredIncomes, filteredExpenses, selectedYear]);

  // Custom Report Builder calculations
  const customReportData = useMemo(() => {
    // 1. Filter incomes by exact date range
    const incomesInRange = incomes.filter(inc => {
      if (!inc.date) return false;
      return inc.date >= startDate && inc.date <= endDate;
    });

    // 2. Filter expenses by exact date range
    const expensesInRange = expenses.filter(exp => {
      if (!exp.date) return false;
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Summary aggregates
    const totalIncomeSubtotal = incomesInRange.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalIncomeTax = incomesInRange.reduce((sum, item) => sum + (item.gstHstCollected || 0), 0);
    const totalIncomeTotal = incomesInRange.reduce((sum, item) => sum + (item.total || 0), 0);

    const totalExpenseSubtotal = expensesInRange.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalExpenseTax = expensesInRange.reduce((sum, item) => sum + (item.gstHstPaid || 0), 0);
    const totalExpenseTotal = expensesInRange.reduce((sum, item) => sum + (item.total || 0), 0);

    const netSubtotal = totalIncomeSubtotal - totalExpenseSubtotal;
    const netTax = totalIncomeTax - totalExpenseTax;
    const netTotal = totalIncomeTotal - totalExpenseTotal;

    // Helper to get week number of a date
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Helper to get start and end of week number in a year
    const getWeekDateRange = (weekNum: number, year: number) => {
      const startDay = new Date(year, 0, 1 + (weekNum - 1) * 7);
      const endDay = new Date(startDay.getTime() + 6 * 86400000);
      return `${startDay.toISOString().split('T')[0]} to ${endDay.toISOString().split('T')[0]}`;
    };

    // Helper to get start and end of bi-week
    const getBiWeekDateRange = (biWeekNum: number, year: number) => {
      const startDay = new Date(year, 0, 1 + (biWeekNum - 1) * 14);
      const endDay = new Date(startDay.getTime() + 13 * 86400000);
      return `${startDay.toISOString().split('T')[0]} to ${endDay.toISOString().split('T')[0]}`;
    };

    // Grouping records
    let groupedPeriods: {
      periodKey: string;
      label: string;
      dateRangeStr: string;
      incomes: IncomeEntry[];
      expenses: ExpenseEntry[];
      incomeSubtotal: number;
      incomeTax: number;
      incomeTotal: number;
      expenseSubtotal: number;
      expenseTax: number;
      expenseTotal: number;
      netSubtotal: number;
      netTax: number;
      netTotal: number;
    }[] = [];

    if (reportFrequency === 'monthly') {
      const monthsMap: { [key: string]: any } = {};
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      // Parse incomes
      incomesInRange.forEach(inc => {
        const d = new Date(inc.date + "T12:00:00");
        const year = d.getFullYear();
        const monthIdx = d.getMonth();
        const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        if (!monthsMap[key]) {
          monthsMap[key] = {
            periodKey: key,
            label: `${monthNames[monthIdx]} ${year}`,
            dateRangeStr: `${year}-${String(monthIdx + 1).padStart(2, '0')}-01 to ${year}-${String(monthIdx + 1).padStart(2, '0')}-28`,
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        monthsMap[key].incomes.push(inc);
        monthsMap[key].incomeSubtotal += inc.subtotal || 0;
        monthsMap[key].incomeTax += inc.gstHstCollected || 0;
        monthsMap[key].incomeTotal += inc.total || 0;
      });

      // Parse expenses
      expensesInRange.forEach(exp => {
        const d = new Date(exp.date + "T12:00:00");
        const year = d.getFullYear();
        const monthIdx = d.getMonth();
        const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        if (!monthsMap[key]) {
          monthsMap[key] = {
            periodKey: key,
            label: `${monthNames[monthIdx]} ${year}`,
            dateRangeStr: `${year}-${String(monthIdx + 1).padStart(2, '0')}-01 to ${year}-${String(monthIdx + 1).padStart(2, '0')}-28`,
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        monthsMap[key].expenses.push(exp);
        monthsMap[key].expenseSubtotal += exp.subtotal || 0;
        monthsMap[key].expenseTax += exp.gstHstPaid || 0;
        monthsMap[key].expenseTotal += exp.total || 0;
      });

      groupedPeriods = Object.values(monthsMap).sort((a, b) => a.periodKey.localeCompare(b.periodKey));

    } else if (reportFrequency === 'weekly') {
      const weeksMap: { [key: string]: any } = {};

      incomesInRange.forEach(inc => {
        const d = new Date(inc.date + "T12:00:00");
        const year = d.getFullYear();
        const weekNum = getWeekNumber(d);
        const key = `${year}-W${String(weekNum).padStart(2, '0')}`;
        if (!weeksMap[key]) {
          weeksMap[key] = {
            periodKey: key,
            label: `Week ${weekNum} (${year})`,
            dateRangeStr: getWeekDateRange(weekNum, year),
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        weeksMap[key].incomes.push(inc);
        weeksMap[key].incomeSubtotal += inc.subtotal || 0;
        weeksMap[key].incomeTax += inc.gstHstCollected || 0;
        weeksMap[key].incomeTotal += inc.total || 0;
      });

      expensesInRange.forEach(exp => {
        const d = new Date(exp.date + "T12:00:00");
        const year = d.getFullYear();
        const weekNum = getWeekNumber(d);
        const key = `${year}-W${String(weekNum).padStart(2, '0')}`;
        if (!weeksMap[key]) {
          weeksMap[key] = {
            periodKey: key,
            label: `Week ${weekNum} (${year})`,
            dateRangeStr: getWeekDateRange(weekNum, year),
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        weeksMap[key].expenses.push(exp);
        weeksMap[key].expenseSubtotal += exp.subtotal || 0;
        weeksMap[key].expenseTax += exp.gstHstPaid || 0;
        weeksMap[key].expenseTotal += exp.total || 0;
      });

      groupedPeriods = Object.values(weeksMap).sort((a, b) => a.periodKey.localeCompare(b.periodKey));

    } else if (reportFrequency === 'biweekly') {
      const biWeeksMap: { [key: string]: any } = {};

      incomesInRange.forEach(inc => {
        const d = new Date(inc.date + "T12:00:00");
        const year = d.getFullYear();
        const weekNum = getWeekNumber(d);
        const biWeekNum = Math.ceil(weekNum / 2);
        const key = `${year}-B${String(biWeekNum).padStart(2, '0')}`;
        if (!biWeeksMap[key]) {
          biWeeksMap[key] = {
            periodKey: key,
            label: `Bi-Week ${biWeekNum} (${year})`,
            dateRangeStr: getBiWeekDateRange(biWeekNum, year),
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        biWeeksMap[key].incomes.push(inc);
        biWeeksMap[key].incomeSubtotal += inc.subtotal || 0;
        biWeeksMap[key].incomeTax += inc.gstHstCollected || 0;
        biWeeksMap[key].incomeTotal += inc.total || 0;
      });

      expensesInRange.forEach(exp => {
        const d = new Date(exp.date + "T12:00:00");
        const year = d.getFullYear();
        const weekNum = getWeekNumber(d);
        const biWeekNum = Math.ceil(weekNum / 2);
        const key = `${year}-B${String(biWeekNum).padStart(2, '0')}`;
        if (!biWeeksMap[key]) {
          biWeeksMap[key] = {
            periodKey: key,
            label: `Bi-Week ${biWeekNum} (${year})`,
            dateRangeStr: getBiWeekDateRange(biWeekNum, year),
            incomes: [],
            expenses: [],
            incomeSubtotal: 0,
            incomeTax: 0,
            incomeTotal: 0,
            expenseSubtotal: 0,
            expenseTax: 0,
            expenseTotal: 0,
            netSubtotal: 0,
            netTax: 0,
            netTotal: 0
          };
        }
        biWeeksMap[key].expenses.push(exp);
        biWeeksMap[key].expenseSubtotal += exp.subtotal || 0;
        biWeeksMap[key].expenseTax += exp.gstHstPaid || 0;
        biWeeksMap[key].expenseTotal += exp.total || 0;
      });

      groupedPeriods = Object.values(biWeeksMap).sort((a, b) => a.periodKey.localeCompare(b.periodKey));
    }

    // Calculate subtotal - expense for each grouped period
    groupedPeriods.forEach(gp => {
      gp.netSubtotal = gp.incomeSubtotal - gp.expenseSubtotal;
      gp.netTax = gp.incomeTax - gp.expenseTax;
      gp.netTotal = gp.incomeTotal - gp.expenseTotal;
    });

    return {
      incomes: incomesInRange.sort((a, b) => b.date.localeCompare(a.date)),
      expenses: expensesInRange.sort((a, b) => b.date.localeCompare(a.date)),
      groupedPeriods,
      aggregates: {
        incomeSubtotal: totalIncomeSubtotal,
        incomeTax: totalIncomeTax,
        incomeTotal: totalIncomeTotal,
        expenseSubtotal: totalExpenseSubtotal,
        expenseTax: totalExpenseTax,
        expenseTotal: totalExpenseTotal,
        netSubtotal,
        netTax,
        netTotal
      }
    };
  }, [incomes, expenses, startDate, endDate, reportFrequency]);

  const activeProvince = useMemo(() => {
    return CANADIAN_PROVINCES.find(p => p.code === (profile?.province || 'ON')) || CANADIAN_PROVINCES[0];
  }, [profile]);

  const applyPreset = (preset: 'q1' | 'q2' | 'q3' | 'q4' | 'ytd' | 'full') => {
    const yearStr = selectedYear;
    switch (preset) {
      case 'q1':
        setStartDate(`${yearStr}-01-01`);
        setEndDate(`${yearStr}-03-31`);
        break;
      case 'q2':
        setStartDate(`${yearStr}-04-01`);
        setEndDate(`${yearStr}-06-30`);
        break;
      case 'q3':
        setStartDate(`${yearStr}-07-01`);
        setEndDate(`${yearStr}-09-30`);
        break;
      case 'q4':
        setStartDate(`${yearStr}-10-01`);
        setEndDate(`${yearStr}-12-31`);
        break;
      case 'ytd':
        setStartDate(`${yearStr}-01-01`);
        const today = new Date();
        const currentYearStr = today.getFullYear().toString();
        if (currentYearStr === yearStr) {
          setEndDate(today.toISOString().split('T')[0]);
        } else {
          setEndDate(`${yearStr}-12-31`);
        }
        break;
      case 'full':
        setStartDate(`${yearStr}-01-01`);
        setEndDate(`${yearStr}-12-31`);
        break;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" id="reports-view">
      {/* Print styles applied globally when printing reports page */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report-area, #print-report-area * {
            visibility: visible;
          }
          #print-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">CRA & EI Compliance Reports</h1>
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-semibold select-none animate-pulse">
              <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
              <span>CRA Audit Mentor Active</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Generate printable tax declarations, Box GST returns, and weekly Service Canada benefit statements
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-white/10 bg-slate-950 rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year} className="bg-slate-950 text-white">{year}</option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-blue-500/30 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 font-semibold text-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report Sheet
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/10 no-print gap-1">
        <button
          onClick={() => setActiveTab('cra')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cra' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          CRA GST/HST Return (GST34)
        </button>
        <button
          onClick={() => setActiveTab('ei')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ei' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          EI Weekly Earnings Statement
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'builder' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Custom Report Builder
        </button>
      </div>

      {/* Main Report Container */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6 sm:p-8" id="print-report-area">
        {/* Printable Letterhead Header */}
        <div className="hidden print:flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">GST/HST & Benefit Report Sheet</h2>
            <p className="text-xs text-blue-600 font-semibold mt-1">FOR TAX YEAR: {selectedYear}</p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{profile?.businessName || 'My Business'}</p>
            <p className="font-bold text-indigo-600">GST/HST No: {profile?.gstNumber || 'N/A'}</p>
            <p>{profile?.email}</p>
            <p>{profile?.phone}</p>
          </div>
        </div>

        {activeTab === 'cra' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Landmark className="h-5 w-5 mr-2 text-indigo-400" />
                  CRA GST/HST Net Return Declaration (Form GST34)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Use these box totals to directly fill your online NETFILE GST/HST Return in your CRA My Business Account.
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center no-print">
                <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" /> Fully Compliant Format
              </div>
            </div>

            {/* CRA GST34 Box Table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-slate-300 font-semibold text-xs uppercase tracking-wider text-left border-b border-white/10">
                    <th className="px-6 py-3">CRA Box Number</th>
                    <th className="px-6 py-3">Description / Line Title</th>
                    <th className="px-6 py-3 text-right">Amount (CAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white text-xs">Box 101</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">Total Sales and Other Revenues</div>
                      <div className="text-xs text-slate-400">Subtotal of all consulting, retail or contract services billed in Canada</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${craReturn.box101_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-400 text-xs">Box 103</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">GST/HST Collected or Collectible</div>
                      <div className="text-xs text-slate-400">The total sales tax you charged clients in Canada during the year</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${craReturn.box103_collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400 text-xs">Box 105</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">Total GST/HST Adjustments</div>
                      <div className="text-xs text-slate-400">CRA adjustments or write-offs (typically 0.00 unless instructed by CRA)</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-400">
                      $0.00
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-400 text-xs">Box 108</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">Input Tax Credits (ITCs)</div>
                      <div className="text-xs text-slate-400">Total GST/HST you paid on eligible business expenses (deductible)</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-400">
                      ${craReturn.box108_itcs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-white/5 font-black">
                    <td className="px-6 py-5 font-bold text-blue-400 text-sm">Box 109</td>
                    <td className="px-6 py-5 text-sm">
                      <div className="text-white font-extrabold">Net Tax (Owed to CRA or Refundable)</div>
                      <div className="text-xs text-slate-400 font-medium mt-1">Box 103 (Collected) minus Box 108 (Paid ITCs)</div>
                    </td>
                    <td className={`px-6 py-5 text-right text-base font-black ${craReturn.box109_netTax >= 0 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {craReturn.box109_netTax >= 0 
                        ? `$${craReturn.box109_netTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} Owed`
                        : `$${Math.abs(craReturn.box109_netTax).toLocaleString(undefined, { minimumFractionDigits: 2 })} Refundable`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CRA Filing Assist Info */}
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-start text-xs text-slate-300 gap-3.5 no-print">
              <HelpCircle className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="space-y-1.5">
                <p className="font-bold text-white">Filing Guide for Sole Proprietors:</p>
                <p>1. Log in to your <strong className="font-bold text-white">CRA My Business Account</strong>.</p>
                <p>2. Select "File GST/HST Return (GST34)" under your registered GST/HST account.</p>
                <p>3. Enter the totals from <strong className="font-bold text-white">Box 101, Box 103, and Box 108</strong>.</p>
                <p>4. If Box 109 is positive, submit your payment online. If negative, CRA will direct deposit your refund within 10-15 business days.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ei' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-400" />
                  Service Canada EI Weekly Net Earnings Statement
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  For self-employed Canadians receiving EI Special Benefits. Service Canada requires you to declare your weekly net profit.
                </p>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center no-print">
                <BadgeHelp className="h-4 w-4 mr-1.5 text-amber-400" /> Service Canada Ready
              </div>
            </div>

            {/* Weekly Earnings Table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto shadow-sm">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 font-semibold uppercase tracking-wider border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 w-24">Week</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3 text-right">Invoiced Revenue</th>
                    <th className="px-6 py-3 text-right">Deductible Expenses</th>
                    <th className="px-6 py-3 text-right font-bold">Weekly Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  {weeklyEarnings.map((week) => (
                    <tr key={week.weekNum} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-2.5 font-bold text-white">Week {week.weekNum}</td>
                      <td className="px-6 py-2.5 text-slate-400">{week.startDate}</td>
                      <td className="px-6 py-2.5 text-right text-slate-300">${week.income.toFixed(2)}</td>
                      <td className="px-6 py-2.5 text-right text-slate-300">${week.expense.toFixed(2)}</td>
                      <td className={`px-6 py-2.5 text-right font-bold ${week.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        ${week.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* EI Disclaimer */}
            <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-300 space-y-1.5 no-print">
              <p className="font-bold">EI Benefits Declaration Warning:</p>
              <p>Self-employed earnings must be reported on your bi-weekly EI reports. Service Canada calculates your weekly net earnings as gross revenue minus operating expenses. Declaring accurate weekly profits prevents overpayment penalties and ensures you receive the maximum eligible sickness or parental benefits.</p>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="space-y-6">
            {/* Options Filter Panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 no-print space-y-4">
              <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider">Report Generator Options</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Report Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Report Ledger Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
                  >
                    <option value="combined">Combined (Income & Expenses)</option>
                    <option value="income">Income & Sales Ledger Only</option>
                    <option value="expenses">Operating Expenses Only</option>
                    <option value="tax">Tax Position Summary (CRA/EI)</option>
                  </select>
                </div>

                {/* Group By / Frequency */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Grouping Frequency</label>
                  <select
                    value={reportFrequency}
                    onChange={(e) => setReportFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
                  >
                    <option value="none">Detailed Transaction List</option>
                    <option value="weekly">Weekly Breakdown</option>
                    <option value="biweekly">Bi-Weekly Breakdown</option>
                    <option value="monthly">Monthly Breakdown</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Presets and Helpers */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Tax Presets ({selectedYear}):</span>
                <button
                  type="button"
                  onClick={() => applyPreset('q1')}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded border border-white/5 hover:border-white/10 font-semibold cursor-pointer text-slate-300 transition-colors"
                >
                  Q1 (Jan - Mar)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('q2')}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded border border-white/5 hover:border-white/10 font-semibold cursor-pointer text-slate-300 transition-colors"
                >
                  Q2 (Apr - Jun)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('q3')}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded border border-white/5 hover:border-white/10 font-semibold cursor-pointer text-slate-300 transition-colors"
                >
                  Q3 (Jul - Sep)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('q4')}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded border border-white/5 hover:border-white/10 font-semibold cursor-pointer text-slate-300 transition-colors"
                >
                  Q4 (Oct - Dec)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ytd')}
                  className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900/40 text-[10px] rounded border border-blue-500/20 text-blue-400 font-semibold cursor-pointer transition-colors"
                >
                  Year to Date
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded border border-white/5 hover:border-white/10 font-semibold cursor-pointer text-slate-300 transition-colors"
                >
                  Full Tax Year
                </button>
              </div>
            </div>

            {/* Printout Title - Hidden except on print */}
            <div className="hidden print:block border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">CUSTOM LEDGER REPORT</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Type: <b className="text-slate-800 uppercase font-bold">{reportType}</b> | 
                Interval: <b className="text-slate-800 uppercase font-bold">{reportFrequency === 'none' ? 'Date range' : reportFrequency}</b> | 
                Period: <b>{startDate}</b> to <b>{endDate}</b>
              </p>
            </div>

            {/* Custom Report Aggregates Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Gross Revenue / Income card */}
              {(reportType === 'combined' || reportType === 'income' || reportType === 'tax') && (
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4 print:border-slate-200 print:border">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg no-print">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block print:text-slate-600">Total Billed Income</span>
                    <span className="text-xl font-black text-white print:text-slate-900">
                      ${customReportData.aggregates.incomeSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-500 block print:text-slate-500 mt-0.5">
                      GST/HST Collected: ${customReportData.aggregates.incomeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Deductible Operating Expenses card */}
              {(reportType === 'combined' || reportType === 'expenses' || reportType === 'tax') && (
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4 print:border-slate-200 print:border">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg no-print">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block print:text-slate-600">Total Expenses</span>
                    <span className="text-xl font-black text-white print:text-slate-900">
                      ${customReportData.aggregates.expenseSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-500 block print:text-slate-500 mt-0.5">
                      GST/HST Paid (ITCs): ${customReportData.aggregates.expenseTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Net Position card */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center space-x-4 print:border-slate-200 print:border">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg no-print">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block print:text-slate-600">
                    {reportType === 'tax' ? 'Net CRA Tax Position' : 'Net Business Profits'}
                  </span>
                  <span className={`text-xl font-black ${
                    reportType === 'tax' 
                      ? customReportData.aggregates.netTax >= 0 ? 'text-indigo-400 print:text-indigo-700' : 'text-emerald-400 print:text-emerald-700'
                      : customReportData.aggregates.netSubtotal >= 0 ? 'text-white print:text-slate-950' : 'text-rose-400 print:text-rose-700'
                  }`}>
                    {reportType === 'tax' ? (
                      customReportData.aggregates.netTax >= 0 
                        ? `$${customReportData.aggregates.netTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} Owed`
                        : `$${Math.abs(customReportData.aggregates.netTax).toLocaleString(undefined, { minimumFractionDigits: 2 })} ITC Refund`
                    ) : (
                      `$${customReportData.aggregates.netSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500 block print:text-slate-500 mt-0.5">
                    {reportType === 'tax' ? (
                      `GST Billed ($${customReportData.aggregates.incomeTax.toFixed(2)}) - ITCs ($${customReportData.aggregates.expenseTax.toFixed(2)})`
                    ) : (
                      `Total Net with Tax: $${customReportData.aggregates.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Details table or grouped table based on selection */}
            {reportFrequency === 'none' ? (
              // Chronological ledger list of incomes/expenses
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider block print:text-slate-800">
                    Chronological Ledger Items ({customReportData.incomes.length + customReportData.expenses.length} records)
                  </h5>
                  <span className="text-[10px] text-slate-400 font-medium">Filtered list</span>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-sm print:border-slate-300">
                  <table className="min-w-full text-xs text-left text-slate-300 print:text-slate-800">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-white/10 sticky top-0 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                      <tr>
                        <th className="px-6 py-3 w-28">Date</th>
                        <th className="px-6 py-3 w-20">Type</th>
                        <th className="px-6 py-3">Category / Desc</th>
                        <th className="px-6 py-3">Client / Payee</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                        <th className="px-6 py-3 text-right">GST/HST</th>
                        <th className="px-6 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-300 print:divide-slate-200 print:text-slate-900">
                      {/* Interleave incomes and expenses sorted by date */}
                      {(() => {
                        const items: Array<
                          | { type: 'Income'; data: IncomeEntry }
                          | { type: 'Expense'; data: ExpenseEntry }
                        > = [];
                        
                        if (reportType === 'combined' || reportType === 'income' || reportType === 'tax') {
                          customReportData.incomes.forEach(inc => items.push({ type: 'Income', data: inc }));
                        }
                        if (reportType === 'combined' || reportType === 'expenses' || reportType === 'tax') {
                          customReportData.expenses.forEach(exp => items.push({ type: 'Expense', data: exp }));
                        }

                        // Sort descending
                        items.sort((a, b) => b.data.date.localeCompare(a.data.date));

                        if (items.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">
                                No records found in the specified date range.
                              </td>
                            </tr>
                          );
                        }

                        return items.map((item, idx) => {
                          const isIncome = item.type === 'Income';
                          if (isIncome) {
                            const inc = item.data as IncomeEntry;
                            return (
                              <tr key={`inc-${inc.id || idx}`} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-semibold font-mono">{inc.date}</td>
                                <td className="px-6 py-3">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase text-[9px] print:bg-blue-100 print:text-blue-800">
                                    INCOME
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="font-semibold text-white print:text-black">{inc.category}</span>
                                  <span className="text-[10px] text-slate-400 block max-w-xs truncate mt-0.5 print:text-slate-600">{inc.description}</span>
                                </td>
                                <td className="px-6 py-3 font-medium text-slate-400 print:text-slate-700">{inc.clientName}</td>
                                <td className="px-6 py-3 text-right font-medium">${(inc.subtotal || 0).toFixed(2)}</td>
                                <td className="px-6 py-3 text-right text-slate-400">${(inc.gstHstCollected || 0).toFixed(2)}</td>
                                <td className="px-6 py-3 text-right font-bold text-white print:text-black">${(inc.total || 0).toFixed(2)}</td>
                              </tr>
                            );
                          } else {
                            const exp = item.data as ExpenseEntry;
                            return (
                              <tr key={`exp-${exp.id || idx}`} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-semibold font-mono">{exp.date}</td>
                                <td className="px-6 py-3">
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold uppercase text-[9px] print:bg-rose-100 print:text-rose-800">
                                    EXPENSE
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="font-semibold text-white print:text-black">{exp.category}</span>
                                  <span className="text-[10px] text-slate-400 block max-w-xs truncate mt-0.5 print:text-slate-600">{exp.description}</span>
                                </td>
                                <td className="px-6 py-3 font-medium text-slate-400 print:text-slate-700">{exp.supplierName}</td>
                                <td className="px-6 py-3 text-right font-medium text-rose-300 print:text-rose-800">-${(exp.subtotal || 0).toFixed(2)}</td>
                                <td className="px-6 py-3 text-right text-slate-400">${(exp.gstHstPaid || 0).toFixed(2)}</td>
                                <td className="px-6 py-3 text-right font-bold text-rose-300 print:text-rose-800">-${(exp.total || 0).toFixed(2)}</td>
                              </tr>
                            );
                          }
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Grouped breakdown table (weekly, biweekly, monthly)
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider block print:text-slate-800">
                    Grouped Periods Performance ({customReportData.groupedPeriods.length} intervals)
                  </h5>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">Grouped {reportFrequency}</span>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-sm print:border-slate-300">
                  <table className="min-w-full text-xs text-left text-slate-300 print:text-slate-800">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-white/10 sticky top-0 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                      <tr>
                        <th className="px-6 py-3">Period</th>
                        <th className="px-6 py-3">Date Range</th>
                        {(reportType === 'combined' || reportType === 'income' || reportType === 'tax') && (
                          <th className="px-6 py-3 text-right">Invoiced Revenue</th>
                        )}
                        {(reportType === 'combined' || reportType === 'expenses' || reportType === 'tax') && (
                          <th className="px-6 py-3 text-right">Operating Expenses</th>
                        )}
                        <th className="px-6 py-3 text-right font-bold">
                          {reportType === 'tax' ? 'Net GST Payable' : 'Net Profit / Loss'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-300 print:divide-slate-200 print:text-slate-900">
                      {customReportData.groupedPeriods.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                            No records found during the filter criteria to group.
                          </td>
                        </tr>
                      ) : (
                        customReportData.groupedPeriods.map((gp) => (
                          <tr key={gp.periodKey} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-3 font-bold text-white print:text-black">{gp.label}</td>
                            <td className="px-6 py-3 text-slate-400 font-mono text-[10px] print:text-slate-600">{gp.dateRangeStr}</td>
                            
                            {(reportType === 'combined' || reportType === 'income' || reportType === 'tax') && (
                              <td className="px-6 py-3 text-right">${gp.incomeSubtotal.toFixed(2)}</td>
                            )}
                            
                            {(reportType === 'combined' || reportType === 'expenses' || reportType === 'tax') && (
                              <td className="px-6 py-3 text-right text-rose-300 print:text-rose-800">-${gp.expenseSubtotal.toFixed(2)}</td>
                            )}

                            <td className={`px-6 py-3 text-right font-bold ${
                              reportType === 'tax'
                                ? gp.netTax >= 0 ? 'text-indigo-400 print:text-indigo-800' : 'text-emerald-400 print:text-emerald-800'
                                : gp.netSubtotal >= 0 ? 'text-white print:text-slate-950' : 'text-rose-400 print:text-rose-800'
                            }`}>
                              {reportType === 'tax' ? (
                                gp.netTax >= 0 ? `$${gp.netTax.toFixed(2)}` : `-$${Math.abs(gp.netTax).toFixed(2)}`
                              ) : (
                                `$${gp.netSubtotal.toFixed(2)}`
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
