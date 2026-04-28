import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../services/firebase';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../assets/styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const { idToken } = await loginWithEmail(email, password);
      const res = await authAPI.login(idToken);
      setUser(res.Data);
      navigate('/');
    } catch (err) {
      setError(err.message === 'Firebase: Error (auth/invalid-credential).'
        ? 'Email hoặc mật khẩu không đúng'
        : err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      const { idToken } = await loginWithGoogle();
      const res = await authAPI.login(idToken);
      setUser(res.Data);
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo"><span>🧠</span></div>
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Flashcard AI — Học từ vựng thông minh</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="login-email"
            />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="login-submit-btn">
            {loading ? '⏳ Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">hoặc</div>

        <button className="auth-google-btn" onClick={handleGoogleLogin} disabled={loading} id="google-login-btn">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          Đăng nhập bằng Google
        </button>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
