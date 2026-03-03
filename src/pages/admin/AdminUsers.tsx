import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUsers, getUser, updateUser, type UserRow, type UserDetailData } from '../../lib/adminApi';

// ── Lista de Usuários ──────────────────────────────────────────────────────
export function AdminUsersList() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getUsers({
        page, limit: 20,
        ...(filter !== '' && { active: filter }),
        ...(search && { search }),
      });
      setUsers(r.users);
      setTotal(r.total);
      setTotalPages(r.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleBanToggle(user: UserRow) {
    const newActive = user.active === 1 ? 0 : 1;
    const action = newActive === 0 ? 'Banir' : 'Desbanir';
    if (!confirm(`${action} usuário #${user.id} (${user.name})?`)) return;
    await updateUser(user.id, newActive === 1);
    load();
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Usuários <span className="text-gray-500 font-normal text-base">({total})</span></h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="Buscar..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 w-52" />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos</option>
          <option value="1">Ativos</option>
          <option value="0">Banidos</option>
        </select>
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm">↻ Atualizar</button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Fingerprint</th>
                <th className="text-left px-4 py-3">Sonhos</th>
                <th className="text-left px-4 py-3">Criado</th>
                <th className="text-left px-4 py-3">Último acesso</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && <tr><td colSpan={8} className="py-8 text-center text-gray-500">Carregando...</td></tr>}
              {!loading && users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-800/30 transition-colors ${u.active === 0 ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u.id}`} className="text-purple-400 hover:underline">#{u.id}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.fingerprint?.slice(0, 16)}...</td>
                  <td className="px-4 py-3 text-gray-300">{u.dream_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.last_used_at ? new Date(u.last_used_at).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3">
                    {u.active === 1
                      ? <span className="text-xs px-2 py-0.5 rounded border bg-green-500/20 text-green-400 border-green-500/30">Ativo</span>
                      : <span className="text-xs px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">Banido</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link to={`/admin/users/${u.id}`} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 text-base" title="Ver detalhes">👁️</Link>
                      <button onClick={() => handleBanToggle(u)}
                        className={`p-1 rounded hover:bg-gray-700 text-base ${u.active === 1 ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                        title={u.active === 1 ? 'Banir' : 'Desbanir'}>
                        {u.active === 1 ? '🚫' : '✅'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhum usuário</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-gray-500 text-xs">{total} usuários</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40">← Anterior</button>
              <span className="text-gray-400 text-xs px-2 py-1">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40">Próximo →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detalhe de Usuário ─────────────────────────────────────────────────────
export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    getUser(Number(id)).then(setData).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleBanToggle() {
    if (!data) return;
    const newActive = data.user.active === 1 ? 0 : 1;
    await updateUser(data.user.id, newActive === 1);
    load();
  }

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;
  if (!data) return <div className="p-6 text-red-400">Usuário não encontrado.</div>;

  const u = data.user;
  const fmtBRL = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/users" className="text-gray-500 hover:text-white text-sm">← Usuários</Link>
        <span className="text-gray-700">/</span>
        <span className="text-white font-bold">#{u.id} — {u.name}</span>
        {u.active === 0 && <span className="text-xs px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">BANIDO</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3 text-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Perfil</h3>
          <InfoRow label="ID" v={`#${u.id}`} />
          <InfoRow label="Nome" v={u.name} />
          <InfoRow label="Fingerprint" v={u.fingerprint?.slice(0,20) + '...'} />
          <InfoRow label="Status" v={u.active === 1 ? 'Ativo' : 'Banido'} />
          <InfoRow label="Criado" v={new Date(u.created_at).toLocaleString('pt-BR')} />
          <InfoRow label="Último acesso" v={u.last_used_at ? new Date(u.last_used_at).toLocaleString('pt-BR') : '—'} />
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Estatísticas</h3>
          <div className="space-y-3">
            <Stat label="Sonhos" value={String(data.dreams.length)} />
            <Stat label="Doações" value={String(data.donation_stats.count)} />
            <Stat label="Total doado" value={fmtBRL(data.donation_stats.total_cents)} />
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Ações</h3>
          <button onClick={handleBanToggle}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              u.active === 1
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/40'
                : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800/40'
            }`}>
            {u.active === 1 ? '🚫 Banir usuário' : '✅ Desbanir usuário'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300">Sonhos ({data.dreams.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Texto</th>
                <th className="text-left px-4 py-2">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.dreams.map(d => (
                <tr key={d.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2">
                    <Link to={`/admin/dreams/${d.id}`} className="text-purple-400 hover:underline">#{d.id}</Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      { processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', interpreted: 'bg-blue-500/20 text-blue-400 border-blue-500/30', eligible: 'bg-teal-500/20 text-teal-400 border-teal-500/30', published: 'bg-green-500/20 text-green-400 border-green-500/30', failed: 'bg-red-500/20 text-red-400 border-red-500/30' }[d.status] ?? 'bg-gray-700 text-gray-400 border-gray-600'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 max-w-xs truncate">{d.text_preview}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {data.dreams.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhum sonho</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 text-right truncate max-w-[180px]" title={v}>{v}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}
