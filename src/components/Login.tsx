/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldCheck, FileText, Landmark, User, Mail, Lock, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [province, setProvince] = useState('ON');
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create default profile in firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          businessName: businessName || 'My Self-Employed Business',
          province: province,
          gstNumber: gstNumber || '',
          address: '',
          phone: '',
          eiTargetHours: 15,
          eiClaimStartDate: new Date().toISOString().split('T')[0]
        });
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is disabled in your Firebase project. To enable it: Go to Firebase Console > Authentication > Sign-in method, add the "Email/Password" provider and save. Alternatively, sign in using Google below.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled on your Firebase project. Please enable it in your Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Login popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'An error occurred during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Sign in anonymously for demo
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      // Seed default demo user profile
      await setDoc(doc(db, 'users', user.uid), {
        email: 'demo@canadatgstracker.local',
        businessName: 'Wael Consulting Services',
        province: 'ON',
        gstNumber: '823456789 RT 0001',
        address: '123 Bay St, Toronto, ON, M5H 2Y2',
        phone: '416-555-0192',
        eiTargetHours: 15,
        eiClaimStartDate: new Date().toISOString().split('T')[0]
      });

      // Seed some dummy items to make the demo immediately engaging
      const seedDemoData = async () => {
        const batch = [
          {
            coll: 'incomes',
            id: 'demo_inc_1',
            data: {
              date: '2026-06-15',
              clientName: 'Acme Corp Canada',
              description: 'Software development and technical consulting services',
              subtotal: 5000,
              gstHstCollected: 650, // 13% of 5000
              total: 5650,
              category: 'Consulting',
              createdAt: new Date().toISOString()
            }
          },
          {
            coll: 'incomes',
            id: 'demo_inc_2',
            data: {
              date: '2026-06-28',
              clientName: 'Nova Retail Inc',
              description: 'Website maintenance and SEO optimization',
              subtotal: 1200,
              gstHstCollected: 156, // 13% of 1200
              total: 1356,
              category: 'Sales & Support',
              createdAt: new Date().toISOString()
            }
          },
          {
            coll: 'expenses',
            id: 'demo_exp_1',
            data: {
              date: '2026-06-02',
              supplierName: 'AWS Cloud Services',
              description: 'Hosting and cloud compute servers',
              category: 'Software & Internet',
              subtotal: 300,
              gstHstPaid: 39, // 13% ON
              total: 339,
              createdAt: new Date().toISOString()
            }
          },
          {
            coll: 'expenses',
            id: 'demo_exp_2',
            data: {
              date: '2026-06-10',
              supplierName: 'Staples',
              description: 'Office chair and ergonomic desk accessories',
              category: 'Office Expenses',
              subtotal: 450,
              gstHstPaid: 58.5, // 13%
              total: 508.5,
              createdAt: new Date().toISOString()
            }
          },
          {
            coll: 'expenses',
            id: 'demo_exp_3',
            data: {
              date: '2026-06-25',
              supplierName: 'Bell Canada',
              description: 'Business high-speed internet and phone line',
              category: 'Telephone & Utilities',
              subtotal: 120,
              gstHstPaid: 15.6, // 13%
              total: 135.6,
              createdAt: new Date().toISOString()
            }
          }
        ];

        for (const item of batch) {
          await setDoc(doc(db, 'users', user.uid, item.coll, item.id), item.data);
        }
      };
      
      await seedDemoData();
      onLoginSuccess();
    } catch (err: any) {
      console.error('Anonymous sign-in error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation' || err.message?.includes('operation-not-allowed')) {
        // Fall back to local sandbox storage immediately!
        console.log("Firebase Anonymous auth is disabled in project, starting offline sandbox mode...");
        
        const sandboxProfile = {
          email: 'sandbox@canadatgstracker.local',
          businessName: 'Wael Consulting Services (Sandbox)',
          province: 'ON',
          gstNumber: '823456789 RT 0001',
          address: '123 Bay St, Toronto, ON, M5H 2Y2',
          phone: '416-555-0192',
          eiTargetHours: 15,
          eiClaimStartDate: new Date().toISOString().split('T')[0]
        };
        
        const sandboxIncomes = [
          {
            id: 'demo_inc_1',
            date: '2026-06-15',
            clientName: 'Acme Corp Canada',
            description: 'Software development and technical consulting services',
            subtotal: 5000,
            gstHstCollected: 650,
            total: 5650,
            category: 'Consulting',
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo_inc_2',
            date: '2026-06-28',
            clientName: 'Nova Retail Inc',
            description: 'Website maintenance and SEO optimization',
            subtotal: 1200,
            gstHstCollected: 156,
            total: 1356,
            category: 'Sales & Support',
            createdAt: new Date().toISOString()
          }
        ];
        
        const sandboxExpenses = [
          {
            id: 'demo_exp_1',
            date: '2026-06-02',
            supplierName: 'AWS Cloud Services',
            description: 'Hosting and cloud compute servers',
            category: 'Software & Internet',
            subtotal: 300,
            gstHstPaid: 39,
            total: 339,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo_exp_2',
            date: '2026-06-10',
            supplierName: 'Staples',
            description: 'Office chair and ergonomic desk accessories',
            category: 'Office Expenses',
            subtotal: 450,
            gstHstPaid: 58.5,
            total: 508.5,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo_exp_3',
            date: '2026-06-25',
            supplierName: 'Bell Canada',
            description: 'Business high-speed internet and phone line',
            category: 'Telephone & Utilities',
            subtotal: 120,
            gstHstPaid: 15.6,
            total: 135.6,
            createdAt: new Date().toISOString()
          }
        ];
        
        localStorage.setItem('gsthst_sandbox_profile', JSON.stringify(sandboxProfile));
        localStorage.setItem('gsthst_sandbox_incomes', JSON.stringify(sandboxIncomes));
        localStorage.setItem('gsthst_sandbox_expenses', JSON.stringify(sandboxExpenses));
        localStorage.setItem('gsthst_sandbox_invoices', JSON.stringify([]));
        localStorage.setItem('gsthst_use_local_sandbox', 'true');
        
        onLoginSuccess();
      } else {
        setError('Could not start demo: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden" id="login-container">
      {/* Background Mesh Gradients */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full"></div>

      {/* Upper Brand / Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600/80 backdrop-blur-md rounded-2xl shadow-lg shadow-blue-500/20 text-white mb-4 border border-blue-500/30">
          <Landmark className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Canada GST/HST Tracker
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Self-employed income, expenses, and benefits monitoring platform
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/5 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/10 sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm font-medium">
                {error}
              </div>
            )}

            {isSignUp && (
              <>
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-slate-300">
                    Business / Trade Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Wael Consulting"
                      className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-slate-300">
                      Operating Province
                    </label>
                    <select
                      id="province"
                      name="province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 bg-slate-900 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white"
                    >
                      <option value="ON" className="bg-slate-950 text-white">Ontario (13% HST)</option>
                      <option value="QC" className="bg-slate-950 text-white">Quebec (14.975% GST/QST)</option>
                      <option value="BC" className="bg-slate-950 text-white">British Columbia (12% GST/PST)</option>
                      <option value="AB" className="bg-slate-950 text-white">Alberta (5% GST)</option>
                      <option value="MB" className="bg-slate-950 text-white">Manitoba (12% GST/PST)</option>
                      <option value="SK" className="bg-slate-950 text-white">Saskatchewan (11% GST/PST)</option>
                      <option value="NS" className="bg-slate-950 text-white">Nova Scotia (15% HST)</option>
                      <option value="NB" className="bg-slate-950 text-white">New Brunswick (15% HST)</option>
                      <option value="NL" className="bg-slate-950 text-white">Newfoundland (15% HST)</option>
                      <option value="PE" className="bg-slate-950 text-white">Prince Edward Isl. (15% HST)</option>
                      <option value="YT" className="bg-slate-950 text-white">Yukon (5% GST)</option>
                      <option value="NT" className="bg-slate-950 text-white">Northwest Terr. (5% GST)</option>
                      <option value="NU" className="bg-slate-950 text-white">Nunavut (5% GST)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-slate-300">
                      GST/HST Number
                    </label>
                    <input
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="e.g. 123456789 RT 0001"
                      className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Professional Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#171e30] text-slate-400">Or get started instantly</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm text-sm font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                <Sparkles className="mr-2 h-5 w-5 text-amber-400 fill-amber-400/20" />
                Explore Demo Workspace
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/10 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                <svg className="mr-2 h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.317 2.016 15.548 1 12.24 1c-6.07 0-11 4.93-11 11s4.93 11 11 11c6.336 0 10.56-4.453 10.56-10.75 0-.724-.077-1.275-.172-1.63H12.24z"/>
                </svg>
                Sign In with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-2">
          <span className="flex items-center"><ShieldCheck className="h-4 w-4 mr-1 text-emerald-400" /> CRA Tax Compliant</span>
          <span className="flex items-center"><FileText className="h-4 w-4 mr-1 text-blue-400" /> Professional Invoicing</span>
          <span className="flex items-center"><Sparkles className="h-4 w-4 mr-1 text-amber-400" /> EI Benefits Estimator</span>
        </div>
        <p>© 2026 Canada GST/HST & EI Tracker. Secure and isolated tenant workspace.</p>
      </div>
    </div>
  );
}
