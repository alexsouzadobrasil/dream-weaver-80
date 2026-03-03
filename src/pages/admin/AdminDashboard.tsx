import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, type DashboardData } from '../../lib/adminApi';

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fmtBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

const statusColor: Record<string, string> = {
  processing:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  interpreted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  eligible:    'bg-teal-500/20 text-teal-400 border-teal-500/30',
  published:   'bg-green-500/20 text-green-400 border-green-500/30',
  failed:      'bg-red-500/20 text-red-400 border-red-500/30',
};

const levelColor: Record<string, string> = {
  INFO:    'text-blue-400',
  WARNING: 'text-yellow-400',
  ERROR:   'text-red-400',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><div className="text-gray-400 p-8">Carregando...</div></PageShell>;
  if (error) return <PageShell><div className="text-red-400 p-8">Erro: {error}</div></PageShell>;
  if (!data) return null;

  const d = data.dreams;
  const u = data.users;
  const don = data.donations;

  return (
    <PageShell>
      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🌙" label="Sonhos" value={String(d.total ?? 0)} sub={`${d.failed ?? 0} falhas`} color="purple" to="/admin/dreams" />
        <StatCard icon="👥" label="Usuários" value={String(u.total ?? 0)} sub={`${u.banned ?? 0} banidos`} color="blue" to="/admin/users" />
        <StatCard icon="💳" label="Doações" value={fmtBRL(Number(don.total_confirmed_cents ?? 0))} sub={`${don.confirmed ?? 0} confirmadas`} color="green" to="/admin/donations" />
        <StatCard icon="❌" label="Erros" value={String(data.recent_errors.length)} sub="no log" color="red" to="/admin/logs" />
      </div>

      {/* Sonhos por status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="Sonhos por Status">
          <div className="space-y-2">
            {['processing','interpreted','eligible','published','failed'].map(s => (
              <div key={s} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded border ${statusColor[s]}`}>{s}</span>
                <span className="text-white font-medium">{d[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Armazenamento">
          <div className="space-y-3">
            {Object.entries(data.storage).map(([key, bytes]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400">{key}</span>
                <span className="text-white">{fmt(bytes)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm">
            <span className="text-gray-400">PHP {data.php_version}</span>
            <span className="text-gray-500 text-xs">{new Date(data.server_time).toLocaleString('pt-BR')}</span>
          </div>
        </Card>
      </div>

      {/* Sonhos recentes */}
      <Card title="Sonhos Recentes" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-700">
                <th className="text-left pb-2">ID</th>
                <th className="text-left pb-2">Usuário</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Texto</th>
                <th className="text-left pb-2">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.recent_dreams.map(dr => (
                <tr key={dr.id} className="hover:bg-gray-800/40">
                  <td className="py-2 pr-3">
                    <Link to={`/admin/dreams/${dr.id}`} className="text-purple-400 hover:underline">#{dr.id}</Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-300">{dr.client_name}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[dr.status]}`}>{dr.status}</span>
                  </td>
                  <td className="py-2 pr-3 text-gray-400 max-w-xs truncate">{dr.text_preview}</td>
                  <td className="py-2 text-gray-500 text-xs">{new Date(dr.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {data.recent_dreams.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-gray-500">Nenhum sonho</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Erros recentes */}
      <Card title="Erros Recentes">
        <div className="space-y-2">
          {data.recent_errors.slice(0, 5).map((e, i) => (
            <div key={i} className="bg-gray-800/60 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold ${levelColor[e.level] ?? 'text-gray-400'}`}>{e.level}</span>
                <span className="text-gray-500">{e.context}</span>
                <span className="text-gray-600 ml-auto">{new Date(e.timestamp).toLocaleTimeString('pt-BR')}</span>
              </div>
              <p className="text-gray-300">{e.message}</p>
            </div>
          ))}
          {data.recent_errors.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhum erro recente 🎉</p>
          )}
        </div>
        {data.recent_errors.length > 0 && (
          <Link to="/admin/logs" className="block mt-3 text-xs text-purple-400 hover:underline">Ver todos os logs →</Link>
        )}
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, to }: {
  icon: string; label: string; value: string; sub: string;
  color: 'purple' | 'blue' | 'green' | 'red'; to: string;
}) {
  const colors = {
    purple: 'border-purple-800/40 bg-purple-900/10',
    blue:   'border-blue-800/40 bg-blue-900/10',
    green:  'border-green-800/40 bg-green-900/10',
    red:    'border-red-800/40 bg-red-900/10',
  };
  return (
    <Link to={to} className={`block rounded-xl p-4 border ${colors[color]} hover:opacity-80 transition-opacity`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xs text-gray-600 mt-1">{sub}</div>
    </Link>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}
