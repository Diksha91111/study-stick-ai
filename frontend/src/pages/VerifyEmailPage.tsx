import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, CheckCircle2, XCircle, ArrowRight, RefreshCw, Mail, AlertTriangle, Loader2, Clock } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxAttempts, setMaxAttempts] = useState(false);
  const [expired, setExpired] = useState(false);

  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const initialEmailSent = searchParams.get('emailSent');
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'sent' | 'failed'>(
    initialEmailSent === 'true' ? 'sent' : 'failed'
  );
  // Do NOT start countdown if sending failed on initial arrival
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(
    initialEmailSent === 'true' ? 10 * 60 : 0
  );

  const email = emailParam || '';

  useEffect(() => {
    if (verified) return;
    const timer = setInterval(() => {
      setOtpExpirySeconds((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [verified]);

  useEffect(() => {
    const tokenParam = searchParams.get('token') || searchParams.get('otp');
    if (tokenParam && /^\d{6}$/.test(tokenParam)) {
      setOtp(tokenParam.split(''));
    } else if (inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [searchParams]);

  const isOtpComplete = otp.every((d) => d !== '');

  const handleChange = useCallback((index: number, value: string) => {
    setError(null);
    setMaxAttempts(false);
    setExpired(false);
    const trimmed = value.replace(/\D/g, '');
    const digit = trimmed.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setError(null);
    setMaxAttempts(false);
    setExpired(false);
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    if (pasted.length < 6) {
      inputRefs.current[focusIdx]?.focus();
    } else {
      inputRefs.current[5]?.blur();
    }
  }, []);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isOtpComplete || !email || verifying || verified) return;
    setVerifying(true);
    setError(null);
    setMaxAttempts(false);
    setExpired(false);
    try {
      await verifyEmail(email, otp.join(''));
      setVerified(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Verification failed. Please try again.';
      if (status === 429 || msg.toLowerCase().includes('maximum')) {
        setMaxAttempts(true);
      } else if (msg.toLowerCase().includes('expir')) {
        setExpired(true);
      } else {
        setError(msg);
      }
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending || resendCooldown > 0) return;
    setResending(true);
    setResendError(null);
    setResendSuccess(null);
    setMaxAttempts(false);
    setError(null);
    setExpired(false);
    try {
      const res = await resendVerification(email);
      const isEmailSent = res.data?.emailSent ?? res.data?.emailDelivered;

      if (isEmailSent === false || res.data?.deliveryMode === 'simulated') {
        setEmailDeliveryStatus('failed');
        setResendError("We couldn't send the verification code. Please try again.");
        // Do NOT start/reset countdown when sending failed
      } else {
        setEmailDeliveryStatus('sent');
        setResendSuccess('Verification code sent. Check your email.');
        setOtp(['', '', '', '', '', '']);
        setOtpExpirySeconds(10 * 60); // Only start countdown when real email sent
        setResendCooldown(60);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err: any) {
      setEmailDeliveryStatus('failed');
      const msg = err?.response?.data?.message || "We couldn't send the verification code. Please try again.";
      setResendError(msg);
      // Do NOT start countdown on failure
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Study Stick AI Account Authentication
          </p>
        </div>

        {!verified ? (
          <>
            {/* Email display */}
            {email ? (
              emailDeliveryStatus === 'sent' ? (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      Verification code sent. Check your email.
                    </p>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      We couldn't send the verification code. Please try again.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No email address provided. Please return to registration or login.
                </p>
              </div>
            )}

            {/* OTP Inputs */}
            {email && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      disabled={verifying || verified || maxAttempts}
                      className={`
                        w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-xl
                        border-2 transition-all duration-150
                        bg-white dark:bg-slate-800
                        text-slate-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        ${error || expired
                          ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500 focus:border-rose-500'
                          : maxAttempts
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700'
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    />
                  ))}
                </div>

                {/* Error / Expired / MaxAttempts banners */}
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>
                  </div>
                )}
                {expired && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-700 dark:text-amber-300">Verification code has expired.</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-0.5">Request a new OTP below.</p>
                    </div>
                  </div>
                )}
                {maxAttempts && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-rose-700 dark:text-rose-300">Maximum attempts exceeded.</p>
                      <p className="text-rose-600 dark:text-rose-400 mt-0.5">Please request a new OTP.</p>
                    </div>
                  </div>
                )}
                {resendError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{resendError}</p>
                  </div>
                )}
                {resendSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{resendSuccess}</p>
                  </div>
                )}

                {/* OTP expiry countdown: only start when email was actually accepted by mail server */}
                <div className="flex items-center justify-center gap-2 text-xs">
                  {emailDeliveryStatus === 'sent' && otpExpirySeconds > 0 ? (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Code expires in {formatTime(otpExpirySeconds)}
                    </span>
                  ) : emailDeliveryStatus === 'sent' && otpExpirySeconds === 0 ? (
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      Code expired. Please request a new OTP.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Email delivery pending configuration. Click Resend Code below to retry.
                    </span>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={!isOtpComplete || verifying || !email || maxAttempts}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP button */}
                <div className="flex flex-col items-center gap-2">
                  {resendCooldown > 0 ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend available in {resendCooldown}s
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || !email}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Resend OTP
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Back to login link */}
            <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Redirecting you to Sign In...
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
              >
                Proceed to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
