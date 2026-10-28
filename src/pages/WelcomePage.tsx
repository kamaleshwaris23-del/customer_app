import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Sparkles } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  // Detect motion preferences
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intro states: 'playing' -> 'fading' -> 'completed'
  const [introState, setIntroState] = useState<'playing' | 'fading' | 'completed'>(() => {
    return prefersReducedMotion ? 'completed' : 'playing';
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Step 1: Trigger smooth fade out after 3.0 seconds
    const fadeTimer = setTimeout(() => {
      setIntroState('fading');
    }, 3000);

    // Step 2: Fully remove overlay from DOM after fade out completes (3.45s)
    const completeTimer = setTimeout(() => {
      setIntroState('completed');
    }, 3450);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [prefersReducedMotion]);

  const handleSkip = () => {
    setIntroState('completed');
  };

  const handleGetStarted = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      localStorage.setItem('door2life_onboarded_v1', 'true');
    } catch {
      // ignore
    }
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        backgroundColor: '#edf4fc',
        background: 'linear-gradient(180deg, #f0f7ff 0%, #e6effa 100%)',
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Animated Video-like Splash Intro Overlay */}
      {introState !== 'completed' && (
        <div
          className={`splash-intro-overlay ${introState === 'fading' ? 'fading-out' : ''}`}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && introState === 'fading') {
              setIntroState('completed');
            }
          }}
          style={{
            pointerEvents: introState === 'fading' ? 'none' : 'auto',
          }}
        >
          {/* Ambient Floating Glow Orbs & Particles */}
          <div className="splash-orb splash-orb-1" aria-hidden="true" />
          <div className="splash-orb splash-orb-2" aria-hidden="true" />
          <div className="splash-orb splash-orb-3" aria-hidden="true" />
          <div className="splash-particle splash-particle-1" aria-hidden="true" />
          <div className="splash-particle splash-particle-2" aria-hidden="true" />
          <div className="splash-particle splash-particle-3" aria-hidden="true" />
          <div className="splash-particle splash-particle-4" aria-hidden="true" />
          <div className="splash-particle splash-particle-5" aria-hidden="true" />

          {/* Skip Intro Button */}
          <button
            type="button"
            className="splash-skip-btn"
            onClick={handleSkip}
            aria-label="Skip animated intro"
          >
            <span>Skip Intro</span>
            <ArrowRight size={13} />
          </button>

          {/* Central Animated Content Container */}
          <div className="splash-content-container">
            {/* Animated Logo Mark */}
            <div className="splash-brand-emblem" aria-hidden="true">
              <Sparkles size={32} strokeWidth={2.4} />
            </div>

            {/* Revealed Brand Title */}
            <h1 className="splash-brand-title">
              Door<span>2</span>Life
            </h1>

            {/* Revealed Subtitle */}
            <div className="splash-brand-subtitle">
              Customer Data Management System
            </div>

            {/* Sequenced Animated Illustration */}
            <div className="splash-svg-stage">
              <svg
                viewBox="0 0 420 270"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                aria-label="Animated illustration of team managing customer data"
                role="img"
              >
                {/* Background Ambient Glow Circles */}
                <circle cx="210" cy="135" r="115" fill="#eff6ff" />
                <circle cx="210" cy="135" r="85" fill="#dbeafe" fillOpacity="0.5" />

                {/* Ambient Grid dots */}
                <g fill="#93c5fd" opacity="0.4">
                  <circle cx="90" cy="60" r="2.5" />
                  <circle cx="110" cy="60" r="2.5" />
                  <circle cx="310" cy="60" r="2.5" />
                  <circle cx="330" cy="60" r="2.5" />
                  <circle cx="80" cy="190" r="2.5" />
                  <circle cx="100" cy="190" r="2.5" />
                  <circle cx="320" cy="190" r="2.5" />
                  <circle cx="340" cy="190" r="2.5" />
                </g>

                {/* Central Customer Record Card (Scale & Materialize animation) */}
                <g className="splash-anim-card" filter="drop-shadow(0 8px 16px rgba(37, 99, 235, 0.12))">
                  <rect x="135" y="55" width="150" height="135" rx="14" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1.5" />
                  <path d="M135 69C135 61.268 141.268 55 149 55H271C278.732 55 285 61.268 285 69V80H135V69Z" fill="#eff6ff" />
                  <circle cx="170" cy="104" r="16" fill="#dbeafe" />
                  <path
                    d="M170 98C172.209 98 174 99.7909 174 102C174 104.209 172.209 106 170 106C167.791 106 166 104.209 166 102C166 99.7909 167.791 98 170 98Z"
                    fill="#2563eb"
                  />
                  <path
                    d="M162 116C162 112.686 164.686 110 168 110H172C175.314 110 178 112.686 178 116V117H162V116Z"
                    fill="#2563eb"
                  />
                  <rect x="195" y="97" width="68" height="6" rx="3" fill="#0f172a" />
                  <rect x="195" y="108" width="46" height="5" rx="2.5" fill="#64748b" />
                  <rect x="150" y="128" width="58" height="14" rx="7" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                  <circle cx="157" cy="135" r="2.5" fill="#10b981" />
                  <rect x="163" y="132" width="38" height="5" rx="2" fill="#059669" />
                  <rect x="150" y="150" width="120" height="4" rx="2" fill="#e2e8f0" />
                  <rect x="150" y="160" width="90" height="4" rx="2" fill="#e2e8f0" />
                  <rect x="150" y="170" width="105" height="4" rx="2" fill="#e2e8f0" />
                </g>

                {/* Floating Analytics Mini Chart Card (Line drawing animation) */}
                <g className="splash-anim-chart-card" filter="drop-shadow(0 4px 10px rgba(37, 99, 235, 0.12))">
                  <rect x="270" y="40" width="75" height="52" rx="10" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
                  <rect x="278" y="47" width="28" height="4" rx="2" fill="#0f172a" />
                  <path
                    className="splash-anim-chart-line"
                    d="M280 78L294 69L308 73L325 58"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="325" cy="58" r="3" fill="#2563eb" />
                  <circle cx="308" cy="73" r="2" fill="#60a5fa" />
                  <circle cx="294" cy="69" r="2" fill="#60a5fa" />
                  <circle cx="280" cy="78" r="2" fill="#60a5fa" />
                </g>

                {/* Floating Local Storage Node */}
                <g className="splash-anim-storage-node" filter="drop-shadow(0 4px 10px rgba(37, 99, 235, 0.1))">
                  <rect x="75" y="45" width="65" height="46" rx="10" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
                  <ellipse cx="107" cy="58" rx="18" ry="5" fill="#2563eb" />
                  <path d="M89 58V65C89 67.76 97.06 70 107 70C116.94 70 125 67.76 125 65V58" fill="#1d4ed8" opacity="0.3" />
                  <ellipse cx="107" cy="65" rx="18" ry="4.5" fill="#3b82f6" />
                  <path d="M89 65V72C89 74.76 97.06 77 107 77C116.94 77 125 74.76 125 72V65" fill="#1d4ed8" opacity="0.3" />
                  <ellipse cx="107" cy="72" rx="18" ry="4.5" fill="#60a5fa" />
                  <circle cx="128" cy="50" r="3" fill="#10b981" />
                </g>

                {/* Team Character Left (Slides in from left) */}
                <g className="splash-anim-person-left">
                  <path d="M68 235C68 205 77 195 95 195C113 195 122 205 122 235V245H68V235Z" fill="#1e293b" />
                  <path d="M87 195L95 210L103 195H87Z" fill="#38bdf8" />
                  <circle cx="95" cy="168" r="14" fill="#fed7aa" />
                  <path d="M81 168C81 156 87 148 95 148C105 148 111 154 111 165V172C108 170 105 169 101 169C95 169 91 173 89 173L81 168Z" fill="#475569" />
                  <path d="M106 205L122 188L130 196L116 215" fill="#2563eb" />
                  <rect x="120" y="172" width="24" height="32" rx="3" transform="rotate(12 120 172)" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                  <line x1="128" y1="182" x2="138" y2="184" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="126" y1="188" x2="136" y2="190" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="124" y1="194" x2="134" y2="196" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Team Character Right (Slides in from right) */}
                <g className="splash-anim-person-right">
                  <path d="M298 235C298 205 307 195 325 195C343 195 352 205 352 235V245H298V235Z" fill="#2563eb" />
                  <path d="M318 195L325 208L332 195H318Z" fill="#ffffff" />
                  <circle cx="325" cy="168" r="14" fill="#fcd34d" />
                  <path d="M311 166C311 154 316 148 325 148C334 148 339 152 339 164C333 164 329 162 325 162C320 162 316 164 311 166Z" fill="#1e293b" />
                  <path d="M305 208L282 185L276 191L295 218" fill="#1d4ed8" />
                  <circle cx="278" cy="188" r="4.5" fill="#fcd34d" />
                </g>

                {/* Center Front Figure (Reveals in place) */}
                <g className="splash-anim-person-center">
                  <path d="M185 240C185 218 193 210 210 210C227 210 235 218 235 240V245H185V240Z" fill="#0f172a" />
                  <path d="M208 214L210 228L212 214Z" fill="#2563eb" />
                  <circle cx="210" cy="192" r="13" fill="#fed7aa" />
                  <path d="M198 190C198 180 203 175 210 175C217 175 222 179 222 188C217 187 213 186 210 186C205 186 201 188 198 190Z" fill="#334155" />
                </g>

                {/* Popping in Success Indicator Badge */}
                <g className="splash-anim-success-badge" filter="drop-shadow(0 2px 6px rgba(16, 185, 129, 0.25))">
                  <circle cx="150" cy="80" r="12" fill="#10b981" />
                  <path d="M144.5 80L148.5 84L156 76.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Popping in Search Node Badge */}
                <g className="splash-anim-search-badge" filter="drop-shadow(0 2px 6px rgba(37, 99, 235, 0.2))">
                  <circle cx="270" cy="120" r="11" fill="#2563eb" />
                  <circle cx="269" cy="119" r="4" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="272" y1="122" x2="275" y2="125" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>

            {/* Timed Progress Indicator */}
            <div className="splash-progress-track" aria-hidden="true">
              <div className="splash-progress-bar" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Standalone Welcome Screen Card (Transitions smoothly in after intro) */}
      <div
        className={introState === 'completed' ? 'welcome-screen-fade-in' : ''}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '2.5rem 2rem 2.25rem',
          boxShadow: '0 20px 45px -12px rgba(37, 99, 235, 0.1), 0 4px 16px -2px rgba(15, 23, 42, 0.05)',
          border: '1px solid #dbeafe',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Top: Small Blue Icon representing a Group of People */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            color: '#2563eb',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)',
          }}
          aria-hidden="true"
        >
          <Users size={26} strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.25,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem 0',
          }}
        >
          Customer Data Management System
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#475569',
            letterSpacing: '0.02em',
            margin: '0 0 1.5rem 0',
          }}
        >
          Collect · Organize · Grow
        </p>

        {/* Centered Team Illustration Managing Customer Data */}
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            margin: '0 auto 1.75rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <svg
            viewBox="0 0 420 270"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-label="Illustration of a team managing customer data"
            role="img"
          >
            {/* Soft Ambient Background Glow */}
            <circle cx="210" cy="135" r="115" fill="#eff6ff" />
            <circle cx="210" cy="135" r="85" fill="#dbeafe" fillOpacity="0.5" />

            {/* Subtle Grid dots */}
            <g fill="#93c5fd" opacity="0.4">
              <circle cx="90" cy="60" r="2.5" />
              <circle cx="110" cy="60" r="2.5" />
              <circle cx="310" cy="60" r="2.5" />
              <circle cx="330" cy="60" r="2.5" />
              <circle cx="80" cy="190" r="2.5" />
              <circle cx="100" cy="190" r="2.5" />
              <circle cx="320" cy="190" r="2.5" />
              <circle cx="340" cy="190" r="2.5" />
            </g>

            {/* Central Customer Record Card */}
            <g filter="drop-shadow(0 8px 16px rgba(37, 99, 235, 0.12))">
              <rect x="135" y="55" width="150" height="135" rx="14" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1.5" />

              {/* Card Header Banner */}
              <path d="M135 69C135 61.268 141.268 55 149 55H271C278.732 55 285 61.268 285 69V80H135V69Z" fill="#eff6ff" />

              {/* Avatar circle */}
              <circle cx="170" cy="104" r="16" fill="#dbeafe" />
              <path
                d="M170 98C172.209 98 174 99.7909 174 102C174 104.209 172.209 106 170 106C167.791 106 166 104.209 166 102C166 99.7909 167.791 98 170 98Z"
                fill="#2563eb"
              />
              <path
                d="M162 116C162 112.686 164.686 110 168 110H172C175.314 110 178 112.686 178 116V117H162V116Z"
                fill="#2563eb"
              />

              {/* Customer Info lines */}
              <rect x="195" y="97" width="68" height="6" rx="3" fill="#0f172a" />
              <rect x="195" y="108" width="46" height="5" rx="2.5" fill="#64748b" />

              {/* Status pill: Verified */}
              <rect x="150" y="128" width="58" height="14" rx="7" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
              <circle cx="157" cy="135" r="2.5" fill="#10b981" />
              <rect x="163" y="132" width="38" height="5" rx="2" fill="#059669" />

              {/* Data tags */}
              <rect x="150" y="150" width="120" height="4" rx="2" fill="#e2e8f0" />
              <rect x="150" y="160" width="90" height="4" rx="2" fill="#e2e8f0" />
              <rect x="150" y="170" width="105" height="4" rx="2" fill="#e2e8f0" />
            </g>

            {/* Floating Mini Chart Card */}
            <g filter="drop-shadow(0 4px 10px rgba(37, 99, 235, 0.12))">
              <rect x="270" y="40" width="75" height="52" rx="10" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
              <rect x="278" y="47" width="28" height="4" rx="2" fill="#0f172a" />
              <path d="M280 78L294 69L308 73L325 58" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="325" cy="58" r="3" fill="#2563eb" />
              <circle cx="308" cy="73" r="2" fill="#60a5fa" />
              <circle cx="294" cy="69" r="2" fill="#60a5fa" />
              <circle cx="280" cy="78" r="2" fill="#60a5fa" />
            </g>

            {/* Floating Database / Storage Node */}
            <g filter="drop-shadow(0 4px 10px rgba(37, 99, 235, 0.1))">
              <rect x="75" y="45" width="65" height="46" rx="10" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
              <ellipse cx="107" cy="58" rx="18" ry="5" fill="#2563eb" />
              <path d="M89 58V65C89 67.76 97.06 70 107 70C116.94 70 125 67.76 125 65V58" fill="#1d4ed8" opacity="0.3" />
              <ellipse cx="107" cy="65" rx="18" ry="4.5" fill="#3b82f6" />
              <path d="M89 65V72C89 74.76 97.06 77 107 77C116.94 77 125 74.76 125 72V65" fill="#1d4ed8" opacity="0.3" />
              <ellipse cx="107" cy="72" rx="18" ry="4.5" fill="#60a5fa" />
              <circle cx="128" cy="50" r="3" fill="#10b981" />
            </g>

            {/* Team Character Left: Woman with clipboard/tablet managing records */}
            <g>
              <path d="M68 235C68 205 77 195 95 195C113 195 122 205 122 235V245H68V235Z" fill="#1e293b" />
              <path d="M87 195L95 210L103 195H87Z" fill="#38bdf8" />
              <circle cx="95" cy="168" r="14" fill="#fed7aa" />
              <path d="M81 168C81 156 87 148 95 148C105 148 111 154 111 165V172C108 170 105 169 101 169C95 169 91 173 89 173L81 168Z" fill="#475569" />
              <path d="M106 205L122 188L130 196L116 215" fill="#2563eb" />
              <rect x="120" y="172" width="24" height="32" rx="3" transform="rotate(12 120 172)" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
              <line x1="128" y1="182" x2="138" y2="184" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="126" y1="188" x2="136" y2="190" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="124" y1="194" x2="134" y2="196" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Team Character Right: Man analyzing customer growth */}
            <g>
              <path d="M298 235C298 205 307 195 325 195C343 195 352 205 352 235V245H298V235Z" fill="#2563eb" />
              <path d="M318 195L325 208L332 195H318Z" fill="#ffffff" />
              <circle cx="325" cy="168" r="14" fill="#fcd34d" />
              <path d="M311 166C311 154 316 148 325 148C334 148 339 152 339 164C333 164 329 162 325 162C320 162 316 164 311 166Z" fill="#1e293b" />
              <path d="M305 208L282 185L276 191L295 218" fill="#1d4ed8" />
              <circle cx="278" cy="188" r="4.5" fill="#fcd34d" />
            </g>

            {/* Center Front Figure (Leader/Specialist managing the flow) */}
            <g>
              <path d="M185 240C185 218 193 210 210 210C227 210 235 218 235 240V245H185V240Z" fill="#0f172a" />
              <path d="M208 214L210 228L212 214Z" fill="#2563eb" />
              <circle cx="210" cy="192" r="13" fill="#fed7aa" />
              <path d="M198 190C198 180 203 175 210 175C217 175 222 179 222 188C217 187 213 186 210 186C205 186 201 188 198 190Z" fill="#334155" />
            </g>

            {/* Floating Connection Sparkles / Badges */}
            <g>
              <circle cx="210" cy="35" r="4" fill="#3b82f6" />
              <path d="M210 27V43M202 35H218" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />

              {/* Small check badge */}
              <g filter="drop-shadow(0 2px 6px rgba(16, 185, 129, 0.2))">
                <circle cx="150" cy="80" r="11" fill="#10b981" />
                <path d="M145 80L148.5 83.5L155 77" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Small search badge */}
              <g filter="drop-shadow(0 2px 6px rgba(37, 99, 235, 0.2))">
                <circle cx="270" cy="120" r="11" fill="#2563eb" />
                <circle cx="269" cy="119" r="4" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="272" y1="122" x2="275" y2="125" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>

        {/* Prominent Blue "Get Started" Button */}
        <button
          type="button"
          id="welcome-get-started-btn"
          onClick={handleGetStarted}
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease',
            outline: 'none',
            position: 'relative',
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(37, 99, 235, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(37, 99, 235, 0.4)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
          }}
        >
          <span>Get Started</span>
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>

        {/* Tagline Under Button */}
        <div
          style={{
            marginTop: '1.1rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: '#64748b',
            letterSpacing: '0.02em',
          }}
        >
          Simple. Secure. Local.
        </div>
      </div>
    </div>
  );
};
