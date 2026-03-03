import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getDreams, getDream, updateDream, deleteDream, type DreamRow, type DreamDetailData } from '../../lib/adminApi';

const BASE_URL = 'https://jerry.com.br';

const statusColor: Record<string, string> = {
  processing:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  interpreted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  eligible:    'bg-teal-500/20 text-teal-400 border-teal-500/30',
  published:   'bg-green-500/20 text-green-400 border-green-500/30',
  failed:      'bg-red-500/20 text-red-400 border-red-500/30',
};

const ALL_STATUSES = ['','processing','interpreted','eligible','published','failed'];

// ── Lista de Sonhos ────────────────────────────────────────────────────────
export function AdminDreamsList() {
  const [dreams, setDreams] = useState<DreamRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getDreams({ page, limit: 20, ...(status && { status }), ...(mode && { mode }), ...(search && { search }) });
      setDreams(r.dreams);
      setTotal(r.total);
      setTotalPages(r.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, status, mode, search]);

  useEffect(() => { load(); }, [load]);

  async function handleStatus(id: number, newStatus: string) {
    await updateDream(id, { status: newStatus });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(`Deletar sonho #${id}? Esta ação não pode ser desfeita.`)) return;
    await deleteDream(id);
    load();
  }

  async function handleRetry(id: number) {
    await updateDream(id, { status: 'processing' });
    load();
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Sonhos <span className="text-gray-500 font-normal text-base">({total})</span></h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 w-52"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s || 'Todos os status'}</option>)}
        </select>
        <select value={mode} onChange={e => { setMode(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os modos</option>
          <option value="text">Texto</option>
          <option value="audio">Áudio</option>
        </select>
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm transition-colors">↻ Atualizar</button>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Modo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Texto</th>
                <th className="text-left px-4 py-3">Mídias</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">Carregando...</td></tr>
              )}
              {!loading && dreams.map(d => (
                <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/dreams/${d.id}`} className="text-purple-400 hover:underline font-medium">#{d.id}</Link>
                    {d.is_priority && <span className="ml-1 text-yellow-400 text-xs">★</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{d.client_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                      {d.input_mode === 'audio' ? '🎙️ áudio' : '✍️ texto'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{d.text_preview}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {d.has_image && '🖼️ '}{d.has_audio && '🔊'}
                    {!d.has_image && !d.has_audio && '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/dreams/${d.id}`} title="Ver" className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors text-base">👁️</Link>
                      {d.status === 'failed' && (
                        <button onClick={() => handleRetry(d.id)} title="Reprocessar" className="text-yellow-400 hover:text-yellow-300 p-1 rounded hover:bg-gray-700 transition-colors text-base">↺</button>
                      )}
                      {d.status === 'interpreted' && (
                        <button onClick={() => handleStatus(d.id, 'eligible')} title="Marcar elegível" className="text-teal-400 hover:text-teal-300 p-1 rounded hover:bg-gray-700 transition-colors text-xs px-2">✓ Elegível</button>
                      )}
                      {d.status === 'eligible' && (
                        <button onClick={() => handleStatus(d.id, 'published')} title="Publicar" className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700 transition-colors text-xs px-2">⬆ Publicar</button>
                      )}
                      <button onClick={() => handleDelete(d.id)} title="Deletar" className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors text-base">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && dreams.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhum sonho encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-gray-500 text-xs">{total} sonhos</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700">← Anterior</button>
              <span className="text-gray-400 text-xs px-2 py-1">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700">Próximo →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detalhe de Sonho ───────────────────────────────────────────────────────
export function AdminDreamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DreamDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDream(Number(id)).then(setData).finally(() => setLoading(false));
  }, [id]);

  async function handleStatus(status: string) {
    await updateDream(Number(id), { status });
    const fresh = await getDream(Number(id));
    setData(fresh);
  }

  async function handleDelete() {
    if (!confirm('Deletar este sonho permanentemente?')) return;
    await deleteDream(Number(id));
    navigate('/admin/dreams');
  }

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;
  if (!data) return <div className="p-6 text-red-400">Sonho não encontrado.</div>;

  const dr = data.dream;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dreams" className="text-gray-500 hover:text-white text-sm">← Sonhos</Link>
        <span className="text-gray-700">/</span>
        <span className="text-white font-bold">#{dr.id}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[dr.status]}`}>{dr.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Meta */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3 text-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Informações</h3>
          <Row label="ID" value={`#${dr.id}`} />
          <Row label="Usuário" value={dr.client_name} />
          <Row label="Fingerprint" value={dr.fingerprint?.slice(0,12) + '...'} />
          <Row label="Modo" value={dr.input_mode} />
          <Row label="Criado" value={new Date(dr.created_at).toLocaleString('pt-BR')} />
          <Row label="Processado" value={dr.processed_at ? new Date(dr.processed_at).toLocaleString('pt-BR') : '—'} />
          <Row label="Comentários" value={String(dr.total_comments)} />
          <Row label="Reações" value={String(dr.total_reactions)} />
        </div>

        {/* Ações */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Ações</h3>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Mudar status:</p>
            {['processing','interpreted','eligible','published','failed'].map(s => (
              <button key={s} onClick={() => handleStatus(s)} disabled={dr.status === s}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors
                  ${dr.status === s
                    ? `${statusColor[s]} opacity-60 cursor-default`
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  }`}>
                {dr.status === s ? '▶ ' : ''}{s}
              </button>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <button onClick={handleDelete}
                className="w-full text-center px-3 py-2 rounded-lg text-xs border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors">
                🗑️ Deletar sonho
              </button>
            </div>
          </div>
        </div>

        {/* Imagem */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Imagem</h3>
          {dr.image_path ? (
            <img src={`${BASE_URL}/${dr.image_path}`} alt="Imagem do sonho"
              className="w-full rounded-lg object-cover aspect-square" />
          ) : (
            <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-600">Sem imagem</div>
          )}
        </div>
      </div>

      {/* Textos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TextCard title="Texto do Sonho" content={dr.dream_text} />
        <TextCard title="Interpretação" content={dr.interpretation} />
      </div>

      {/* Transcrição (se áudio) */}
      {dr.transcription && <TextCard title="Transcrição (Whisper)" content={dr.transcription} className="mb-4" />}

      {/* Áudio */}
      {dr.narration_audio_path && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Narração</h3>
          <audio controls src={`${BASE_URL}/${dr.narration_audio_path}`} className="w-full" />
        </div>
      )}

      {/* Erro */}
      {dr.error_message && (
        <div className="bg-red-900/20 rounded-xl border border-red-800/40 p-4 mb-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Erro</h3>
          <p className="text-red-300 text-sm font-mono">{dr.error_message}</p>
        </div>
      )}

      {/* Reações */}
      {data.reactions.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Reações</h3>
          <div className="flex gap-6">
            {data.reactions.map(r => (
              <span key={r.reaction_type} className="text-sm text-gray-300">
                {r.reaction_type === 'like' ? '👍' : '👎'} {r.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comentários */}
      {data.comments.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comentários ({data.comments.length})</h3>
          <div className="space-y-3">
            {data.comments.map(c => (
              <div key={c.id} className={`p-3 rounded-lg text-sm ${c.deleted_at ? 'opacity-40 bg-gray-800/30' : 'bg-gray-800/60'}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300 font-medium">{c.author_name}</span>
                  <span className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-gray-400">{c.comment_text}</p>
                {c.deleted_at && <p className="text-red-400 text-xs mt-1">Deletado em {new Date(c.deleted_at).toLocaleString('pt-BR')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 text-right truncate max-w-[160px]" title={value}>{value}</span>
    </div>
  );
}

function TextCard({ title, content, className = '' }: { title: string; content: string | null; className?: string }) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 p-4 ${className}`}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      {content
        ? <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        : <p className="text-gray-600 text-sm italic">Não disponível</p>
      }
    </div>
  );
}
