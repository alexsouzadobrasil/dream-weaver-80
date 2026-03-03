import { useEffect, useState, useCallback } from 'react';
import { getAdminSecret } from '../../lib/adminApi';

const API_BASE = 'https://jerry.com.br/api/admin';

interface UsageType {
  label: string;
  icon: string;
  total_tokens: number;
  total_requests: number;
  daily: { date: string; tokens: number; requests: number }[];
  error?: string;
}

interface OpenAIData {
  period: string;
  start_date: string;
  end_date: string;
  total_cost_cents: number;
  daily_costs: { date: string; cents: number }[];
  usage: Record<string, UsageType>;
  errors: Record<string, string> | null;
}

type Period = 'day' | 'week' | 'month';

function fmtUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AdminOpenAI() {
  const [data, setData]     = useState<OpenAIData | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/openai_usage.php?period=${period}`, {
        headers: { 'X-Admin-Secret': getAdminSecret() },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erro');
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const PERIOD_LABELS: Record<Period, string> = { day: 'Hoje', week: '7 dias', month: '30 dias' };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">OpenAI — Uso & Gastos</h1>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                period === p ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <button onClick={load} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">↻</button>
        </div>
      </div>

      {loading && <div className="text-gray-400 py-8">Consultando OpenAI Admin API...</div>}
      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-red-400 mb-6">
          <p className="font-medium">Erro ao consultar OpenAI Admin API</p>
          <p className="text-sm mt-1 text-red-300">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Período */}
          <p className="text-gray-500 text-xs mb-4">
            {data.start_date} → {data.end_date}
          </p>

          {/* Card principal de custo */}
          <div className="bg-gradient-to-br from-purple-900/40 to-gray-900 rounded-2xl border border-purple-800/30 p-6 mb-6">
            <div className="flex items-end gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Gasto total no período</p>
                <p className="text-4xl font-bold text-white">
                  {data.total_cost_cents > 0 ? fmtUSD(data.total_cost_cents) : '—'}
                </p>
                {data.total_cost_cents === 0 && (
                  <p className="text-gray-500 text-xs mt-1">Nenhum custo registrado (conta pode estar sem créditos ou sem chamadas)</p>
                )}
              </div>
              <div className="text-4xl ml-auto">💰</div>
            </div>

            {/* Gráfico de barras simples (CSS) */}
            {data.daily_costs.length > 0 && (
              <div className="mt-6">
                <p className="text-gray-500 text-xs mb-2">Gastos diários (USD)</p>
                <MiniBarChart
                  data={data.daily_costs.map(d => ({ label: d.date.slice(5), value: d.cents }))}
                  fmtValue={c => fmtUSD(c)}
                  color="bg-purple-500"
                />
              </div>
            )}
          </div>

          {/* Uso por modelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(data.usage).map(([key, u]) => (
              <div key={key} className={`bg-gray-900 rounded-xl border p-5 ${u.error ? 'border-red-800/40' : 'border-gray-800'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{u.icon}</span>
                  <div>
                    <h3 className="text-white font-medium text-sm">{u.label}</h3>
                    {u.error && <p className="text-red-400 text-xs">{u.error}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Requisições</p>
                    <p className="text-white text-xl font-bold">{fmtNum(u.total_requests)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{key === 'images' ? 'Imagens' : 'Tokens'}</p>
                    <p className="text-white text-xl font-bold">{fmtNum(u.total_tokens)}</p>
                  </div>
                </div>

                {u.daily.length > 0 && (
                  <MiniBarChart
                    data={u.daily.map(d => ({ label: d.date.slice(5), value: d.requests }))}
                    fmtValue={n => `${n} req`}
                    color={key === 'completions' ? 'bg-blue-500' : key === 'images' ? 'bg-green-500' : key === 'audio_speeches' ? 'bg-orange-500' : 'bg-teal-500'}
                  />
                )}
                {u.daily.length === 0 && !u.error && (
                  <p className="text-gray-600 text-xs">Sem chamadas no período</p>
                )}
              </div>
            ))}
          </div>

          {/* Erros da API admin */}
          {data.errors && Object.keys(data.errors).length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">⚠ Avisos da OpenAI Admin API</h3>
              {Object.entries(data.errors).map(([k, v]) => (
                <div key={k} className="text-xs text-yellow-300/70 mb-1">
                  <span className="font-mono text-yellow-500">{k}:</span> {v}
                </div>
              ))}
            </div>
          )}

          {/* Links úteis */}
          <div className="mt-6 flex gap-3">
            <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline">
              ↗ platform.openai.com/usage
            </a>
            <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline">
              ↗ Billing & Créditos
            </a>
            <a href="https://platform.openai.com/logs" target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline">
              ↗ API Logs
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function MiniBarChart({
  data, fmtValue, color,
}: {
  data: { label: string; value: number }[];
  fmtValue: (v: number) => string;
  color: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className={`w-full rounded-t ${color} opacity-70 group-hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max(2, (d.value / max) * 52)}px` }}
            title={`${d.label}: ${fmtValue(d.value)}`}
          />
          {data.length <= 10 && (
            <span className="text-gray-600 text-[9px] truncate w-full text-center">{d.label}</span>
          )}
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {d.label}: {fmtValue(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
