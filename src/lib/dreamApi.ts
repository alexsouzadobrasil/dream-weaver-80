const API_BASE = 'https://api.jerry.com.br';

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo de conexão esgotado. Verifique sua internet.')), timeoutMs)
    ),
  ]);
}

async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const apiKey = localStorage.getItem('jerry_api_key') ?? '';
  return fetchWithTimeout(`${API_BASE}/${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'X-Api-Key': apiKey,
      ...options.headers,
    },
  }, timeoutMs);
}

function handleNetworkError(err: any, fallbackMsg: string): never {
  if (err.message.includes('Failed to fetch') || err.message.includes('Tempo de conexão')) {
    throw new Error(fallbackMsg);
  }
  throw err;
}

export async function getApiKey(): Promise<string> {
  let key = localStorage.getItem('jerry_api_key');
  if (key) return key;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/auth/key.php`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Falha ao obter API Key');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao obter chave');
    const apiKey = json.data.api_key;
    localStorage.setItem('jerry_api_key', apiKey);
    return apiKey;
  } catch (err: any) {
    return handleNetworkError(err, 'Sem conexão com o servidor. Seu sonho será salvo localmente.');
  }
}

export async function submitAudio(audioBlob: Blob): Promise<{ dream_id: number; transcription: string | null }> {
  await getApiKey();
  const formData = new FormData();
  formData.append('audio', audioBlob, 'dream.webm');

  try {
    const res = await apiFetch('api/submit_dream.php', {
      method: 'POST',
      body: formData,
    }, 30000);

    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao enviar sonho');
    return { dream_id: json.data.dream_id, transcription: json.data.transcription ?? null };
  } catch (err: any) {
    return handleNetworkError(err, 'Sem conexão com o servidor. Seu áudio foi salvo localmente.');
  }
}

export async function submitText(dreamText: string): Promise<{ dream_id: number }> {
  await getApiKey();
  try {
    const res = await apiFetch('api/submit_dream.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: dreamText }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Erro ao enviar sonho');
    return { dream_id: json.data.dream_id };
  } catch (err: any) {
    return handleNetworkError(err, 'Sem conexão com o servidor. Seu sonho foi salvo localmente.');
  }
}

export interface DreamStatusResponse {
  id: number;
  input_mode: string;
  dream_text: string | null;
  transcription: string | null;
  interpretation: string | null;
  image_path: string | null;
  narration_audio_path: string | null;
  status: 'processing' | 'interpreted' | 'eligible' | 'published' | 'failed';
  total_comments: number;
  total_reactions: number;
  positive_reactions: number;
  created_at: string;
  processed_at: string | null;
}

export async function pollDreamStatus(
  dreamId: number,
  onUpdate?: (data: DreamStatusResponse) => void
): Promise<DreamStatusResponse> {
  await getApiKey();
  let failCount = 0;
  const MAX_FAILS = 3;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`api/dream_status.php?id=${dreamId}`, {}, 10000);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Erro ao consultar status');
        const data: DreamStatusResponse = json.data.dream;
        failCount = 0;
        onUpdate?.(data);

        if (data.status === 'interpreted' || data.status === 'eligible' || data.status === 'published') {
          clearInterval(interval);
          resolve(data);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error('Processamento do sonho falhou'));
        }
      } catch (err) {
        failCount++;
        if (failCount >= MAX_FAILS) {
          clearInterval(interval);
          reject(new Error('Conexão perdida durante o processamento. Seu sonho está seguro.'));
        }
      }
    }, 5000);
  });
}

// ─── TTS: Gerar áudio da interpretação ───
export async function generateInterpretationAudio(text: string): Promise<Blob> {
  await getApiKey();
  const truncated = text.slice(0, 4096);

  try {
    const res = await apiFetch('api/tts.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: truncated }),
    }, 60000);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao gerar áudio' }));
      throw new Error(err.error || 'Erro ao gerar áudio da interpretação');
    }
    return await res.blob();
  } catch (err: any) {
    return handleNetworkError(err, 'Sem conexão. Não foi possível gerar o áudio.');
  }
}

// ─── STT: Transcrever áudio em texto ───
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  await getApiKey();
  const formData = new FormData();
  formData.append('audio', audioBlob, 'dream.webm');

  try {
    const res = await apiFetch('api/transcribe.php', {
      method: 'POST',
      body: formData,
    }, 30000);

    const json = await res.json();
    if (!json.success && json.error) throw new Error(json.error);
    return json.data.transcription;
  } catch (err: any) {
    return handleNetworkError(err, 'Sem conexão. Não foi possível transcrever o áudio.');
  }
}

// ─── Comments API ───
export interface ApiComment {
  id: number;
  dream_id: number;
  author_name: string;
  comment_text: string;
  created_at: string;
  is_mine: boolean;
}

export async function fetchComments(dreamId: number, afterId?: number): Promise<{
  comments: ApiComment[];
  total: number;
  has_more: boolean;
  next_cursor: number | null;
}> {
  await getApiKey();
  let url = `api/comments.php?dream_id=${dreamId}&limit=50`;
  if (afterId) url += `&after_id=${afterId}`;
  const res = await apiFetch(url);
  const json = await res.json();
  if (!json.success && json.error) throw new Error(json.error);
  return {
    comments: json.data.comments,
    total: json.data.total,
    has_more: json.data.pagination.has_more,
    next_cursor: json.data.pagination.next_cursor,
  };
}

export async function postComment(dreamId: number, text: string, authorName = 'Anônimo'): Promise<ApiComment> {
  await getApiKey();
  const res = await apiFetch('api/comments.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dream_id: dreamId, comment_text: text, author_name: authorName }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro ao comentar');
  return json.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await getApiKey();
  const res = await apiFetch(`api/comments.php?id=${commentId}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro ao deletar comentário');
}

// ─── Reactions API ───
export interface ReactionResponse {
  action: 'added' | 'removed' | 'changed';
  reaction_type: 'like' | 'dislike';
  total_reactions: number;
  positive_reactions: number;
  my_reaction: string | null;
}

export async function toggleReaction(dreamId: number, reactionType: 'like' | 'dislike'): Promise<ReactionResponse> {
  await getApiKey();
  const res = await apiFetch('api/reactions.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dream_id: dreamId, reaction_type: reactionType }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro ao reagir');
  return json.data;
}

export async function fetchReactions(dreamId: number): Promise<{
  total_reactions: number;
  positive_reactions: number;
  my_reaction: string | null;
}> {
  await getApiKey();
  const res = await apiFetch(`api/reactions.php?dream_id=${dreamId}`);
  const json = await res.json();
  if (!json.success && json.error) throw new Error(json.error);
  return json.data;
}

// ─── Billing (AbacatePay) ───
export interface BillingResponse {
  donation_id: number;
  txid: string;
  amount: string;
  payment_url: string;
  qr_code_url: string;
  pix_copy_paste: string;
  dream_id: number | null;
  status: string;
  mock: boolean;
}

export async function createBilling(
  amountCents?: number,
  dreamId?: number,
  description?: string,
): Promise<BillingResponse> {
  const body: Record<string, any> = {};
  if (amountCents) body.amount_cents = amountCents;
  if (dreamId) body.dream_id = dreamId;
  if (description) body.description = description;

  const res = await apiFetch('api/billing.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro ao criar cobrança');
  return json.data;
}

export async function pollBillingStatus(txid: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const res = await fetchWithTimeout(`${API_BASE}/api/billing/status.php?txid=${txid}`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (json.data.status !== 'pending') return json.data.status;
    if (json.data.is_expired) return 'expired';
    await new Promise(r => setTimeout(r, 5000));
  }
  return 'timeout';
}

// Helper: build full URL for API-relative paths (e.g. image_path, narration_audio_path)
export function apiAssetUrl(relativePath: string): string {
  return `${API_BASE}/${relativePath}`;
}
