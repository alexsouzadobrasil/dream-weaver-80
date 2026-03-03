import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, setAdminSecret } from '../../lib/adminApi';

export default function AdminLogin() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setAdminSecret(secret);
      await adminLogin(secret);
      navigate('/admin/dashboard');
    } catch {
      setError('Secret inválido. Verifique o ADMIN_SECRET no .env.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌙</div>
          <h1 className="text-2xl font-bold text-white">Jerry Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Painel de controle</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Admin Secret</label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 border border-red-800/40">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
