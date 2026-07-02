/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, CANADIAN_PROVINCES } from '../types';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Percent, 
  Hourglass, 
  Calendar, 
  Save, 
  Sparkles,
  ShieldCheck,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { auth } from '../firebase';

interface ProfileProps {
  profile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

export default function Profile({ profile, onUpdateProfile }: ProfileProps) {
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [gstNumber, setGstNumber] = useState(profile?.gstNumber || '');
  const [province, setProvince] = useState(profile?.province || 'ON');
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [eiTargetHours, setEiTargetHours] = useState<number>(profile?.eiTargetHours || 15);
  const [eiClaimStartDate, setEiClaimStartDate] = useState(profile?.eiClaimStartDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');

    const updatedProfile: UserProfile = {
      businessName,
      gstNumber,
      province,
      address,
      phone,
      email,
      eiTargetHours: Number(eiTargetHours) || 15,
      eiClaimStartDate
    };

    try {
      await onUpdateProfile(updatedProfile);
      setSavedMessage('Business Profile successfully updated!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error updating business profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (confirm('Sign out from your professional secure environment?')) {
      auth.signOut();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans animate-fade-in text-slate-100" id="profile-view">
      {/* Page Title */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Profile & Settings</h1>
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-semibold select-none animate-pulse">
            <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
            <span>CRA Audit Mentor Active</span>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Set up business registration identifiers, regional CRA tax rates, and Service Canada benefit parameters
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm font-semibold flex items-center">
          <ShieldCheck className="h-4.5 w-4.5 mr-2 text-emerald-400" />
          {savedMessage}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Corporate Identifiers Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg space-y-4">
          <h3 className="font-bold text-white text-base flex items-center border-b border-white/10 pb-3">
            <Building className="h-5 w-5 mr-2 text-blue-400" />
            CRA Corporate Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Business / Trade Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Wael Consulting"
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">GST/HST Registration Number</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 123456789 RT 0001"
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">9-digit Business Number + RT + 4-digit reference</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Filing Province / Region</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="mt-1 block w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CANADIAN_PROVINCES.map(p => (
                  <option key={p.code} value={p.code} className="bg-slate-950 text-white">{p.province} ({p.code} - {p.rate}%)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Business Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 416-555-0199"
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Billing / Administrative Email</label>
              <input
                type="email"
                required
                disabled
                value={email}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-slate-400 text-sm cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Email is locked to active security tenant account</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Operating Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 100 Bay St, Toronto, ON, M5H 2Y2"
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* EI Special Benefits Setup Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg space-y-4">
          <h3 className="font-bold text-white text-base flex items-center border-b border-white/10 pb-3">
            <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
            Service Canada EI Special Benefits Setup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Target Claim Weekly Hours</label>
              <input
                type="number"
                value={eiTargetHours}
                onChange={(e) => setEiTargetHours(Number(e.target.value))}
                placeholder="e.g. 15"
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Helpful for tracking work time limit compliance</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">EI Claim Active Start Date</label>
              <input
                type="date"
                value={eiClaimStartDate}
                onChange={(e) => setEiClaimStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 border border-blue-500/30 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving Profile...' : 'Save Settings'}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg font-semibold text-sm transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out of Tenant Workspace
          </button>
        </div>
      </form>
    </div>
  );
}
