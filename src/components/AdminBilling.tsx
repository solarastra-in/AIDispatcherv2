import React, { useState, useEffect } from 'react';
import { PaymentInvoice, UserPersona } from '../types';
import { INITIAL_PAYMENTS } from '../data/mockData';
import { 
  savePaymentInvoiceToFirestore, 
  loadPaymentInvoicesFromFirestore, 
  recordAuditLogToFirestore 
} from '../lib/firebase';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Download, 
  ShieldCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  PieChart, 
  Users, 
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Check,
  FileSpreadsheet,
  Settings2,
  FileText,
  Bell,
  BellRing,
  Mail,
  ShieldAlert,
  ChevronRight,
  Sliders,
  Flame,
  Activity,
  ArrowRight,
  RefreshCw,
  XCircle,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminBillingProps {
  invoices?: PaymentInvoice[];
  onAddPayment?: (invoice: PaymentInvoice) => void;
  activePersona: UserPersona;
  onNavigateTab?: (tab: string) => void;
}

interface ThresholdAlertEvent {
  id: string;
  timestamp: string;
  thresholdPercent: number;
  tokensConsumed: number;
  budgetTotal: number;
  recipientEmail: string;
  channel: string;
  status: 'delivered' | 'acknowledged' | 'pending';
}

export const AdminBilling: React.FC<AdminBillingProps> = ({
  invoices: initialInvoices = INITIAL_PAYMENTS,
  onAddPayment,
  activePersona,
  onNavigateTab,
}) => {
  const [invoices, setInvoices] = useState<PaymentInvoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showBudgetAlertModal, setShowBudgetAlertModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [topUpTokens, setTopUpTokens] = useState<number>(50_000_000);
  const [accountName, setAccountName] = useState<string>('SolarAstra Enterprise');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [alertEmail, setAlertEmail] = useState<string>('solarastra.in@gmail.com');
  const [alertSavedSuccess, setAlertSavedSuccess] = useState<boolean>(false);

  // 80% Threshold Monitoring State for Organization Token Budget
  const [orgTokenBudget, setOrgTokenBudget] = useState<number>(100_000_000); // 100M Tokens Org Budget
  const [orgTokensUsed, setOrgTokensUsed] = useState<number>(84_250_000); // Default 84.25M tokens (84.25% - crosses 80% threshold)
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Alert trigger history log
  const [alertLogs, setAlertLogs] = useState<ThresholdAlertEvent[]>([
    {
      id: 'alert-log-1',
      timestamp: new Date(Date.now() - 3600000 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      thresholdPercent: 80,
      tokensConsumed: 80_120_000,
      budgetTotal: 100_000_000,
      recipientEmail: 'solarastra.in@gmail.com',
      channel: 'SMTP Auto-Dispatch & Webhook',
      status: 'delivered',
    },
    {
      id: 'alert-log-2',
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleDateString() + ' 09:15',
      thresholdPercent: 80,
      tokensConsumed: 82_400_000,
      budgetTotal: 100_000_000,
      recipientEmail: 'solarastra.in@gmail.com',
      channel: 'In-App UI Banner + Email',
      status: 'acknowledged',
    }
  ]);

  // Load invoices & alert config from Firestore on mount
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const loaded = await loadPaymentInvoicesFromFirestore();
        if (loaded && loaded.length > 0) {
          setInvoices(loaded);
        }
      } catch (err) {
        console.warn('Notice: Could not load billing invoices from Firestore:', err);
      }
    }
    fetchInvoices();
  }, []);

  // Calculate usage percentage
  const usagePercentage = Math.min(100, Math.max(0, (orgTokensUsed / orgTokenBudget) * 100));
  const isOverThreshold = usagePercentage >= alertThreshold;
  const isCorporateOrSuperAdmin = activePersona.role === 'corporate_admin' || activePersona.role === 'platform_admin';
  const remainingTokens = Math.max(0, orgTokenBudget - orgTokensUsed);
  const estDaysRemaining = ((remainingTokens / (orgTokenBudget / 30))).toFixed(1);

  // Trigger test alert notification
  const handleTriggerManualAlert = async () => {
    const newLog: ThresholdAlertEvent = {
      id: `alert-log-${Date.now()}`,
      timestamp: 'Just now (' + new Date().toLocaleTimeString() + ')',
      thresholdPercent: alertThreshold,
      tokensConsumed: orgTokensUsed,
      budgetTotal: orgTokenBudget,
      recipientEmail: alertEmail,
      channel: 'UI Alert Banner & SMTP Dispatch',
      status: 'delivered',
    };
    setAlertLogs([newLog, ...alertLogs]);
    setIsAlertDismissed(false);
    setIsAcknowledged(false);
    setToastMessage(`80% Threshold alert dispatched to Corporate Admin (${alertEmail})`);

    try {
      await recordAuditLogToFirestore(
        'ORGANIZATION_BUDGET_THRESHOLD_ALERT',
        'billing',
        activePersona.email,
        `Token usage reached ${usagePercentage.toFixed(1)}% of budget (${(orgTokensUsed / 1_000_000).toFixed(2)}M / ${(orgTokenBudget / 1_000_000).toFixed(0)}M tokens). Notification sent to ${alertEmail}.`
      );
    } catch (err) {
      console.warn('Failed to record alert in audit log:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAcknowledgeAlert = async () => {
    setIsAcknowledged(true);
    setToastMessage('Threshold alert acknowledged. Department leads notified to prioritize cache routing.');
    try {
      await recordAuditLogToFirestore(
        'BUDGET_THRESHOLD_ACKNOWLEDGED',
        'billing',
        activePersona.email,
        `Corporate Admin acknowledged 80% threshold alert for ${accountName}.`
      );
    } catch (err) {
      console.warn('Failed to record acknowledgment in audit log:', err);
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Financial aggregates
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.amountUsd, 0);
  const totalSavingsDelivered = invoices.reduce((acc, curr) => acc + curr.savingsGeneratedUsd, 0);
  const totalTokensBilled = invoices.reduce((acc, curr) => acc + curr.tokensCovered, 0);

  const handleSimulatePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice: PaymentInvoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      accountName: accountName,
      role: 'enterprise_seat',
      planName: 'Enterprise Scale Dynamic Token Pool',
      amountUsd: Number(topUpAmount),
      tokensCovered: Number(topUpTokens),
      savingsGeneratedUsd: Number(topUpAmount) * 3.8, // 3.8x baseline frontier savings multiplier
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'Corporate Visa ending in 4921',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    // Expand the org token budget after top-up
    setOrgTokenBudget((prev) => prev + Number(topUpTokens));
    if (onAddPayment) {
      onAddPayment(newInvoice);
    }

    try {
      await savePaymentInvoiceToFirestore({
        ...newInvoice,
        createdAt: new Date().toISOString(),
      });
      await recordAuditLogToFirestore(
        'BILLING_PAYMENT_PROCESSED',
        'billing',
        activePersona.email,
        `Processed payment of $${newInvoice.amountUsd} USD for invoice ${newInvoice.invoiceNumber}`
      );
    } catch (err) {
      console.warn('Failed to sync invoice to Firestore:', err);
    }

    setShowTopUpModal(false);
    setSelectedInvoice(newInvoice);
    setToastMessage(`+$${topUpAmount} USD Top-Up successfully processed! Allocated ${(topUpTokens / 1_000_000).toFixed(0)}M new tokens.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveBudgetAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSavedSuccess(true);
    setTimeout(() => {
      setAlertSavedSuccess(false);
      setShowBudgetAlertModal(false);
    }, 1200);
  };

  const handleExportCsv = () => {
    const headers = ['Invoice_Number', 'Account_Name', 'Role', 'Plan_Name', 'Date', 'Amount_USD', 'Tokens_Covered', 'Savings_Generated_USD', 'Status'];
    const rows = invoices.map(i => [
      `"${i.invoiceNumber}"`,
      `"${i.accountName}"`,
      `"${i.role}"`,
      `"${i.planName}"`,
      `"${i.date}"`,
      i.amountUsd,
      i.tokensCovered,
      i.savingsGeneratedUsd,
      `"${i.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-billing-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDownloadInvoiceReceipt = (inv: PaymentInvoice) => {
    const receiptText = `
============================================================
              WHYOR DISPATCH ENTERPRISE INVOICE
============================================================
Invoice Number: ${inv.invoiceNumber}
Invoice ID:     ${inv.id}
Date:           ${inv.date}
Account Name:   ${inv.accountName}
Account Role:   ${inv.role}
Plan:           ${inv.planName}
Status:         ${inv.status.toUpperCase()} (VERIFIED)

------------------------------------------------------------
TOKEN & COMPUTATIONAL CONSUMPTION BREAKDOWN:
------------------------------------------------------------
Allocated Token Pool:   ${inv.tokensCovered.toLocaleString()} tokens
Net Paid Amount:        $${inv.amountUsd.toFixed(2)} USD
WhyOr Dispatch Savings: +$${inv.savingsGeneratedUsd.toFixed(2)} USD (Delivered)
Cryptographic Hash:     ${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}
Payment Rail:           Automated Corporate Clearing / Stripe Connect

Thank you for choosing WhyOr Dispatch Intelligent AI Router.
============================================================
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${inv.invoiceNumber}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-slate-900/95 border border-amber-400/60 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-mono text-xs max-w-md ring-1 ring-amber-400/30"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CORPORATE ADMIN 80% THRESHOLD MONITORING UI ALERT BANNER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isOverThreshold && !isAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/60 bg-gradient-to-br from-amber-950/70 via-slate-900/90 to-orange-950/60 p-5 sm:p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-xl ring-1 ring-amber-400/40"
          >
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              {/* Alert Left Column: Icon & Headline */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500 text-slate-950 shadow-sm">
                      80% Threshold Exceeded
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-purple-300 bg-purple-500/20 border border-purple-400/30">
                      Corporate Admin Alert
                    </span>
                    {isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-display font-bold text-white mt-1.5 flex items-center gap-2">
                    Organization Token Usage Has Reached <span className="text-amber-400 font-mono underline decoration-amber-400/60">{usagePercentage.toFixed(1)}%</span> of Allocated Budget
                  </h2>

                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    Automated threshold policy triggered for <span className="text-white font-semibold">{accountName}</span>. Your organization has consumed <span className="font-mono font-bold text-amber-300">{(orgTokensUsed / 1_000_000).toFixed(2)}M tokens</span> of the <span className="font-mono text-white">{(orgTokenBudget / 1_000_000).toFixed(0)}M token</span> monthly pool. Estimated <span className="text-amber-300 font-semibold">{estDaysRemaining} days</span> of compute velocity remaining.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] font-mono text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Mail className="w-3.5 h-3.5" /> Notice Dispatched to: <span className="text-white font-bold">{alertEmail}</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Router Action: Smart Semantic Cache Active (saving ~38%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Alert Right Column: Action CTAs */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Top-Up Budget (+Tokens)</span>
                </button>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('teams')}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Adjust Pod Quotas</span>
                  </button>
                )}

                {!isAcknowledged && (
                  <button
                    onClick={handleAcknowledgeAlert}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 font-mono text-xs font-medium transition-colors cursor-pointer"
                    title="Acknowledge Alert"
                  >
                    Acknowledge
                  </button>
                )}

                <button
                  onClick={() => setIsAlertDismissed(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss alert banner for session"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Micro-Progress Bar inside Banner */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>Org Token Budget Velocity (80% Safe Cap)</span>
                <span className="font-bold text-amber-300">{usagePercentage.toFixed(1)}% Used</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercentage >= 95 
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                      : usagePercentage >= 80 
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <CreditCard className="w-3.5 h-3.5" /> Enterprise Billing & Financial Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              Token Budgets, Invoices & <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ROI Tracking</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Real-time audit trails of token consumption, threshold alert dispatching, payment settlements, and net savings delivered versus un-routed frontier model baselines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <button
              id="budget-alert-btn"
              onClick={() => setShowBudgetAlertModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Budget Alerts ({alertThreshold}%)</span>
            </button>

            <button
              id="export-invoices-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="topup-payment-btn"
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Simulate Top-Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 80% THRESHOLD MONITORING & VELOCITY DASHBOARD */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              usagePercentage >= 80 
                ? 'bg-amber-500/20 text-amber-400 border-amber-400/30' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span>Organizational Budget Threshold Telemetry</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">80% ALERT POLICY</span>
              </div>
              <h3 className="text-lg font-display font-bold text-white mt-0.5">
                Token Pool Gauge & Velocity Monitor
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerManualAlert}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" /> Test 80% Alert Dispatch
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar & Gauge */}
        <div className="space-y-3 font-mono">
          <div className="flex flex-wrap items-end justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400">Current Consumption: </span>
              <span className="text-xl font-bold text-white">{(orgTokensUsed / 1_000_000).toFixed(2)}M</span>
              <span className="text-slate-400"> / {(orgTokenBudget / 1_000_000).toFixed(0)}M tokens</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                usagePercentage >= 80
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {usagePercentage.toFixed(1)}% Used
              </span>
              <span className="text-slate-400 text-[11px]">
                Safe Cap: <span className="text-amber-400 font-bold">{alertThreshold}%</span>
              </span>
            </div>
          </div>

          {/* Interactive Multi-Zone Gauge */}
          <div className="relative w-full h-5 bg-slate-950 rounded-xl overflow-hidden border border-white/10 p-1">
            {/* 80% Threshold Marker Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              style={{ left: `${alertThreshold}%` }}
            />
            <div 
              className="absolute -top-1 font-mono text-[9px] font-bold text-amber-400 z-20"
              style={{ left: `calc(${alertThreshold}% - 14px)` }}
            >
              ▲
            </div>

            {/* Filled Progress Bar */}
            <motion.div 
              className={`h-full rounded-lg transition-all duration-300 ${
                usagePercentage >= 95 
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500' 
                  : usagePercentage >= 80 
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500' 
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          {/* Zone Labels */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span className="text-emerald-400">0% (Baseline)</span>
            <span className="text-emerald-400/70">Normal Operating Range (&lt;80%)</span>
            <span className="text-amber-400 font-bold">80% Alert Trigger Line</span>
            <span className="text-rose-400">100% (Exhausted)</span>
          </div>

          {/* Threshold Simulation Controls */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Interactive Usage Simulator:</span>
                <span className="text-[11px] text-slate-400">Drag to test 80% Corporate Admin alert behavior</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrgTokensUsed(orgTokenBudget * 0.72)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 cursor-pointer"
                >
                  Set 72% (Normal)
                </button>
                <button
                  onClick={() => {
                    setOrgTokensUsed(orgTokenBudget * 0.84);
                    setIsAlertDismissed(false);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-300 font-bold border border-amber-400/30 cursor-pointer"
                >
                  Set 84% (Threshold Trigger)
                </button>
                <button
                  onClick={() => {
                    setOrgTokensUsed(orgTokenBudget * 0.96);
                    setIsAlertDismissed(false);
                  }}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-[10px] text-rose-300 font-bold border border-rose-400/30 cursor-pointer"
                >
                  Set 96% (Critical)
                </button>
              </div>
            </div>

            <input
              type="range"
              min={orgTokenBudget * 0.4}
              max={orgTokenBudget}
              step={1_000_000}
              value={orgTokensUsed}
              onChange={(e) => {
                setOrgTokensUsed(Number(e.target.value));
                if (Number(e.target.value) >= orgTokenBudget * (alertThreshold / 100)) {
                  setIsAlertDismissed(false);
                }
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Threshold Event History */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
            <span>Recent Automated Alert Dispatches</span>
            <span className="text-[10px] text-slate-500">Corporate Admin Notification Registry</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {alertLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-white font-semibold">{log.thresholdPercent}% Usage Threshold Crossed</span>
                  <span className="text-slate-400 text-[11px]">({(log.tokensConsumed / 1_000_000).toFixed(1)}M / {(log.budgetTotal / 1_000_000).toFixed(0)}M tokens)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{log.channel}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{log.recipientEmail}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">TOTAL TOKEN POOL BILLED</div>
          <div className="text-2xl font-bold text-white mt-1">
            {(totalTokensBilled / 1_000_000).toFixed(0)}M
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Across {invoices.length} active invoices</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">NET BILLING SETTLED</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">100% On-time automated clearing</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-emerald-400/30 rounded-2xl p-5 shadow-xl shadow-emerald-500/5">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">CUMULATIVE SAVINGS DELIVERED</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            +${totalSavingsDelivered.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">380% ROI vs Frontier Only</div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">THRESHOLD GUARD STATUS</div>
          <div className={`text-2xl font-bold mt-1 ${usagePercentage >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {usagePercentage >= 80 ? '⚠️ Active Alert' : '✓ Normal (<80%)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{alertThreshold}% auto-notify webhook configured</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Payment & Settlement Ledger
            </div>
            <h3 className="text-lg font-display font-bold text-white mt-0.5">
              Itemized Invoice History
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any row to inspect itemized token telemetry and download receipt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                <th className="py-3 pr-4">Invoice #</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Plan Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Savings Delivered</th>
                <th className="py-3 pl-4 text-right">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3 font-mono">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mx-auto">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <h4 className="text-white text-sm font-semibold">No Invoices or Payment Records Yet</h4>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Enterprise billing tracks token pool allocations, automated invoice generation, and cost avoidance reporting across all team members and departments.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setShowTopUpModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          + Top-Up Token Allocation
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 pr-4 font-bold text-white flex items-center gap-1.5 group-hover:text-cyan-300">
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-white">
                    {inv.accountName}
                    <div className="text-[10px] text-slate-400">{inv.role}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {inv.planName}
                    <div className="text-[10px] text-cyan-400 font-semibold">{(inv.tokensCovered / 1_000_000).toFixed(0)}M Token Allocation</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4 text-white font-bold">
                    ${inv.amountUsd.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                    +${inv.savingsGeneratedUsd.toFixed(2)}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold backdrop-blur-md ${
                        inv.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                      }`}>
                        {inv.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadInvoiceReceipt(inv);
                        }}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Download Receipt Text"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Invoice Breakdown: {selectedInvoice.invoiceNumber}
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
                <div>
                  <div className="text-[10px] text-slate-400">BILLED ACCOUNT</div>
                  <div className="text-white font-bold mt-0.5">{selectedInvoice.accountName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SETTLEMENT DATE</div>
                  <div className="text-white font-bold mt-0.5">{selectedInvoice.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">TOTAL AMOUNT</div>
                  <div className="text-cyan-400 font-bold mt-0.5 text-sm">${selectedInvoice.amountUsd.toFixed(2)} USD</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SAVINGS DELIVERED</div>
                  <div className="text-emerald-400 font-bold mt-0.5 text-sm">+${selectedInvoice.savingsGeneratedUsd.toFixed(2)} USD</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-slate-300 font-bold uppercase">Token Pool Allocation:</div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Tokens Included:</span>
                    <span className="text-white font-bold">{selectedInvoice.tokensCovered.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Low Tier (Flash/Haiku):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.7).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mid/High Tier (Sonnet/GPT-4o):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.25).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frontier/Reasoning (Pro/R1):</span>
                    <span className="text-slate-300">{(selectedInvoice.tokensCovered * 0.05).toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoiceReceipt(selectedInvoice)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Simulate Dynamic Token Top-Up
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePaymentSubmit} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">ACCOUNT / DEPARTMENT</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">TOP-UP AMOUNT ($ USD)</label>
                  <input
                    type="number"
                    step="50"
                    min="50"
                    value={topUpAmount}
                    onChange={(e) => {
                      const amt = Number(e.target.value);
                      setTopUpAmount(amt);
                      setTopUpTokens(amt * 100_000);
                    }}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ALLOCATED TOKENS</label>
                  <input
                    type="number"
                    step="1000000"
                    value={topUpTokens}
                    onChange={(e) => setTopUpTokens(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400 backdrop-blur-md"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-200">
                ⚡ Simulated Instant Settlement via WhyOr Stripe Connect. Adds {(topUpTokens / 1_000_000).toFixed(0)}M tokens immediately to active workspace pool.
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/30 backdrop-blur-md cursor-pointer"
                >
                  Confirm & Charge Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Alerts Modal */}
      {showBudgetAlertModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                Configure Automated Budget Alerts
              </div>
              <button
                onClick={() => setShowBudgetAlertModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudgetAlerts} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">ALERT NOTIFICATION EMAIL</label>
                <input
                  type="email"
                  required
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">THRESHOLD TRIGGER PERCENTAGE</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-white font-bold w-12 text-right">{alertThreshold}%</span>
                </div>
              </div>

              {alertSavedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Budget alert webhooks saved successfully!</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBudgetAlertModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
                >
                  Save Alert Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
