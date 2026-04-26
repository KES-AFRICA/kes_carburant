'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─── Logo ──────────────────────────────────────────────────────────────────────
function FlameLogo({ size = 40 }: { size?: number }) {
  return <Image src="/favicon.ico" alt="KES Carburant" width={size} height={size} priority />;
}


// ─── Eye Icons ─────────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.25 h-4.25">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.25 h-4.25">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Login Icon ────────────────────────────────────────────────────────────────
function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ─── Shared Field Component ────────────────────────────────────────────────────
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  icon,
  showToggle,
  showPassword,
  onToggle,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  icon: React.ReactNode;
  showToggle?: boolean;
  showPassword?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.7px] mb-1.5">
        {label}
      </label>
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[10px] px-3.5 transition-all focus-within:border-blue-600 focus-within:shadow-[0_0_0_3px_rgba(26,86,219,0.1)]">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <input
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none font-[Plus_Jakarta_Sans] text-sm text-slate-900 py-3 px-2.5 placeholder-slate-300 disabled:text-slate-400"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="text-slate-400 hover:text-blue-600 transition-colors flex items-center p-0 bg-transparent border-none cursor-pointer"
          >
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/refuels');
      } else {
        router.push('/user/refuels');
      }
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !motDePasse) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const success = await login({ email, motDePasse });
    if (success) {
      toast.success('Connexion réussie');
      setTimeout(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/refuels');
        } else {
          router.push('/user/refuels');
        }
      }, 500);
    }
    setLoading(false);
  };

  // Shared form fields (used in both mobile & desktop)
  const formFields = (
    <>
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="nom@entreprise.com"
        disabled={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.25 h-4.25">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        }
      />
      <Field
        label="Mot de passe"
        type="password"
        value={motDePasse}
        onChange={setMotDePasse}
        placeholder="••••••••"
        disabled={loading}
        showToggle
        showPassword={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.25 h-4.25">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        }
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 flex items-center justify-center gap-2 rounded-[10px] font-semibold text-[15px] text-white tracking-[0.3px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #1341B0 0%, #2563EB 100%)',
          boxShadow: '0 4px 20px rgba(26,86,219,0.32)',
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Connexion...
          </>
        ) : (
          <>
            <LoginIcon />
            Se connecter
          </>
        )}
      </button>
    </>
  );

  return (
    <>
      {/* ── Google Font import (add to your _document or layout instead) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@300;400;600;700&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* ════════════════════════════════════════════════
          MOBILE  (hidden on md+)
      ════════════════════════════════════════════════ */}
      <div className="font-jakarta flex md:hidden min-h-screen flex-col bg-white relative overflow-hidden">

        {/* Top blob */}
        <div
          className="absolute top-0 left-0 right-0 h-80 z-0"
          style={{
            background: 'linear-gradient(145deg, #1341B0 0%, #1A56DB 60%, #2A7DFF 100%)',
            borderRadius: '0 0 70% 70% / 0 0 60px 60px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center pt-10 gap-2.5">
          <div
            className="w-17 h-17 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <FlameLogo size={34} />
          </div>
          <span className="font-sora text-white text-[17px] font-semibold tracking-[0.5px]">
            KES Carburant
          </span>
        </div>

        {/* Welcome text */}
        <div className="relative z-10 text-center px-6 pt-7">
          <h2 className="font-sora text-white text-[26px] font-bold leading-tight mb-1.5">
            Bienvenue
          </h2>
          <p className="text-white/80 text-[13px]">Connectez-vous pour continuer</p>
        </div>

        {/* Form card */}
        <div
          className="relative z-20 mt-7 flex-1 bg-white px-6 pt-8 pb-8"
          style={{ borderRadius: '28px 28px 0 0', boxShadow: '0 -4px 30px rgba(26,86,219,0.08)' }}
        >
          <form onSubmit={handleSubmit}>
            {formFields}
          </form>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP  (hidden on mobile, flex on md+)
      ════════════════════════════════════════════════ */}
      <div className="font-jakarta hidden md:flex min-h-screen items-center justify-center bg-indigo-50 p-6">
        <div
          className="flex w-full max-w-240 min-h-140 overflow-hidden"
          style={{ borderRadius: '24px', boxShadow: '0 20px 80px rgba(26,86,219,0.15), 0 2px 8px rgba(0,0,0,0.06)' }}
        >

          {/* Left — illustration panel */}
          <div
            className="flex-1 flex flex-col items-center justify-center px-10 py-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(150deg, #1341B0 0%, #1A56DB 55%, #3B82F6 100%)' }}
          >
            {/* Decorative circles */}
            <div
              className="absolute top-0 right-0 w-75 h-75 rounded-full -translate-y-1/3 translate-x-1/3"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="absolute bottom-0 left-0 w-50 h-50 rounded-full translate-y-1/3 -translate-x-1/3"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />

            {/* Logo */}
            <div
              className="w-22 h-22 rounded-full flex items-center justify-center mb-6 relative z-10"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <FlameLogo size={44} />
            </div>

            <div className="font-sora text-white text-[22px] font-bold mb-3 relative z-10">
              KES Carburant
            </div>
            <p className="text-white/75 text-sm text-center leading-relaxed max-w-55 relative z-10">
              Gérez vos pleins et consommations carburant en toute simplicité.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8 justify-center relative z-10">
              {['Suivi en temps réel', 'Rapports détaillés', 'Multi-véhicules'].map((pill) => (
                <span
                  key={pill}
                  className="text-white/90 text-xs font-medium px-3.5 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Right — form panel */}
          <div className="w-105 bg-white flex flex-col justify-center px-11 py-12 hrink-0">
            <h3 className="font-sora text-[26px] font-bold text-slate-900 mb-1.5">Connexion</h3>
            <p className="text-sm text-slate-500 mb-8">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
            <form onSubmit={handleSubmit}>
              {formFields}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}