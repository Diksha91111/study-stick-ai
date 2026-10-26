import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partialRegisteredEmail, setPartialRegisteredEmail] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate requests from rapid double-clicks or key presses
    if (isSubmittingRef.current || isLoading) {
      return;
    }
    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);
    setPartialRegisteredEmail(null);

    if (!agreedToTerms) {
      setError('Please accept the Terms & Conditions and Privacy Policy to continue.');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    try {
      const res = await register(name, email, password, confirmPassword, agreedToTerms);
      const isEmailDelivered = res.data?.emailSent ?? res.data?.emailDelivered;
      const code = res.data?.code;
      const userEmail = email.toLowerCase().trim();

      if (isEmailDelivered === false || code === 'EMAIL_SEND_FAILED') {
        setError("We couldn't send the verification code. Please try again.");
        setPartialRegisteredEmail(userEmail);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(userEmail)}&emailSent=true`);
      }
    } catch (err: any) {
      const code: string | undefined = err?.response?.data?.data?.code || err?.response?.data?.code;
      const returnedEmail: string | undefined =
        err?.response?.data?.data?.email ||
        (typeof email === 'string' ? email.trim().toLowerCase() : undefined);
      const fallbackMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed. Please try again.';

      if (code === 'EMAIL_EXISTS' || code === 'EMAIL_ALREADY_EXISTS') {
        setError('An account with this email already exists. Please sign in.');
      } else if (code === 'EMAIL_NOT_VERIFIED' || code === 'VERIFICATION_REQUIRED') {
        if (returnedEmail) {
          navigate(`/verify-email?email=${encodeURIComponent(returnedEmail)}`);
          return;
        }
        setError('This email is registered but not verified. Please verify your email or request a new OTP.');
      } else if (code === 'EMAIL_SEND_FAILED') {
        setError('Account created, but verification email could not be sent. Please retry.');
        if (returnedEmail) {
          setPartialRegisteredEmail(returnedEmail);
        }
      } else {
        setError(fallbackMsg);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Student Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start balancing your college semester with competitive exam preparation
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2">
            <div>{error}</div>
            {(error.includes('already exists') || error.includes('Conflict')) && (
              <div className="pt-1.5 border-t border-rose-200/50 dark:border-rose-900/50">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Already registered? Click here to Sign In →
                </Link>
              </div>
            )}
            {partialRegisteredEmail && (
              <div className="pt-1.5 border-t border-rose-200/50 dark:border-rose-900/50 flex items-center justify-between">
                <span>Account ready for verification:</span>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(partialRegisteredEmail)}&emailSent=false`}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Verify / Resend OTP →
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.sharma@studystick.ai"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password (Min 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Mandatory Terms & Conditions + Privacy Policy Consent Checkbox */}
            <div className="flex items-start gap-2.5 pt-1 text-left">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked && error === 'Please accept the Terms & Conditions and Privacy Policy to continue.') {
                    setError(null);
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating account...' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>

        {/* Legal Links Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Terms &amp; Conditions
          </Link>
          <span>•</span>
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};
