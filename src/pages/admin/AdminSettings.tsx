import { useEffect, useState } from 'react';
import { getSettings, updateSetting, type Setting } from '../../lib/adminApi';

const SENSITIVE_KEYS = ['vapid_private_key', 'admin_secret'];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    getSettings().then(r => setSettings(r.settings)).finally(() => setLoading(false));
  }, []);

  async function handleSave(key: string) {
    setSaving(true);
    try {
      await updateSetting(key, editValue);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: editValue, updated_at: new Date().toISOString() } : s));
      setEditing(null);
      setSaved(key);
      setTimeout(() => setSaved(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: Setting) {
    setEditing(s.key);
    setEditValue(s.value);
  }

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-gray-500 text-sm mb-6">Tabela settings do banco de dados. Alterações entram em vigor imediatamente.</p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
        {settings.map(s => {
          const isProtected = SENSITIVE_KEYS.includes(s.key);
          const isEditing = editing === s.key;
          const wasSaved = saved === s.key;

          return (
            <div key={s.key} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-purple-400 text-sm font-mono">{s.key}</code>
                    {isProtected && <span className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-1.5 py-0.5">protegido</span>}
                    {wasSaved && <span className="text-xs text-green-400">✓ Salvo</span>}
                  </div>
                  {s.description && <p className="text-gray-500 text-xs mt-0.5">{s.description}</p>}
                  <p className="text-gray-600 text-xs mt-0.5">Atualizado: {new Date(s.updated_at).toLocaleString('pt-BR')}</p>
                </div>

                {!isEditing && !isProtected && (
                  <button onClick={() => startEdit(s)}
                    className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-3 py-1 transition-colors shrink-0">
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 bg-gray-800 border border-purple-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleSave(s.key)} disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">
                    {saving ? '...' : 'Salvar'}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg px-3 py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <div className={`text-sm font-mono rounded px-3 py-1.5 ${isProtected ? 'text-gray-600 bg-gray-800/30' : 'text-gray-300 bg-gray-800/60'}`}>
                    {isProtected ? '••••••••••••' : (s.value.length > 120 ? s.value.slice(0, 120) + '...' : s.value || '(vazio)')}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {settings.length === 0 && (
          <div className="p-8 text-center text-gray-500">Nenhuma configuração na tabela settings.</div>
        )}
      </div>
    </div>
  );
}
