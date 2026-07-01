import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [message, setMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();



  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.message === 'User is inactive') {
        setError('Your account is currently inactive. Please contact the administrator.');
      } else {
        setError('Invalid email or password.');
      }
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden />
      <motion.div
        className="login-page__content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="stk-card login-card login-card--themed"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.45 }}
        >
          <div className="login-card__header">
            <motion.div
              className="app-logo-mark login-card__logo"
              animate={{ boxShadow: ['0 0 0 rgba(255,153,0,0)', '0 0 24px rgba(255,153,0,0.35)', '0 0 0 rgba(255,153,0,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              SSP
            </motion.div>
            <h2>Sign in</h2>
            <p>SSP Management Portal</p>
          </div>

          {error && (
            <div className="badge-danger login-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && <div className="badge-success login-alert">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@ssp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="login-password-row">
                <label className="form-label">Password</label>
                <button type="button" className="login-link-btn" onClick={() => setForgotOpen(true)}>
                  Forgot password?
                </button>
              </div>
              <div className="input-icon-wrap">
                <Lock size={18} />
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button disabled={loading} type="submit" className="btn btn-primary login-submit">
              {loading ? 'Please wait...' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </motion.div>
      </motion.div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
