import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, KeyRound, Shield } from 'lucide-react';
import { loginWithCredentials } from '../services/authService';
import {
  authenticateWithGoogle,
  DEMO_ADMIN_CREDENTIALS,
  SUPER_ADMIN_CREDENTIALS,
} from '../services/authStorage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve destination if redirected from a protected route
  const destination =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    const passedError = (location.state as { error?: string })?.error;
    if (passedError) {
      setErrorMessage(passedError);
    }
  }, [location.state]);

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    const result = authenticateWithGoogle();
    if (!result.success) {
      setErrorMessage(
        result.error ||
          'Google authentication setup is required. No external OAuth provider is configured.'
      );
      return;
    }
    navigate(destination, { replace: true });
  };

  const handleFillSuperAdmin = () => {
    setEmail(SUPER_ADMIN_CREDENTIALS.email);
    setPassword(SUPER_ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  const handleFillAdmin = () => {
    setEmail(DEMO_ADMIN_CREDENTIALS.email);
    setPassword(DEMO_ADMIN_CREDENTIALS.password);
    setErrorMessage(null);
  };

  const handleFillTeamMember = () => {
    setEmail('operator@door2life.local');
    setPassword('D2L-Demo-2026!');
    setErrorMessage(null);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(trimmedEmail, password);
      if (!result.success) {
        setErrorMessage(
          result.error || 'Invalid email or password. Please check your credentials.'
        );
        setIsSubmitting(false);
        return;
      }

      // Successful genuine authentication -> navigate to destination
      navigate(destination, { replace: true });
    } catch {
      setErrorMessage('An unexpected authentication error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        <div className="login-accent-bar" />

        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-mark" aria-hidden="true">
            <Sparkles size={24} strokeWidth={2.5} />
          </div>
          <h1 className="login-heading">Welcome to Door2Life</h1>
          <p className="login-subheading">Sign in to manage your customer data</p>
        </div>

        {/* User-friendly Error Alert */}
        {errorMessage && (
          <div className="login-alert login-alert-error" role="alert">
            <AlertCircle size={18} className="login-alert-icon" />
            <div className="login-alert-text">{errorMessage}</div>
          </div>
        )}

        {/* Prominent Google Sign-in Button */}
        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Small OR Divider */}
        <div className="login-divider" aria-hidden="true">
          <span className="login-divider-line" />
          <span className="login-divider-text">OR</span>
          <span className="login-divider-line" />
        </div>

        {/* Email and Password Sign In Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="login-form" noValidate>
          {/* Email input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <div className="input-with-icon-wrapper">
              <span className="input-icon-left" aria-hidden="true">
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input input-padded-left"
                placeholder="name@door2life.local"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password input with show/hide toggle */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="input-with-icon-wrapper">
              <span className="input-icon-left" aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input input-padded-left input-padded-right"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Local RBAC Quick Access Helper for Testing */}
        <div className="login-demo-box">
          <div className="login-demo-header">
            <span className="login-demo-pill">RBAC Demo Accounts</span>
            <span className="login-demo-tag">Testing & Verification</span>
          </div>
          <p className="login-demo-desc">
            Test the three authenticated roles with individual role-restricted permissions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="login-demo-fill-btn"
              onClick={handleFillSuperAdmin}
              title="Fill Super Admin Credentials"
            >
              <Shield size={14} color="#2563eb" />
              <span>Super Admin (Full Platform Control)</span>
            </button>
            <button
              type="button"
              className="login-demo-fill-btn"
              onClick={handleFillAdmin}
              title="Fill Admin Credentials"
            >
              <KeyRound size={14} color="#d97706" />
              <span>Admin (Operational Management)</span>
            </button>
            <button
              type="button"
              className="login-demo-fill-btn"
              onClick={handleFillTeamMember}
              title="Fill Team Member Credentials"
            >
              <KeyRound size={14} color="#059669" />
              <span>Team Member (Assigned Work Only)</span>
            </button>
          </div>
        </div>

        {/* Subtle, Professional Footer */}
        <div className="login-subtle-footer">
          Customer Data Management System
        </div>
      </div>
    </div>
  );
};
