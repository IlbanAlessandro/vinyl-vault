import { useState } from 'react';
import { Disc3, User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function InputField({ icon: Icon, type, placeholder, value, onChange, disabled }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]">
        <Icon size={16} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={type === 'password' ? 'current-password' : 'username'}
        className="
          w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white placeholder-[#333]
          rounded-lg pl-11 pr-4 py-3.5 font-body text-sm outline-none
          focus:border-red-600 focus:ring-1 focus:ring-red-600/30
          transition-all duration-200 disabled:opacity-50
        "
      />
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#1a1a1a] opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[#1a1a1a] opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-red-900/20 opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-900/20" />
        {/* Gradient radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-900/5 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 animate-fade-in">
        <div className="relative">
          <Disc3 size={36} className="text-red-600" />
          <Disc3 size={36} className="text-red-600 absolute inset-0 blur-lg opacity-50" />
        </div>
        <div>
          <h1 className="font-display text-4xl text-white tracking-widest leading-none">
            VINYL VAULT
          </h1>
          <p className="text-[10px] text-[#333] font-mono uppercase tracking-widest">
            Community Rating Platform
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm animate-slide-up">
        <div className="vinyl-card border-[#222]">
          <div className="h-0.5 bg-gradient-to-r from-red-700 via-red-500 to-transparent" />

          <div className="p-7">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-[#0d0d0d] rounded-lg mb-7">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setPassword(''); }}
                  className={`
                    flex-1 py-2 rounded text-sm font-body font-medium transition-all duration-200 capitalize
                    ${mode === m
                      ? 'bg-red-600 text-white'
                      : 'text-[#555] hover:text-white'
                    }
                  `}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <InputField
                icon={User}
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />
              <InputField
                icon={Lock}
                type="password"
                placeholder={isLogin ? 'Password' : 'Password (min. 6 chars)'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-lg animate-fade-in">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="
                  vinyl-btn-primary w-full py-3.5 mt-1 flex items-center justify-center gap-2
                  disabled:opacity-40 disabled:cursor-not-allowed text-base
                "
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {!isLogin && (
              <p className="text-xs text-[#333] text-center mt-4">
                Username: 3-30 chars, letters/numbers/-/_
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[#333] text-xs mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={switchMode} className="text-red-600 hover:text-red-400 transition-colors">
            {isLogin ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
