/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  businessName: string;
  gstNumber: string;
  province: string;
  address: string;
  email: string;
  phone: string;
  eiTargetHours: number;
  eiClaimStartDate: string;
}

export interface AuditLogEntry {
  action: 'Created' | 'Updated' | 'Printed';
  timestamp: string;
  userEmail: string;
}

export interface IncomeEntry {
  id?: string;
  date: string;
  clientName: string;
  description: string;
  subtotal: number;
  gstHstCollected: number;
  total: number;
  category: string;
  invoiceId?: string;
  createdAt?: string;
  auditLogs?: AuditLogEntry[];
}

export interface ExpenseEntry {
  id?: string;
  date: string;
  supplierName: string;
  description: string;
  category: string;
  subtotal: number;
  gstHstPaid: number;
  total: number;
  createdAt?: string;
  paymentMethod?: 'Debit' | 'Credit' | 'Cash';
  auditLogs?: AuditLogEntry[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceEntry {
  id?: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  dateIssued: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  gstHstRate: number; // e.g. 13 for 13% ON
  gstHstAmount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  businessName: string;
  gstNumber: string;
  createdAt?: string;
  auditLogs?: AuditLogEntry[];
}

export interface GSTHSTRateInfo {
  province: string;
  code: string;
  type: 'GST' | 'HST' | 'GST+PST' | 'GST+QST';
  rate: number; // total tax rate as percentage, e.g. 13
  gstRate: number; // federal part, usually 5%
  provincialRate: number; // provincial part, e.g. 8% for ON HST
}

export const CANADIAN_PROVINCES: GSTHSTRateInfo[] = [
  { province: 'Ontario', code: 'ON', type: 'HST', rate: 13, gstRate: 5, provincialRate: 8 },
  { province: 'Quebec', code: 'QC', type: 'GST+QST', rate: 14.975, gstRate: 5, provincialRate: 9.975 },
  { province: 'British Columbia', code: 'BC', type: 'GST+PST', rate: 12, gstRate: 5, provincialRate: 7 },
  { province: 'Alberta', code: 'AB', type: 'GST', rate: 5, gstRate: 5, provincialRate: 0 },
  { province: 'Manitoba', code: 'MB', type: 'GST+PST', rate: 12, gstRate: 5, provincialRate: 7 },
  { province: 'Saskatchewan', code: 'SK', type: 'GST+PST', rate: 11, gstRate: 5, provincialRate: 6 },
  { province: 'Nova Scotia', code: 'NS', type: 'HST', rate: 15, gstRate: 5, provincialRate: 10 },
  { province: 'New Brunswick', code: 'NB', type: 'HST', rate: 15, gstRate: 5, provincialRate: 10 },
  { province: 'Newfoundland and Labrador', code: 'NL', type: 'HST', rate: 15, gstRate: 5, provincialRate: 10 },
  { province: 'Prince Edward Island', code: 'PE', type: 'HST', rate: 15, gstRate: 5, provincialRate: 10 },
  { province: 'Northwest Territories', code: 'NT', type: 'GST', rate: 5, gstRate: 5, provincialRate: 0 },
  { province: 'Yukon', code: 'YT', type: 'GST', rate: 5, gstRate: 5, provincialRate: 0 },
  { province: 'Nunavut', code: 'NU', type: 'GST', rate: 5, gstRate: 5, provincialRate: 0 }
];
