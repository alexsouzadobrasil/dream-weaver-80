import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDonations, type DonationRow, type DonationsData } from '../../lib/adminApi';

const statusColor: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed:    'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminDonations() {
  const [data, setData] = useState<DonationsData | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getDonations({ page, limit: 20, ...(status && { status }) });
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const fmtBRL = (c: number | string) => `R$ ${(Number(c) / 100).toFixed(2).replace('.', ',')}`;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Doações</h1>

      {/* Totais */}
      {data?.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total recebido', value: fmtBRL(data.totals.total_confirmed_cents ?? 0), color: 'green' },
            { label: 'Confirmadas',    value: String(data.totals.confirmed ?? 0),             color: 'teal'  },
            { label: 'Pendentes',      value: String(data.totals.pending ?? 0),               color: 'yellow'},
            { label: 'Falhadas',       value: String(data.totals.failed ?? 0),                color: 'red'   },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmadas</option>
          <option value="pending">Pendentes</option>
          <option value="failed">Falhadas</option>
        </select>
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm">↻ Atualizar</button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">CPF/CNPJ</th>
                <th className="text-left px-4 py-3">Sonho</th>
                <th className="text-left px-4 py-3">TXID</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Confirmação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && <tr><td colSpan={9} className="py-8 text-center text-gray-500">Carregando...</td></tr>}
              {!loading && data?.donations.map((d: DonationRow) => (
                <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-300">#{d.id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{fmtBRL(d.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-200 text-xs">{d.customer_name || d.client_name || '—'}</div>
                    {d.customer_email && <div className="text-gray-500 text-xs">{d.customer_email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{d.customer_tax_id || '—'}</td>
                  <td className="px-4 py-3">
                    {d.dream_id
                      ? <Link to={`/admin/dreams/${d.dream_id}`} className="text-purple-400 hover:underline">#{d.dream_id}</Link>
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono truncate max-w-[120px]" title={d.txid}>{d.txid?.slice(0, 16)}...</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.confirmed_at ? new Date(d.confirmed_at).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
              {!loading && (data?.donations.length === 0) && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-500">Nenhuma doação</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-gray-500 text-xs">{data.total} doações</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40">← Anterior</button>
              <span className="text-gray-400 text-xs px-2 py-1">{page}/{data.total_pages}</span>
              <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40">Próximo →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
