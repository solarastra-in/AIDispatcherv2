import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveDispatchBoard } from './components/LiveDispatchBoard';
import { DispatchConsole } from './components/DispatchConsole';
import { ContextLedgerView } from './components/ContextLedgerView';
import { ModelCatalog } from './components/ModelCatalog';
import { TeamGovernance } from './components/TeamGovernance';
import { AdminBilling } from './components/AdminBilling';
import { AdminConsole } from './components/AdminConsole';
import { MarketResearchView } from './components/MarketResearchView';
import { SavingsAnalyticsDashboard } from './components/SavingsAnalyticsDashboard';
import { CompanyCredentialsPage } from './components/CompanyCredentialsPage';
import { ApiExplorerModal } from './components/ApiExplorerModal';
import { QualityModelInspector } from './components/QualityModelInspector';
import { QualityInspectorPage } from './pages/QualityInspectorPage';
import { TrialProgressBarHeader } from './components/TrialProgressBarHeader';
import { AuthGateModal } from './components/AuthGateModal';
import Workspace from './pages/Workspace';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Capabilities from './pages/Capabilities';
import Examples from './pages/Examples';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import DocumentationPage from './pages/DocumentationPage';
import BenchmarksPage from './pages/BenchmarksPage';
import FaqPage from './pages/FaqPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { PageAccessGuard } from './components/PageAccessGuard';
import { RoleMatrixModal } from './components/RoleMatrixModal';
import { CompanyAdminOnboardingWizard } from './components/CompanyAdminOnboardingWizard';
import { canUserViewPage } from './utils/permissions';
import { AIModel, UserPersona, ContextLedgerEntry } from './types';
import { INITIAL_AI_MODELS, PERSONA_PROFILES } from './data/mockData';
import { apiService } from './core/apiSurface';
import { 
  saveLedgerEntryToFirestore, 
  loadLedgerFromFirestore, 
  saveContextSessionToFirestore,
  recordAuditLogToFirestore,
  onAuthChanged
} from './lib/firebase';
import { Globe, ArrowRight, ShieldCheck, Sparkles, Zap, Layers, Code2, Activity, Mail, UserCheck } from 'lucide-react';

export default function App() {
  const getTabFromPath = () => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/capabilities') return 'capabilities';
    if (path === '/examples') return 'examples';
    if (path === '/pricing' || path === '/trial') return 'pricing';
    if (path === '/benchmarks' || path === '/routing-benchmarks') return 'benchmarks';
    if (path === '/docs' || path === '/documentation' || path === '/api-docs') return 'docs';
    if (path === '/faq') return 'faq';
    if (path === '/contact') return 'contact';
    if (path === '/privacy' || path === '/privacy-policy') return 'privacy';
    if (path === '/terms' || path === '/terms-of-service') return 'terms';
    if (path === '/workspace') return 'workspace';
    if (path === '/company/team' || path === '/company/governance' || path === '/teams') return 'teams';
    if (path === '/admin') return 'admin';
    if (path === '/dispatch') return 'dispatch';
    if (path === '/quality' || path === '/bayesian-quality') return 'quality';
    if (path === '/catalog') return 'catalog';
    if (path === '/ledger') return 'ledger';
    if (path === '/analytics') return 'analytics';
    if (path === '/credentials') return 'credentials';
    if (path === '/research') return 'research';
    return 'home';
  };

  const tabToPath = (tab: string): string => {
    switch (tab) {
      case 'home': return '/';
      case 'how-it-works': return '/how-it-works';
      case 'capabilities': return '/capabilities';
      case 'examples': return '/examples';
      case 'pricing': return '/pricing';
      case 'benchmarks': return '/benchmarks';
      case 'docs': return '/docs';
      case 'faq': return '/faq';
      case 'contact': return '/contact';
      case 'privacy': return '/privacy';
      case 'terms': return '/terms';
      case 'workspace': return '/workspace';
      case 'teams': return '/company/team';
      case 'admin': return '/admin';
      case 'dispatch': return '/dispatch';
      case 'quality': return '/quality';
      case 'catalog': return '/catalog';
      case 'ledger': return '/ledger';
      case 'analytics': return '/analytics';
      case 'credentials': return '/credentials';
      case 'research': return '/research';
      default: return '/';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(getTabFromPath);

  const handleNavigateTab = (tab: string, pushHistory = true) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tabToPath(tab);
      if (pushHistory && window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Default to Guest Visitor persona for unauthenticated visitors
  const [activePersona, setActivePersona] = useState<UserPersona>(
    PERSONA_PROFILES.find(p => p.role === 'guest') || PERSONA_PROFILES[0]
  );
  const [models, setModels] = useState<AIModel[]>(INITIAL_AI_MODELS);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | undefined>(undefined);
  const [prefilledModelId, setPrefilledModelId] = useState<string | undefined>(undefined);
  const [isApiExplorerOpen, setIsApiExplorerOpen] = useState<boolean>(false);
  const [isQualityInspectorOpen, setIsQualityInspectorOpen] = useState<boolean>(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState<boolean>(false);
  const [isRoleMatrixOpen, setIsRoleMatrixOpen] = useState<boolean>(false);
  const [isCompanyAdminWizardOpen, setIsCompanyAdminWizardOpen] = useState<boolean>(false);
  const [verificationBanner, setVerificationBanner] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Synchronize persona with Firebase Auth on login / logout
  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setFirebaseUser(u);
      if (u) {
        if (u.email === 'solarastra.in@gmail.com') {
          const superPersona = PERSONA_PROFILES.find(p => p.email === 'solarastra.in@gmail.com') || PERSONA_PROFILES[4];
          setActivePersona(superPersona);
        } else {
          const userPersona = PERSONA_PROFILES.find(p => p.role === 'user') || PERSONA_PROFILES[1];
          setActivePersona({
            ...userPersona,
            name: u.displayName || userPersona.name,
            email: u.email || userPersona.email,
            avatar: u.photoURL || userPersona.avatar,
          });
        }
      } else {
        const guestPersona = PERSONA_PROFILES.find(p => p.role === 'guest') || PERSONA_PROFILES[0];
        setActivePersona(guestPersona);
      }
    });
    return () => unsub();
  }, []);
  
  // Context Persistence Policy (Firestore Cloud by default vs Local Transient)
  const [persistenceMode, setPersistenceMode] = useState<'firestore_cloud' | 'local_transient'>('firestore_cloud');

  // Context Ledger state (persisted in Firestore & populated via live dispatches)
  const [ledger, setLedger] = useState<ContextLedgerEntry[]>([]);

  // Check URL query params for direct email verification link: ?verify_token=...&email=...
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyToken = urlParams.get('verify_token');
      const verifyEmail = urlParams.get('email');

      if (verifyToken && verifyEmail) {
        fetch('/api/auth/verify-email-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: verifyEmail,
            token: verifyToken,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
              localStorage.setItem('whyor_trial_user', JSON.stringify(data.user));
              setVerificationBanner(`🎉 Email verified successfully for ${verifyEmail}! Your 7-day free trial is now active.`);
              // Clean URL parameters without reload
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => setVerificationBanner(null), 8000);
            }
          })
          .catch((err) => console.warn('Direct link verification notice:', err));
      }
    } catch (e) {
      console.warn('URL parse notice:', e);
    }
  }, []);

  // Hydrate ledger from Firestore if available
  useEffect(() => {
    loadLedgerFromFirestore(30)
      .then((cloudEntries) => {
        if (cloudEntries && cloudEntries.length > 0) {
          setLedger(cloudEntries);
        }
      })
      .catch((err) => console.log('Loaded initial demo ledger state'));
  }, []);

  // Load models from server if available
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      })
      .catch((err) => console.log('Using initial model catalog state'));
  }, []);

  const handleNewLedgerEntry = (entry: ContextLedgerEntry) => {
    setLedger((prev) => [entry, ...prev]);

    // If Firestore Cloud persistence is active, persist directly to Firestore
    if (persistenceMode === 'firestore_cloud') {
      saveLedgerEntryToFirestore(entry).catch((err) =>
        console.warn('Firestore ledger save notice:', err.message)
      );

      saveContextSessionToFirestore(entry.sessionId, {
        sessionId: entry.sessionId,
        promptSnippet: entry.promptSnippet,
        routedModelId: entry.routedModelId,
        routedModelName: entry.routedModelName,
        entitiesExtracted: entry.entitiesExtracted,
        decisionsMade: entry.decisionsMade,
        tokensSaved: entry.tokensSaved,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.warn('Firestore context save notice:', err.message));
    }
  };

  const handleAddModel = (newModel: AIModel) => {
    setModels((prev) => [newModel, ...prev]);
    // Also notify server
    fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModel),
    }).catch((e) => console.warn('Saved model in client catalog'));
  };

  const handleUpdateModelStatus = (id: string, status: AIModel['status']) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    fetch(`/api/admin/models/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((e) => console.warn('Updated status in client catalog'));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Frosted Glass Background Ambient Luminous Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 -left-36 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 left-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[130px]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      {/* Top Navbar */}
      <div className="relative z-50">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          activePersona={activePersona}
          setActivePersona={setActivePersona}
          onOpenApiExplorer={() => setIsApiExplorerOpen(true)}
          onOpenQualityInspector={() => setIsQualityInspectorOpen(!isQualityInspectorOpen)}
          onOpenAuthGate={() => setIsAuthGateOpen(true)}
          onOpenRoleMatrix={() => setIsRoleMatrixOpen(true)}
          onOpenCompanyAdminWizard={() => setIsCompanyAdminWizardOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Verification Success Toast Banner */}
        {verificationBanner && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </span>
              <span className="text-sm font-semibold text-emerald-100">{verificationBanner}</span>
            </div>
            <button
              onClick={() => setVerificationBanner(null)}
              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/50 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* 7-Day Free Trial Visual Progress Bar & Pro Upgrade Bar */}
        <TrialProgressBarHeader 
          onNavigateTab={setCurrentTab}
          activePersonaEmail={activePersona.email}
        />

        {/* Collapsible Quality Model & Thompson Sampling Inspector */}
        {isQualityInspectorOpen && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Live Bayesian Quality Inspector Mode
              </span>
              <button
                onClick={() => setIsQualityInspectorOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                [Minimize Inspector]
              </button>
            </div>
            <QualityModelInspector
              qualityTracker={apiService.qualityTracker}
              feedbackEngine={apiService.feedbackEngine}
              models={models}
              onSelectModelForDispatch={(modelId) => {
                setPrefilledModelId(modelId);
                setCurrentTab('dispatch');
              }}
            />
          </div>
        )}

        {/* Live Dispatch Telemetry Ticker */}
        {(currentTab === 'dispatch' || currentTab === 'catalog') && (
          <LiveDispatchBoard 
            onSelectPrompt={(p) => {
              setPrefilledPrompt(p);
              setCurrentTab('dispatch');
            }}
          />
        )}

        {/* Access Guard for Restricted Tabs */}
        {!canUserViewPage(currentTab, activePersona, null) ? (
          <PageAccessGuard
            tabId={currentTab}
            activePersona={activePersona}
            onNavigateTab={setCurrentTab}
            onOpenAuthGate={() => setIsAuthGateOpen(true)}
            onOpenRoleMatrix={() => setIsRoleMatrixOpen(true)}
          />
        ) : (
          <>
            {/* Tab Views */}
            {currentTab === 'dispatch' && (
              <DispatchConsole
                models={models}
                activePersona={activePersona}
                firebaseUser={firebaseUser}
                onNewLedgerEntry={handleNewLedgerEntry}
                recentLedger={ledger}
                onNavigateTab={setCurrentTab}
                prefilledPrompt={prefilledPrompt}
                prefilledModelId={prefilledModelId}
                onClearPrefill={() => {
                  setPrefilledPrompt(undefined);
                  setPrefilledModelId(undefined);
                }}
              />
            )}

            {currentTab === 'quality' && (
              <QualityInspectorPage
                qualityTracker={apiService.qualityTracker}
                feedbackEngine={apiService.feedbackEngine}
                models={models}
                activePersona={activePersona}
                onNavigateTab={setCurrentTab}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
                onSelectModelForDispatch={(modelId, prompt) => {
                  if (prompt) setPrefilledPrompt(prompt);
                  if (modelId) setPrefilledModelId(modelId);
                  setCurrentTab('dispatch');
                }}
              />
            )}

            {currentTab === 'credentials' && (
              <CompanyCredentialsPage
                onNavigateToDispatch={(p, m) => {
                  if (p) setPrefilledPrompt(p);
                  if (m) setPrefilledModelId(m);
                  setCurrentTab('dispatch');
                }}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
                activePersona={activePersona}
                onOpenCompanyAdminWizard={() => setIsCompanyAdminWizardOpen(true)}
              />
            )}

            {currentTab === 'analytics' && (
              <SavingsAnalyticsDashboard
                activePersona={activePersona}
                ledger={ledger}
                models={models}
                onNavigateTab={setCurrentTab}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
                onPrefillPrompt={(p, modelId) => {
                  if (p) setPrefilledPrompt(p);
                  if (modelId) setPrefilledModelId(modelId);
                  setCurrentTab('dispatch');
                }}
              />
            )}

            {currentTab === 'ledger' && (
              <ContextLedgerView
                ledger={ledger}
                activePersona={activePersona}
                onNavigateTab={setCurrentTab}
                persistenceMode={persistenceMode}
                onTogglePersistenceMode={setPersistenceMode}
              />
            )}

            {currentTab === 'catalog' && (
              <ModelCatalog
                models={models}
                onAddModel={handleAddModel}
                onUpdateModelStatus={handleUpdateModelStatus}
                activePersona={activePersona}
                onNavigateTab={setCurrentTab}
                onSelectModelForDispatch={(modelId) => {
                  setPrefilledModelId(modelId);
                  setCurrentTab('dispatch');
                }}
              />
            )}

            {currentTab === 'teams' && (
              <TeamGovernance
                activePersona={activePersona}
                onNavigateTab={setCurrentTab}
                onOpenCompanyAdminWizard={() => setIsCompanyAdminWizardOpen(true)}
              />
            )}

            {currentTab === 'admin' && (
              <AdminConsole
                onNavigateTab={setCurrentTab}
                persistenceMode={persistenceMode}
                onTogglePersistenceMode={setPersistenceMode}
              />
            )}

            {currentTab === 'research' && (
              <MarketResearchView 
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'pricing' && (
              <PricingPage
                onNavigateTab={handleNavigateTab}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
              />
            )}

            {currentTab === 'benchmarks' && (
              <BenchmarksPage 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'docs' && (
              <DocumentationPage 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'faq' && (
              <FaqPage 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'privacy' && (
              <PrivacyPolicyPage 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'terms' && (
              <TermsOfServicePage 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'contact' && (
              <ContactPage
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'how-it-works' && (
              <HowItWorks 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'capabilities' && (
              <Capabilities 
                onNavigateTab={handleNavigateTab}
              />
            )}

            {currentTab === 'examples' && (
              <Examples 
                onNavigateTab={handleNavigateTab}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
                onPrefillPrompt={(prompt, modelId) => {
                  setPrefilledPrompt(prompt);
                  if (modelId) setPrefilledModelId(modelId);
                  handleNavigateTab('dispatch');
                }}
              />
            )}

            {currentTab === 'workspace' && (
              <Workspace
                onNavigateTab={handleNavigateTab}
                onOpenAuthGate={() => setIsAuthGateOpen(true)}
              />
            )}

            {currentTab === 'home' && (
              <Home 
                onNavigateTab={handleNavigateTab}
                onPrefillPrompt={(prompt, modelId) => {
                  setPrefilledPrompt(prompt);
                  if (modelId) setPrefilledModelId(modelId);
                  handleNavigateTab('dispatch');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Modern Frosted Glass Footer with crawlable semantic links */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-slate-950/70 backdrop-blur-xl py-10 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 border-b border-white/5 pb-8">
            {/* Column 1: Core Platform */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Product</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('home'); }}
                    className="hover:text-white transition-colors"
                  >
                    Overview
                  </a>
                </li>
                <li>
                  <a
                    href="/dispatch"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('dispatch'); }}
                    className="hover:text-white transition-colors"
                  >
                    Dispatch Console
                  </a>
                </li>
                <li>
                  <a
                    href="/workspace"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('workspace'); }}
                    className="hover:text-white transition-colors"
                  >
                    Workspace Studio
                  </a>
                </li>
                <li>
                  <a
                    href="/catalog"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('catalog'); }}
                    className="hover:text-white transition-colors"
                  >
                    Model Catalog
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Architecture */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Architecture</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/how-it-works"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('how-it-works'); }}
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="/capabilities"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('capabilities'); }}
                    className="hover:text-white transition-colors"
                  >
                    Capabilities Deck
                  </a>
                </li>
                <li>
                  <a
                    href="/examples"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('examples'); }}
                    className="hover:text-white transition-colors"
                  >
                    Real Examples & ROI
                  </a>
                </li>
                <li>
                  <a
                    href="/quality"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('quality'); }}
                    className="hover:text-white transition-colors"
                  >
                    Bayesian Quality
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Data & Benchmarks */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Benchmarks & Docs</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/benchmarks"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('benchmarks'); }}
                    className="hover:text-white transition-colors text-emerald-400 font-semibold"
                  >
                    2026 Model Benchmarks
                  </a>
                </li>
                <li>
                  <a
                    href="/docs"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('docs'); }}
                    className="hover:text-white transition-colors text-cyan-400 font-semibold"
                  >
                    API Docs & SDK
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('faq'); }}
                    className="hover:text-white transition-colors"
                  >
                    Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a
                    href="/research"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('research'); }}
                    className="hover:text-white transition-colors"
                  >
                    Market Research
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Analytics & Audit */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Enterprise & Audit</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/ledger"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('ledger'); }}
                    className="hover:text-white transition-colors"
                  >
                    Context Ledger (SHA-256)
                  </a>
                </li>
                <li>
                  <a
                    href="/analytics"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('analytics'); }}
                    className="hover:text-white transition-colors"
                  >
                    Savings & ROI Analytics
                  </a>
                </li>
                <li>
                  <a
                    href="/credentials"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('credentials'); }}
                    className="hover:text-white transition-colors"
                  >
                    Company BYOK Keys
                  </a>
                </li>
                <li>
                  <a
                    href="/company/team"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('teams'); }}
                    className="hover:text-white transition-colors"
                  >
                    Team & Governance
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Pricing & Account */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Commercial</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/pricing"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('pricing'); }}
                    className="hover:text-white transition-colors text-amber-400 font-semibold"
                  >
                    Pricing & Free Trial
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('contact'); }}
                    className="hover:text-white transition-colors"
                  >
                    Contact Enterprise
                  </a>
                </li>
                <li>
                  <a
                    href="/admin"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('admin'); }}
                    className="hover:text-white transition-colors"
                  >
                    Platform Admin
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 6: Legal & Compliance */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">Trust & Security</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('privacy'); }}
                    className="hover:text-white transition-colors"
                  >
                    Privacy & Zero-Data-Retention
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => { e.preventDefault(); handleNavigateTab('terms'); }}
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service & SLA
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
                <Globe className="w-3 h-3" /> ai.whyor.in
              </span>
              <span className="text-slate-400">• Multi-Model Router</span>
              <span className="text-slate-400">• Thompson-Sampling Beta(α,β)</span>
              <span className="text-slate-400">• SHA-256 Context Ledger</span>
            </div>

            <div className="text-slate-500">
              Part of the WhyOr product suite. © 2026 WhyOr Technologies Inc.
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive 14-Endpoint FastAPI v1 Explorer Modal */}
      <ApiExplorerModal
        isOpen={isApiExplorerOpen}
        onClose={() => setIsApiExplorerOpen(false)}
        activePersona={activePersona}
      />

      {/* 7-Day Free Trial Auth Gate Modal */}
      <AuthGateModal
        isOpen={isAuthGateOpen}
        onClose={() => setIsAuthGateOpen(false)}
        title="Activate Your 7-Day Free Trial"
        reason="Sign up with Google to access our managed Claude 3.7 & Gemini 2.5 subscription pools. Zero credit card or payment friction required."
        onSuccess={() => {
          setIsAuthGateOpen(false);
          setCurrentTab('dispatch');
        }}
      />

      {/* Interactive Role & Permissions Matrix Modal */}
      <RoleMatrixModal
        isOpen={isRoleMatrixOpen}
        onClose={() => setIsRoleMatrixOpen(false)}
        activePersona={activePersona}
        onSelectPersona={(persona) => {
          setActivePersona(persona);
          setIsRoleMatrixOpen(false);
        }}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsRoleMatrixOpen(false);
        }}
      />

      {/* 7-Step Company Admin Onboarding & Team Provisioning Wizard */}
      <CompanyAdminOnboardingWizard
        isOpen={isCompanyAdminWizardOpen}
        onClose={() => setIsCompanyAdminWizardOpen(false)}
        activePersona={activePersona}
        onComplete={(updatedCompany) => {
          setIsCompanyAdminWizardOpen(false);
          setVerificationBanner(`Enterprise setup completed successfully for ${updatedCompany.name}! Employees have been provisioned.`);
        }}
      />
    </div>
  );
}
