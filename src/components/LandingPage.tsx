import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Award, 
  ShieldCheck, 
  BookOpen, 
  Scale, 
  Lock, 
  ChevronRight, 
  Sparkles, 
  User, 
  ArrowRight,
  Eye,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Heart
} from 'lucide-react';
import Login from './Login';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'tour' | 'blogs' | 'terms' | 'privacy' | 'login'>('tour');
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);

  const blogs = [
    {
      id: 'gst-hst-basics',
      title: 'Demystifying GST/HST for Canadian Freelancers and Contractors',
      excerpt: 'Learn the $30,000 threshold rule, how Input Tax Credits (ITCs) save you money, and provincial taxation differences.',
      category: 'GST/HST Filing',
      date: 'June 28, 2026',
      readTime: '6 min read',
      author: 'Wael Younis',
      content: `
### The $30,000 GST/HST Registration Rule
In Canada, if your gross taxable revenues from worldwide sales of goods and services exceed **$30,000** in any single calendar quarter or over four consecutive calendar quarters, you are considered a "large supplier" by the Canada Revenue Agency (CRA). At this point, **registration for a GST/HST account is mandatory**. 

If your revenues are below $30,000, registration is optional. However, registering voluntarily can be highly advantageous because of **Input Tax Credits (ITCs)**.

### Harnessing Input Tax Credits (ITCs)
When you register for GST/HST, you must collect tax on your invoices. However, you also get to **reclaim the GST/HST you pay** on your business-related expenses (like web hosting, office space, computer equipment, and internet services). 

These are claimed as ITCs. If the GST/HST you paid on expenses exceeds the tax you collected from clients, the CRA will issue you a **refund** for the difference!

### Understanding Provincial Tax Rates
Tax rates vary significantly across Canada. Depending on where your clients reside (place of supply rule), you must charge either:
* **Harmonized Sales Tax (HST)** in Ontario (13%), Prince Edward Island (15%), Nova Scotia (15%), New Brunswick (15%), and Newfoundland (15%).
* **GST & PST** in British Columbia (5% GST + 7% PST), Manitoba (5% GST + 7% RST), Saskatchewan (5% GST + 6% PST).
* **GST & QST** in Quebec (5% GST + 9.975% QST).
* **GST Only** in Alberta, Northwest Territories, Nunavut, and Yukon (5% GST).

Using an automated ledger like the **Canada GST/HST Tracker** ensures you track each province's collected taxes perfectly, preventing expensive audit errors at tax time.
      `
    },
    {
      id: 'ei-special-benefits',
      title: 'EI Special Benefits: How Self-Employed Canadians Can Opt In',
      excerpt: 'Sole proprietors don’t automatically qualify for EI, but you can opt into special benefits. Here is how to qualify and track your hours.',
      category: 'Employment Insurance',
      date: 'June 15, 2026',
      readTime: '5 min read',
      author: 'CRA Advisory Group',
      content: `
### What are EI Special Benefits?
Self-employed Canadians do not pay Employment Insurance (EI) premiums automatically, nor do they qualify for regular EI benefits (such as job-loss coverage). However, you can choose to enter into an agreement with the Canada Employment Insurance Commission to opt into **EI Special Benefits**.

These special benefits include:
1. **Maternity and Parental Benefits**: For individuals who are pregnant or have recently given birth, or are caring for a newborn or newly adopted child.
2. **Sickness Benefits**: For individuals unable to work due to medical reasons, illness, or quarantine.
3. **Family Caregiver Benefits**: For individuals providing care or support to a critically ill or injured family member.

### How to Opt In and Register
To opt-in, you must register through **My Service Canada Account (MSCA)**. Once registered, you will begin paying EI premiums on your self-employment income when you file your annual income tax return. You must wait **12 months** after registering before you can submit a claim for benefits.

### The Qualification Requirements
To qualify for EI special benefits, you must meet two main criteria:
* You must have earned a minimum amount of self-employment income (e.g., approximately $8,500+ depending on the tax year) in the calendar year preceding your claim.
* You should track and align your business hours. When submitting a claim, Service Canada evaluates your engagement. It is highly recommended to log and track your weekly working hours (our platform targets **15 hours/week** as a standard benchmark for active business engagement) to prove active self-employed status.

By consistently maintaining an active business profile and log history, you establish a bulletproof history of compliance for Service Canada.
      `
    },
    {
      id: 'audit-proofing',
      title: 'A Sole Proprietor’s Guide to CRA Audit-Proofing Your Business Ledger',
      excerpt: 'Protect your self-employed business from CRA scrutiny with these clean ledger guidelines and transaction isolation strategies.',
      category: 'Tax Compliance',
      date: 'May 30, 2026',
      readTime: '7 min read',
      author: 'Financial Audit Dept',
      content: `
### The Importance of Transaction Logging
The Canada Revenue Agency (CRA) requires all sole proprietors and self-employed individuals to maintain organized, detailed financial records for at least **six years** from the end of the tax year to which they relate. If you are audited, having a messy bank statement is not enough; you must provide clear ledger proof.

### Five Steps to a Bulletproof Business Ledger

#### 1. Separate Business and Personal Expenses
Never run personal expenditures through your business bank account. If you pay for groceries with your business card, it flags the entire account during a CRA review. Keep clean ledger lines.

#### 2. Itemize GST/HST Separately
On both your incomes and expenses, always list the subtotal and the GST/HST paid/collected as separate, distinct lines. The CRA will match your reported ITCs against individual receipts.

#### 3. Keep Clean Digital Copies
Thermal receipts fade over time. Scan or digitally log every supplier invoice and sales receipt. The **Canada GST/HST Tracker** helps you record corresponding notes, transaction dates, and categories for instant retrieval.

#### 4. File Accurate Invoices
Ensure every invoice you issue contains your **9-digit Business Number (BN)** and your official registered business address. Invoices without a valid GST/HST number are invalid, and your clients can be denied ITCs, harming your professional relationships.

#### 5. Back Up and Export Consistently
Don't rely on paper notebooks. Ensure your tenant space is securely backed up. Our cloud storage and local sandbox systems offer secure, structured formats that align perfectly with CRA ledger requirements.
      `
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between" id="landing-container">
      {/* Background Mesh Gradients */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 blur-[120px] rounded-full"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/15 blur-[120px] rounded-full"></div>

      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40 no-print" id="landing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('tour'); setSelectedBlogId(null); }}>
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight block">GST/HST Monitor</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Canada Sole Proprietor</span>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex space-x-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('tour'); setSelectedBlogId(null); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'tour' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Product Tour
            </button>
            <button
              onClick={() => { setActiveTab('blogs'); setSelectedBlogId(null); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'blogs' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              CRA Tax Blogs
            </button>
            <button
              onClick={() => { setActiveTab('privacy'); setSelectedBlogId(null); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'privacy' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => { setActiveTab('terms'); setSelectedBlogId(null); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'terms' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Terms of Service
            </button>
          </nav>

          {/* Header Action */}
          <div>
            <button
              onClick={() => { setActiveTab('login'); setSelectedBlogId(null); }}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'login' ? 'bg-white/10 text-white border border-white/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
            >
              {activeTab === 'login' ? 'Auth View Active' : 'Access Tenant Workspace'}
              {activeTab !== 'login' && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-white/5 px-2 py-1.5 gap-1 scrollbar-none bg-slate-900/40">
          <button
            onClick={() => { setActiveTab('tour'); setSelectedBlogId(null); }}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${activeTab === 'tour' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Product Tour
          </button>
          <button
            onClick={() => { setActiveTab('blogs'); setSelectedBlogId(null); }}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${activeTab === 'blogs' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Tax Blogs
          </button>
          <button
            onClick={() => { setActiveTab('privacy'); setSelectedBlogId(null); }}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${activeTab === 'privacy' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => { setActiveTab('terms'); setSelectedBlogId(null); }}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${activeTab === 'terms' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            Terms
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-16"
              id="landing-tour-tab"
            >
              {/* Hero Banner Section */}
              <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
                <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  <span>Fully Integrated with Service Canada & CRA Standards</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
                  Canadian Tax Tracking built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Sole Proprietors</span>
                </h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Avoid CRA filing stress. Log sales revenue GST/HST, record eligible business expense Input Tax Credits (ITCs), track working hours towards EI special benefits, and generate professional PDF invoices—all inside a secure, isolated tenant workspace.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => setActiveTab('login')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Open Workspace Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                  <button
                    onClick={() => setActiveTab('blogs')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                    Read Sole Proprietor Blogs
                  </button>
                </div>
              </div>

              {/* Core Feature Matrix */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">CRA Compliant Bookkeeping pillars</h2>
                  <p className="text-slate-400 text-xs max-w-lg mx-auto">
                    A comprehensive toolset designed exclusively for Canadian freelancers, contractors, and self-employed consultants.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Pillar 1 */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-blue-500/30 transition-all">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base">Income & Sales Ledger</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Log sales income with custom provincial tax parameters. Track GST/HST collected (Ontario 13%, Quebec 14.975%, BC 5%) automatically.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-emerald-500/30 transition-all">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base">Expense & ITC Claiming</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Record business expense subtotals alongside Input Tax Credits (ITCs) to directly offset the GST/HST you owe to the CRA.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-violet-500/30 transition-all">
                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl w-fit">
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base">EI Special Benefits Hour Log</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Track your active business hours against the 600-hour milestone. Stay eligible for Service Canada maternal, sick, and caregiver benefits.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 hover:border-amber-500/30 transition-all">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base">Invoice PDF Generator</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Produce compliant business invoices containing your 9-digit CRA Business Number (BN) and provincial tax breakdowns.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secure Multi-Tenant Architecture Callout */}
              <div className="bg-gradient-to-r from-blue-950/20 to-emerald-950/20 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">CRA Audit-Proof Isolation</span>
                  </div>
                  <h3 className="text-xl font-black text-white">Your Financial Logs Stay Completely Isolated</h3>
                  <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                    We support secure Sandbox play and encrypted Firebase persistence. Each user's database sub-collections are isolated at the database rules layer, ensuring your business accounts remain fully private, secure, and compliant.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all shadow-lg shrink-0 flex items-center cursor-pointer"
                >
                  Configure Sandbox / Sign In
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </button>
              </div>

              {/* Informational Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-t border-white/10 pt-10">
                <div className="space-y-1">
                  <span className="text-2xl font-black text-white">100% compliant</span>
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">CRAplace of supply rules</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl font-black text-emerald-400">600 hours</span>
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Self-Employed EI Qualification</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl font-black text-blue-400">0% exposure</span>
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">No Shared Tenant Data</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'blogs' && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
              id="landing-blogs-tab"
            >
              <div className="border-b border-white/10 pb-5">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-blue-400" />
                  Canadian Sole Proprietor Tax Blogs & Guides
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Expert tax tips, GST/HST filing timelines, and Employment Insurance instructions curated for self-employed professionals in Canada.
                </p>
              </div>

              {selectedBlogId ? (
                // Single Blog Reader
                (() => {
                  const blog = blogs.find(b => b.id === selectedBlogId);
                  if (!blog) return null;
                  return (
                    <div className="space-y-6 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                      <button
                        onClick={() => setSelectedBlogId(null)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center mb-4"
                      >
                        ← Back to Blog list
                      </button>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span className="bg-blue-500/15 text-blue-400 px-2.5 py-0.5 rounded-full font-semibold">{blog.category}</span>
                        <span>•</span>
                        <span>{blog.date}</span>
                        <span>•</span>
                        <span>{blog.readTime}</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">{blog.title}</h1>
                      <div className="flex items-center space-x-2 border-b border-white/10 pb-4 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Written by:</span>
                        <span>{blog.author}</span>
                      </div>
                      
                      {/* Blog markdown body simulation with beautiful styling */}
                      <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans pt-2">
                        {blog.content.trim()}
                      </div>

                      <div className="border-t border-white/10 pt-6 mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-slate-400 text-xs">
                          Need an audit-proof ledger to implement these strategies?
                        </p>
                        <button
                          onClick={() => setActiveTab('login')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Launch GST/HST Tracker Free
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Blog Index Grid
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {blogs.map((blog) => (
                    <div 
                      key={blog.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">{blog.category}</span>
                          <span>{blog.readTime}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedBlogId(blog.id)}>
                          {blog.title}
                        </h3>
                        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                          {blog.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
                        <span>By {blog.author}</span>
                        <button
                          onClick={() => setSelectedBlogId(blog.id)}
                          className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center"
                        >
                          Read Guide
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
              id="landing-terms-tab"
            >
              <div className="border-b border-white/10 pb-4 text-center">
                <Scale className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h2 className="text-xl font-black text-white tracking-tight">Terms and Conditions of Use</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">LAST UPDATED: JULY 1, 2026</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[450px] overflow-y-auto pr-2">
                <h4 className="font-bold text-white">1. Acceptance of Terms</h4>
                <p>
                  By accessing or logging into the Canada GST/HST & EI Monitor ("the Service"), you agree to be bound by these Terms and Conditions and all applicable laws and regulations in accordance with Canadian tax and corporate compliance structures. If you do not agree to these terms, you are prohibited from using this workspace.
                </p>

                <h4 className="font-bold text-white">2. Description of Service</h4>
                <p>
                  The Service provides self-employed Canadian sole proprietors, contractors, and corporate managers with tools to catalog business incomes, estimate GST/HST collection amounts based on provincial Place of Supply guidelines, itemize business expenses and Input Tax Credits (ITCs), monitor Service Canada EI hours milestones, and generate custom PDF invoices.
                </p>

                <h4 className="font-bold text-white">3. Not Legal or Tax Advice</h4>
                <p>
                  All calculations, ledger formats, and reports generated by the Service are provided as automated estimates for bookkeeping convenience. They do NOT constitute professional accounting, CPA, legal, or tax advice. You are solely responsible for ensuring the accuracy of all tax submissions to the Canada Revenue Agency (CRA) or Service Canada. We recommend consulting a licensed accountant before filing returns.
                </p>

                <h4 className="font-bold text-white">4. User Accounts and Secure Tenant Spaces</h4>
                <p>
                  Users may choose to operate in "Local Sandbox" mode (relying on browser-managed localStorage) or authenticated cloud mode (using secure Firebase credentials). You are fully responsible for maintaining the confidentiality of your login credentials and are liable for all actions, uploads, and purges executed under your tenant workspace.
                </p>

                <h4 className="font-bold text-white">5. Distructive Operations</h4>
                <p>
                  Super Admin operators maintain security controls to audit tenant metadata. Under administrative directives, options are provided to instantly "Truncate" (permanently wipe) ledger sub-collections. Wiping operations bypass confirmation gates and are strictly irreversible. The Service is not liable for data loss due to user-initiated truncation actions.
                </p>

                <h4 className="font-bold text-white">6. Limitation of Liability</h4>
                <p>
                  Under no circumstances shall the Service, its creators, or administrators be liable for any direct, indirect, incidental, or consequential damages (including, without limitation, CRA late penalties, tax assessment adjustments, auditing fees, or lost profits) arising out of the use or inability to use the bookkeeping features provided.
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 text-center">
                <p className="text-[10px] text-slate-400">
                  By logging in and registering a business profile, you explicitly confirm acceptance of these terms.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8"
              id="landing-privacy-tab"
            >
              <div className="border-b border-white/10 pb-4 text-center">
                <Lock className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h2 className="text-xl font-black text-white tracking-tight">Privacy and Data Isolation Policy</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">PIPEDA COMPLIANT STORAGE</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[450px] overflow-y-auto pr-2">
                <h4 className="font-bold text-white">1. Commitment to Financial Privacy</h4>
                <p>
                  We understand that financial ledgers, tax collected, and business expenses represent highly sensitive business information. In accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) in Canada, we implement stringent physical, logical, and database-level security policies to keep your data protected.
                </p>

                <h4 className="font-bold text-white">2. Dual-Tier Storage Architecture</h4>
                <p>
                  We offer two isolated storage mechanisms to put you in complete control of your privacy footprints:
                  <br />
                  * **Standard Sandbox Storage**: Operates entirely in your local browser cache (localStorage). No financial transactions are ever transmitted to external web servers in sandbox mode.
                  * **Authenticated Cloud Space**: Data is securely synchronized to Canadian Firestore database instances. Sub-collection documents are strictly guarded by security rules, restricting query capabilities to your individual validated Firebase User ID.
                </p>

                <h4 className="font-bold text-white">3. Information Collected</h4>
                <p>
                  To manage your business profiles, we process:
                  <br />
                  * Business metadata (Registered Business Name, Province, phone number, and 9-digit Business Number BN).
                  * Income transactions (date, client name, description, taxable subtotal, GST/HST collected).
                  * Business expense logs (supplier name, subtotal, GST/HST paid, category).
                  * Weekly working hour counts (for EI benefit estimation).
                </p>

                <h4 className="font-bold text-white">4. Absolute Non-Disclosure</h4>
                <p>
                  Your financial records are never sold, rented, shared, or distributed to any third parties, advertising networks, or government entities (including Service Canada and the CRA). Data is compiled and exported strictly on-demand when you trigger the "Print Report" or "Generate PDF" options locally in your browser.
                </p>

                <h4 className="font-bold text-white">5. Security Rules & Data Deletion</h4>
                <p>
                  All database structures utilize deep validation rules. If you request account closure or initiate a "Truncate" operation, documents are instantly expunged, leaving no residual traces.
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 text-center">
                <p className="text-[10px] text-slate-400 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" /> Secure SSL Encryption & isolated database tenants
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl mx-auto"
              id="landing-login-tab"
            >
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-t-3xl"></div>
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-xl font-extrabold text-white">Canada GST/HST Secure Portal</h2>
                  <p className="text-xs text-slate-400">
                    Sign in to sync your sole-proprietorship workspace or run a local sandbox session instantly.
                  </p>
                </div>

                {/* Mount the core Login component here */}
                <Login onLoginSuccess={onLoginSuccess} />

                {/* Cancel/Back button */}
                <button
                  onClick={() => setActiveTab('tour')}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
                >
                  ← Back to Product Information
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-10 no-print" id="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <Landmark className="h-4.5 w-4.5 text-blue-500" />
            <span className="text-xs font-extrabold text-white">Canada GST/HST & EI Tracker</span>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">v1.4</span>
          </div>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            Secure bookkeeping system aligning with CRA Income Tax guidelines and Service Canada Self-Employment Assistance frameworks.
          </p>
          <div className="flex justify-center space-x-6 text-xs font-semibold text-slate-400 pt-2">
            <button onClick={() => { setActiveTab('tour'); setSelectedBlogId(null); }} className="hover:text-white transition-colors">Tour</button>
            <button onClick={() => { setActiveTab('blogs'); setSelectedBlogId(null); }} className="hover:text-white transition-colors">Tax Blogs</button>
            <button onClick={() => { setActiveTab('privacy'); setSelectedBlogId(null); }} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={() => { setActiveTab('terms'); setSelectedBlogId(null); }} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
          <p className="text-slate-600 text-[10px] pt-4 flex items-center justify-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for Canadian Self-Employed Businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}
