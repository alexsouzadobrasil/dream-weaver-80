import { useEffect, useState, useCallback } from 'react';
import { getStorage, deleteStorageFile, type StorageFile, type StorageData } from '../../lib/adminApi';

const BASE_URL = 'https://jerry.com.br';

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const TYPES = ['images', 'audio', 'narrations', 'qrcodes'] as const;

export default function AdminStorage() {
  const [type, setType] = useState<string>('images');
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<StorageFile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getStorage(type));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(file: StorageFile) {
    if (!confirm(`Deletar "${file.name}"? Esta ação não pode ser desfeita.`)) return;
    await deleteStorageFile(type, file.name);
    setPreview(null);
    load();
  }

  async function handleDeleteOrphans() {
    const orphans = data?.files.filter(f => f.orphan) ?? [];
    if (orphans.length === 0) return;
    if (!confirm(`Deletar ${orphans.length} arquivo(s) órfão(s)?`)) return;
    for (const f of orphans) await deleteStorageFile(type, f.name);
    load();
  }

  const orphans = data?.files.filter(f => f.orphan).length ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Arquivos</h1>

      {/* Resumo */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                type === t ? 'border-purple-600 bg-purple-900/20' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
              }`}>
              <div className="text-white font-medium text-sm">{t}</div>
              <div className="text-gray-400 text-xs mt-1">{data.summary[t]?.count ?? 0} arquivos</div>
              <div className="text-gray-500 text-xs">{fmtBytes(data.summary[t]?.size_bytes ?? 0)}</div>
            </button>
          ))}
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-3 mb-4">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              type === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {t}
          </button>
        ))}
        <button onClick={load} className="ml-auto bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm">↻</button>
        {orphans > 0 && (
          <button onClick={handleDeleteOrphans}
            className="bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-800/40 rounded-lg px-4 py-1.5 text-sm">
            🗑️ Deletar {orphans} órfão(s)
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Lista de arquivos */}
        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-sm text-gray-300">{data?.files.length ?? 0} arquivos</span>
            {orphans > 0 && <span className="text-xs text-orange-400">{orphans} órfão(s)</span>}
          </div>

          {loading && <div className="py-8 text-center text-gray-500">Carregando...</div>}

          <div className="divide-y divide-gray-800 max-h-[calc(100vh-380px)] overflow-y-auto">
            {!loading && data?.files.map(file => (
              <div key={file.name}
                onClick={() => setPreview(preview?.name === file.name ? null : file)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  preview?.name === file.name ? 'bg-purple-900/20' : 'hover:bg-gray-800/40'
                }`}>
                {type === 'images' || type === 'qrcodes' ? (
                  <img src={`${BASE_URL}/${file.path}`} alt="" className="w-10 h-10 rounded object-cover bg-gray-800" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-xl">
                    {type === 'audio' ? '🎙️' : '🔊'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{file.name}</div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{fmtBytes(file.size_bytes)}</span>
                    <span>{new Date(file.modified).toLocaleDateString('pt-BR')}</span>
                    {file.orphan && <span className="text-orange-400">⚠ órfão</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(file); }}
                  className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-900/20 transition-colors shrink-0">
                  🗑️
                </button>
              </div>
            ))}
            {!loading && data?.files.length === 0 && (
              <div className="py-12 text-center text-gray-500">Nenhum arquivo em /{type}</div>
            )}
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="w-72 bg-gray-900 rounded-xl border border-gray-800 p-4 shrink-0 self-start">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-200 truncate">{preview.name}</h3>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
            </div>

            {(type === 'images' || type === 'qrcodes') && (
              <img src={`${BASE_URL}/${preview.path}`} alt={preview.name}
                className="w-full rounded-lg object-cover mb-3" />
            )}
            {(type === 'audio' || type === 'narrations') && (
              <audio controls src={`${BASE_URL}/${preview.path}`} className="w-full mb-3" />
            )}

            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Tamanho</span><span>{fmtBytes(preview.size_bytes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Modificado</span><span>{new Date(preview.modified).toLocaleString('pt-BR')}</span>
              </div>
              {preview.orphan && (
                <div className="text-orange-400 bg-orange-900/20 rounded p-2 mt-2">
                  ⚠ Arquivo órfão — não referenciado no banco
                </div>
              )}
            </div>

            <a href={`${BASE_URL}/${preview.path}`} target="_blank" rel="noopener noreferrer"
              className="block mt-3 text-center text-xs text-purple-400 hover:underline">
              Abrir URL ↗
            </a>

            <button onClick={() => handleDelete(preview)}
              className="w-full mt-2 py-2 rounded-lg text-xs text-red-400 border border-red-800/40 hover:bg-red-900/20">
              🗑️ Deletar arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
