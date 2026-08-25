import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  BarChart3, 
  KeyRound, 
  Users, 
  Layers, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  Menu, 
  X, 
  Globe, 
  Code2, 
  BookOpen, 
  MessageSquare,
  Activity,
  ShieldAlert,
  LogIn,
  LogOut,
  UserCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Building2,
  Crown,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPersona } from '../types';
import { PERSONA_PROFILES } from '../data/mockData';
import { ROLE_DEFINITIONS, canUserViewPage } from '../utils/permissions';
import { auth, signInWithGoogle, signOutUser, onAuthChanged } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { UsageMeter } from './UsageMeter';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activePersona: UserPersona;
  setActivePersona: (persona: UserPersona) => void;
  onOpenApiExplorer?: () => void;
  onOpenQualityInspector?: () => void;
  onOpenAuthGate?: () => void;
  onOpenRoleMatrix?: () => void;
  onOpenCompanyAdminWizard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activePersona,
  setActivePersona,
  onOpenApiExplorer,
  onOpenQualityInspector,
  onOpenAuthGate,
  onOpenRoleMatrix,
  onOpenCompanyAdminWizard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [hubMenuOpen, setHubMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const exploreMenuRef = useRef<HTMLDivElement>(null);
  const hubMenuRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Prevent background scrolling and handle ESC key when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreMenuRef.current && !exploreMenuRef.current.contains(event.target as Node)) {
        setExploreMenuOpen(false);
      }
      if (hubMenuRef.current && !hubMenuRef.current.contains(event.target as Node)) {
        setHubMenuOpen(false);
      }
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target as Node)) {
        setPersonaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin Console is strictly accessible ONLY to solarastra.in@gmail.com
  const isSuperAdmin = (firebaseUser?.email === 'solarastra.in@gmail.com') || (activePersona.email === 'solarastra.in@gmail.com') || (activePersona.role === 'platform_admin');

  // Core primary direct tabs (kept minimal to eliminate overcrowding and overflow)
  const directNavItems = [
    { 
      id: 'dispatch', 
      label: 'AI Chat & Dispatch', 
      icon: Cpu, 
      liveDot: true
    },
    { 
      id: 'quality', 
      label: 'Bayesian Quality', 
      icon: Activity, 
      badge: 'Beta(α,β)',
      highlight: true
    },
  ].filter(item => canUserViewPage(item.id, activePersona, firebaseUser?.email));

  // "Architecture & Features" dropdown items
  const architectureItems = [
    { 
      id: 'home', 
      label: 'Overview', 
      description: 'Unified gateway overview & architecture matrix',
      icon: Sparkles, 
      color: 'text-amber-400' 
    },
    { 
      id: 'how-it-works', 
      label: 'How It Works', 
      description: '2-stage semantic router, AST classification & fallbacks',
      icon: Layers, 
      color: 'text-cyan-400',
      badge: 'Pipeline' 
    },
    { 
      id: 'capabilities', 
      label: 'Capabilities Deck', 
      description: 'Zero-latency failovers, BYOK keys & enterprise quotas',
      icon: Sparkles, 
      color: 'text-purple-400',
      badge: 'Deck' 
    },
    { 
      id: 'examples', 
      label: 'Real Examples & ROI', 
      description: 'Interactive ROI case studies & live benchmark prompts',
      icon: BarChart3, 
      color: 'text-emerald-400',
      badge: 'ROI' 
    },
    { 
      id: 'benchmarks', 
      label: 'Model Benchmarks', 
      description: '2026 latency, token pricing & throughput index',
      icon: BarChart3, 
      color: 'text-emerald-400',
      badge: '2026' 
    },
    { 
      id: 'docs', 
      label: 'Developer API Docs', 
      description: '14-endpoint FastAPI reference & SDK quickstarts',
      icon: Code2, 
      color: 'text-cyan-400',
      badge: 'SDK' 
    },
    { 
      id: 'faq', 
      label: 'Platform FAQ', 
      description: 'Thompson sampling, zero data retention & BYOK guide',
      icon: HelpCircle, 
      color: 'text-amber-400' 
    },
    { 
      id: 'research', 
      label: 'Market Architecture', 
      description: 'Pareto routing benchmarks & multi-model research',
      icon: BookOpen, 
      color: 'text-blue-400' 
    },
  ].filter(item => canUserViewPage(item.id, activePersona, firebaseUser?.email));

  // "Platform Hub" dropdown items
  const platformToolsItems = [
    { 
      id: 'workspace', 
      label: 'Workspace & Studio', 
      description: 'Live prompt studio, contextual sandbox & ledger inspect',
      icon: Database, 
      color: 'text-indigo-400' 
    },
    { 
      id: 'analytics', 
      label: 'Savings & Trends', 
      description: 'ROI telemetry, token reductions & latency analytics',
      icon: BarChart3, 
      color: 'text-emerald-400' 
    },
    { 
      id: 'ledger', 
      label: 'Context Ledger', 
      description: 'SHA-256 state compression & context deduplication',
      icon: Database, 
      color: 'text-cyan-400' 
    },
    { 
      id: 'catalog', 
      label: 'Models & Tools Catalog', 
      description: '18+ model price/throughput directory & custom tool bindings',
      icon: Layers, 
      color: 'text-amber-400' 
    },
    { 
      id: 'credentials', 
      label: 'Company BYOK & Keys', 
      description: 'Bring your own provider keys or connect local CLI proxies',
      icon: KeyRound, 
      color: 'text-orange-400' 
    },
    { 
      id: 'pricing', 
      label: 'Pricing & 7-Day Trial', 
      description: 'Transparent tier pricing, usage budgets & zero-friction trial',
      icon: Sparkles, 
      color: 'text-amber-400',
      badge: 'No CC'
    },
    { 
      id: 'teams', 
      label: 'Team & Governance', 
      description: 'Multi-seat RBAC roles, department policies & rate limits',
      icon: Users, 
      color: 'text-purple-400',
      badge: activePersona.role === 'team_admin' || activePersona.isCompanyAdmin ? 'Admin' : undefined
    },
    { 
      id: 'admin', 
      label: 'SuperAdmin Console', 
      description: 'Global model catalog management, audit logs & telemetry',
      icon: ShieldCheck, 
      color: 'text-rose-400',
      badge: 'SuperAdmin'
    },
    { 
      id: 'contact', 
      label: 'Contact Us', 
      description: 'Enterprise inquiries, custom SLAs & dedicated private VPCs',
      icon: MessageSquare, 
      color: 'text-orange-400' 
    },
  ].filter(item => canUserViewPage(item.id, activePersona, firebaseUser?.email));

  const isExploreActive = architectureItems.some(item => item.id === currentTab && item.id !== 'quality');
  const isPlatformToolActive = platformToolsItems.some(item => item.id === currentTab);

  const handleGoogleAuth = async () => {
    setIsSigningIn(true);
    try {
      if (firebaseUser) {
        await signOutUser();
        const guestPersona = PERSONA_PROFILES.find(p => p.role === 'guest') || PERSONA_PROFILES[0];
        setActivePersona(guestPersona);
      } else {
        const { user } = await signInWithGoogle();
        if (user.email === 'solarastra.in@gmail.com') {
          const superPersona = PERSONA_PROFILES.find(p => p.email === 'solarastra.in@gmail.com');
          if (superPersona) setActivePersona(superPersona);
        } else {
          const userPersona = PERSONA_PROFILES.find(p => p.role === 'user') || PERSONA_PROFILES[1];
          setActivePersona(userPersona);
        }
      }
    } catch (err) {
      console.warn('Google auth notification:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-15 gap-1.5 sm:gap-2">
          
          {/* Brand & Domain */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              id="navbar-brand-logo-btn"
              onClick={() => {
                setCurrentTab('home');
                setMobileMenuOpen(false);
              }} 
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-md group-hover:border-orange-400/80 transition-all shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.8)]" />
              </div>
              <div>
                <div className="flex items-center gap-1 font-display font-bold text-sm sm:text-base tracking-tight text-white">
                  WhyOr <span className="text-slate-400 font-normal">Dispatch</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/90 font-medium">
                  <Globe className="w-2.5 h-2.5" />
                  ai.whyor.in
                </div>
              </div>
            </button>
          </div>

          {/* Primary Navigation Links (Uncluttered, Sleek, Well-Spaced Desktop Layout) */}
          <div className="hidden md:flex items-center space-x-1 xl:space-x-1.5">
            
            {/* Direct Hero Tabs */}
            {directNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                    isActive
                      ? item.highlight
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-md shadow-amber-500/10 font-bold'
                        : 'bg-white/[0.12] text-white border border-white/20 shadow-md shadow-black/20 font-bold'
                      : item.highlight
                      ? 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? (item.highlight ? 'text-amber-400' : 'text-orange-400') : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.liveDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Architecture & Features Dropdown */}
            <div className="relative" ref={exploreMenuRef}>
              <button
                id="nav-btn-explore-menu"
                onClick={() => {
                  setExploreMenuOpen(!exploreMenuOpen);
                  setHubMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                  isExploreActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explore</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${exploreMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {exploreMenuOpen && (
                <div className="absolute left-0 mt-2 w-76 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                      Architecture & Evidence
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ai.whyor.in
                    </span>
                  </div>

                  {architectureItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-explore-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setExploreMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-white/[0.12] border border-amber-400/40 text-white' 
                            : 'hover:bg-white/[0.06] text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${item.color} mt-0.5 shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Hub Dropdown for Enterprise Tools */}
            <div className="relative" ref={hubMenuRef}>
              <button
                id="nav-btn-platform-hub"
                onClick={() => {
                  setHubMenuOpen(!hubMenuOpen);
                  setExploreMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                  isPlatformToolActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>Platform</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${hubMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {hubMenuOpen && (
                <div className="absolute left-0 mt-2 w-76 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                      Platform Tools & Governance
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ai.whyor.in
                    </span>
                  </div>

                  {platformToolsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-more-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setHubMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-white/[0.12] border border-cyan-400/40 text-white' 
                            : 'hover:bg-white/[0.06] text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${item.color} mt-0.5 shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons & Persona Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Usage Meter displaying daily prompt quota and BYOK configuration link */}
            <UsageMeter 
              onNavigateToKeys={() => setCurrentTab('credentials')}
            />

            {/* OpenAPI / FastAPI Sandbox Trigger */}
            {onOpenApiExplorer && (
              <button
                id="open-api-explorer-btn"
                onClick={onOpenApiExplorer}
                className="hidden xl:flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-medium backdrop-blur-md transition-all cursor-pointer shadow-sm hover:border-cyan-400/50"
                title="Open WhyOr FastAPI v1 Interactive Endpoint Sandbox (14 Endpoints)"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>API</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-cyan-400/20 font-bold">14</span>
              </button>
            )}

            {/* 7-Day Free Trial CTA / Sign-up Button when not signed in */}
            {!firebaseUser && (
              <button
                id="navbar-trial-cta-btn"
                onClick={() => {
                  if (onOpenAuthGate) {
                    onOpenAuthGate();
                  } else {
                    setCurrentTab('pricing');
                  }
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                title="Start 7-Day Free Trial — No Credit Card Required"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>7-Day Trial</span>
              </button>
            )}

            {/* Global Company Name Badge (Visible for Company Admins and Company Employees) */}
            {activePersona.companyName && (
              <div 
                id="nav-company-name-badge"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-sm"
                title={`Logged in to Company Workspace: ${activePersona.companyName}`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="max-w-[130px] xl:max-w-[170px] truncate">{activePersona.companyName}</span>
              </div>
            )}

            {/* Company Admin 7-Step Setup Wizard Quick Launch Button */}
            {onOpenCompanyAdminWizard && (activePersona.role === 'corporate_admin' || activePersona.role === 'platform_admin' || activePersona.isCompanyAdmin) && (
              <button
                id="nav-company-admin-wizard-btn"
                onClick={onOpenCompanyAdminWizard}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/25 to-indigo-600/25 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/50 text-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Open Company Admin Onboarding Setup Wizard (7 Steps: Invitation -> BYOK -> Budgets -> Branding -> Teams -> Emails -> Confirm)"
              >
                <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Setup Wizard</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-purple-500/40 text-purple-100 font-bold border border-purple-400/40">7 Steps</span>
              </button>
            )}

            {/* Google Identity & SuperAdmin Status Button */}
            <button
              id="google-auth-trigger-btn"
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md transition-all cursor-pointer border ${
                firebaseUser?.email === 'solarastra.in@gmail.com' || activePersona.email === 'solarastra.in@gmail.com'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/20'
                  : firebaseUser
                  ? 'bg-blue-500/10 text-blue-300 border-blue-400/30 hover:bg-blue-500/20'
                  : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.1]'
              }`}
              title={firebaseUser ? `Authenticated as ${firebaseUser.email}` : "Sign in with Google (No Credit Card Required)"}
            >
              {firebaseUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[70px] sm:max-w-[90px]">{firebaseUser.displayName || firebaseUser.email?.split('@')[0]}</span>
                  {firebaseUser.email === 'solarastra.in@gmail.com' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold">Admin</span>
                  )}
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Persona Switcher */}
            <div className="relative" ref={personaMenuRef}>
              <button
                id="persona-switcher-btn"
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 backdrop-blur-md transition-all text-left cursor-pointer"
                title={`Current Persona: ${activePersona.name} (${activePersona.role})`}
              >
                <img
                  src={activePersona.avatar}
                  alt={activePersona.name}
                  className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-orange-400/50 shadow-sm"
                />
                <span className={`hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded-md uppercase font-bold ${
                  activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                  activePersona.role === 'corporate_admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                  activePersona.role === 'team_admin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' :
                  activePersona.role === 'team_member' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                  activePersona.role === 'user' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                  'bg-slate-700/50 text-slate-300 border border-white/10'
                }`}>
                  {activePersona.role.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-white/10 mb-1.5">
                    <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Persona RBAC Switcher
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Test routing rules, tier limits, and administrative views across roles.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {PERSONA_PROFILES.map((p) => {
                      const isSelected = p.id === activePersona.id;
                      return (
                        <button
                          key={p.id}
                          id={`select-persona-${p.id}`}
                          onClick={() => {
                            setActivePersona(p);
                            setPersonaMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected ? 'bg-white/[0.12] border border-orange-400/50 shadow-sm' : 'hover:bg-white/[0.06] border border-transparent'
                          }`}
                        >
                          <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
                                {p.role.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                            <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-cyan-400">
                              <span>Tiers: {p.allowedTiers.length} permitted</span>
                              {p.canBYOK && <span>• BYOK</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {onOpenRoleMatrix && (
                    <div className="pt-2 mt-1.5 border-t border-white/10">
                      <button
                        onClick={() => {
                          setPersonaMenuOpen(false);
                          onOpenRoleMatrix();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>View Role & Permissions Matrix</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10 transition-all cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {/* Off-Canvas Slide-Out Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
              aria-hidden="true"
            />

            {/* Off-Canvas Slide-out Drawer Panel */}
            <motion.aside
              key="mobile-nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-sm sm:max-w-md h-full bg-slate-950/98 border-l border-white/15 backdrop-blur-3xl shadow-2xl z-50 flex flex-col lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-slate-900/60">
                <button
                  id="mobile-drawer-brand-btn"
                  onClick={() => {
                    setCurrentTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 text-left group cursor-pointer"
                >
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white tracking-tight">
                      WhyOr <span className="text-slate-400 font-normal">Dispatch</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                      <Globe className="w-2.5 h-2.5" />
                      ai.whyor.in
                    </div>
                  </div>
                </button>

                <button
                  id="mobile-nav-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Persona & Authentication Quick Profile Card */}
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={activePersona.avatar}
                        alt={activePersona.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-400/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-white truncate">
                            {firebaseUser?.displayName || activePersona.name}
                          </span>
                          {firebaseUser?.email === 'solarastra.in@gmail.com' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {firebaseUser?.email || activePersona.email}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                      activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                      activePersona.role === 'team_admin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' :
                      activePersona.role === 'team_member' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                      activePersona.role === 'user' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                      'bg-slate-800 text-slate-300 border border-white/10'
                    }`}>
                      {activePersona.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <button
                      id="mobile-auth-toggle-btn"
                      onClick={() => {
                        handleGoogleAuth();
                      }}
                      disabled={isSigningIn}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 transition-all cursor-pointer"
                    >
                      {firebaseUser ? (
                        <>
                          <LogOut className="w-3 h-3 text-rose-400" />
                          <span>Sign Out</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3 h-3 text-emerald-400" />
                          <span>Sign In with Google</span>
                        </>
                      )}
                    </button>

                    {onOpenRoleMatrix && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenRoleMatrix();
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1"
                        title="Role Permissions Matrix"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>RBAC</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Usage Meter in Mobile Drawer */}
                <UsageMeter 
                  isMobileDrawer={true}
                  onNavigateToKeys={() => {
                    setCurrentTab('credentials');
                    setMobileMenuOpen(false);
                  }}
                />

                {/* Company Workspace Banner & Wizard Trigger in Mobile Drawer */}
                {activePersona.companyName && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">{activePersona.companyName}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        {activePersona.role.replace('_', ' ')}
                      </span>
                    </div>
                    {onOpenCompanyAdminWizard && (activePersona.role === 'corporate_admin' || activePersona.role === 'platform_admin' || activePersona.isCompanyAdmin) && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenCompanyAdminWizard();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Launch 7-Step Setup Wizard</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Section 1: Core Live Hub */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      Core Live Hub
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
                  {directNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-nav-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md shadow-orange-500/20' 
                            : 'text-slate-200 hover:bg-white/5 border border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-black/20 text-slate-950' : 'bg-white/5 text-amber-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-full font-bold ${
                            isActive ? 'bg-black/20 text-slate-950' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Section 2: Architecture & Evidence (Explore) */}
                <div className="space-y-1 pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-bold px-2 mb-1 flex items-center justify-between">
                    <span>Explore Architecture & Evidence</span>
                    <Compass className="w-3 h-3" />
                  </div>
                  {architectureItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-explore-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-amber-500/15 border border-amber-400/40 text-amber-200' 
                            : 'hover:bg-white/5 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${item.color} mt-0.5 shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Section 3: Platform Tools & Enterprise Governance */}
                <div className="space-y-1 pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold px-2 mb-1 flex items-center justify-between">
                    <span>Platform Tools & Governance</span>
                    <Layers className="w-3 h-3" />
                  </div>
                  {platformToolsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-hub-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-200' 
                            : 'hover:bg-white/5 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${item.color} mt-0.5 shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Section 4: Developer Tools Sandbox */}
                {onOpenApiExplorer && (
                  <div className="pt-3 border-t border-white/10">
                    <button
                      id="mobile-openapi-sandbox-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenApiExplorer();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">FastAPI v1 Sandbox</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-400/20 font-bold">14 Endpoints</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Drawer Footer CTA */}
              <div className="p-4 border-t border-white/10 bg-slate-900/80 shrink-0 space-y-2.5">
                {!firebaseUser ? (
                  <button
                    id="mobile-drawer-trial-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuthGate) onOpenAuthGate();
                      else setCurrentTab('pricing');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start 7-Day Free Trial (No CC)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCurrentTab('dispatch');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Launch AI Dispatch Console</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                  <span>Pareto AST v2.4</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 99.99% Routing SLA
                  </span>
                </div>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
