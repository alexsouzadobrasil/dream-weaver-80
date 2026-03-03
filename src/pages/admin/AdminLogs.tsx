import { useEffect, useState, useCallback, useRef } from 'react';
import { getLogs, clearLog, type LogEntry, type LogsData } from '../../lib/adminApi';

const levelColor: Record<string, string> = {
  INFO:    'text-blue-400 bg-blue-900/20 border-blue-800/30',
  WARNING: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  ERROR:   'text-red-400 bg-red-900/20 border-red-800/30',
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function AdminLogs() {
  const [data, setData] = useState<LogsData | null>(null);
  const [file, setFile]   = useState('errors');
  const [level, setLevel] = useState('');
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getLogs(file, level, limit);
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [file, level, limit]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 10000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, load]);

  async function handleClear() {
    if (!confirm(`Limpar o log "${file}.log"? Esta ação não pode ser desfeita.`)) return;
    await clearLog(file);
    load();
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Logs</h1>

      {/* Info dos arquivos */}
      {data?.files && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(data.files).map(([name, info]) => (
            <button key={name} onClick={() => { setFile(name); setLevel(''); }}
              className={`text-left rounded-xl border p-3 transition-colors ${
                file === name ? 'border-purple-600 bg-purple-900/20' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
              }`}>
              <div className="font-medium text-white text-sm">{name}.log</div>
              <div className="text-gray-500 text-xs mt-1">{info.exists ? fmtBytes(info.size_bytes) : 'Vazio'}</div>
              {info.modified && <div className="text-gray-600 text-xs">{new Date(info.modified).toLocaleTimeString('pt-BR')}</div>}
            </button>
          ))}
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={file} onChange={e => setFile(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="errors">errors.log</option>
          <option value="app">app.log</option>
          <option value="worker">worker.log</option>
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os níveis</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value={50}>50 entradas</option>
          <option value={200}>200 entradas</option>
          <option value={500}>500 entradas</option>
        </select>

        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm">↻ Atualizar</button>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-purple-500" />
          Auto (10s)
        </label>

        <button onClick={handleClear}
          className="ml-auto bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 rounded-lg px-4 py-2 text-sm">
          🗑️ Limpar log
        </button>
      </div>

      {/* Info */}
      {data && (
        <div className="flex gap-4 text-xs text-gray-500 mb-3">
          <span>{data.total_lines} linhas totais</span>
          <span>{data.entries.length} exibidas</span>
          <span>{fmtBytes(data.size_bytes)}</span>
          {autoRefresh && <span className="text-purple-400">● Auto-refresh ativo</span>}
        </div>
      )}

      {/* Entradas */}
      <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
        {loading && !data && <div className="text-gray-500 py-8 text-center">Carregando...</div>}
        {data?.entries.map((entry, i) => (
          <LogRow key={i} entry={entry} />
        ))}
        {data?.entries.length === 0 && (
          <div className="text-gray-500 py-8 text-center bg-gray-900 rounded-xl border border-gray-800">
            Nenhum registro encontrado 🎉
          </div>
        )}
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false);
  const colorClass = levelColor[entry.level] ?? 'text-gray-400 bg-gray-800/20 border-gray-700/30';
  const hasData = entry.data && (typeof entry.data === 'object' ? Object.keys(entry.data as object).length > 0 : true);

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${colorClass}`}>
      <div className="flex items-start gap-3">
        <span className="font-bold shrink-0 w-16">{entry.level}</span>
        <span className="text-gray-500 shrink-0 w-36">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
        <span className="text-gray-400 shrink-0 w-28 truncate">{entry.context}</span>
        <span className="flex-1">{entry.message}</span>
        {hasData && (
          <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-gray-300 shrink-0">{open ? '▲' : '▼'}</button>
        )}
      </div>
      {open && hasData && (
        <pre className="mt-2 text-gray-400 bg-black/20 rounded p-2 overflow-x-auto text-xs">
          {JSON.stringify(entry.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
