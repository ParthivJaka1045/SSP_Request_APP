import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordModal({ open, onClose }) {
  const { verifyEmailForReset, resetPasswordByEmail } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('email');
    setEmail('');
    setVerifiedName('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onVerifyEmail = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await verifyEmailForReset(email);
      setVerifiedName(result.name || email.split('@')[0]);
      setStep('password');
    } catch (e) {
      setError(e.message || 'Account not found.');
    }
    setLoading(false);
  };

  const onSavePassword = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordByEmail(email, newPassword);
      setStep('done');
    } catch (e) {
      setError(e.message || 'Could not update password.');
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'email' ? 'Forgot password' : step === 'password' ? 'Set new password' : 'Password updated'}
      description={
        step === 'email'
          ? 'Enter your email to verify your account.'
          : step === 'password'
            ? `Account verified: ${verifiedName}`
            : undefined
      }
      hideFooter
    >
      <div className="forgot-password-flow">
        {error && <div className="badge-danger forgot-password-flow__error">{error}</div>}

        {step === 'email' && (
          <>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ssp.com"
                autoFocus
              />
            </div>
            <div className="forgot-password-flow__actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={onVerifyEmail} disabled={loading || !email.trim()}>
                {loading ? 'Checking...' : 'Next →'}
              </button>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="forgot-password-flow__verified">
              ✓ Account verified: {verifiedName}
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Re-enter password</label>
              <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <div className="forgot-password-flow__actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('email')}>← Back</button>
              <button type="button" className="btn btn-primary" onClick={onSavePassword} disabled={loading}>
                {loading ? 'Saving...' : 'Update password'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Your password has been updated. You can sign in with the new password.</p>
            <div className="forgot-password-flow__actions">
              <button type="button" className="btn btn-primary" onClick={handleClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
