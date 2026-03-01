const API_BASE = 'https://api.jerry.com.br';

// Timeout wrapper for fetch requests
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo de conexão esgotado. Verifique sua internet.')), timeoutMs)
    ),
  ]);
}

export async function getApiKey(): Promise<string> {
  let key = localStorage.getItem('dreamapp_key');
  if (key) return key;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/auth/key.php`);
    if (!res.ok) throw new Error('Falha ao obter API Key');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao obter chave');
    localStorage.setItem('dreamapp_key', data.api_key);
    return data.api_key;
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('Tempo de conexão')) {
      throw new Error('Sem conexão com o servidor. Seu sonho será salvo localmente.');
    }
    throw err;
  }
}

export async function submitAudio(audioBlob: Blob): Promise<{ dream_id: number; transcription: string | null }> {
  const apiKey = await getApiKey();
  const formData = new FormData();
  formData.append('audio', audioBlob, 'dream.webm');

  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/submit_dream.php`, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    }, 30000); // 30s for audio uploads

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao enviar áudio' }));
      throw new Error(err.error || 'Erro ao enviar sonho');
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao enviar sonho');
    return { dream_id: data.dream_id, transcription: data.transcription };
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('Tempo de conexão')) {
      throw new Error('Sem conexão com o servidor. Seu áudio foi salvo localmente.');
    }
    throw err;
  }
}

export async function submitText(dreamText: string): Promise<{ dream_id: number }> {
  const apiKey = await getApiKey();
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/submit_dream.php`, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: dreamText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao enviar texto' }));
      throw new Error(err.error || 'Erro ao enviar sonho');
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao enviar sonho');
    return { dream_id: data.dream_id };
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('Tempo de conexão')) {
      throw new Error('Sem conexão com o servidor. Seu sonho foi salvo localmente.');
    }
    throw err;
  }
}

export interface DreamStatusResponse {
  id: number;
  status: 'processing' | 'done' | 'failed';
  interpretation: string | null;
  image_url: string | null;
  input_mode: string;
  created_at: string;
  processed_at: string | null;
}

export async function pollDreamStatus(
  dreamId: number,
  onUpdate?: (data: DreamStatusResponse) => void
): Promise<DreamStatusResponse> {
  const apiKey = await getApiKey();
  let failCount = 0;
  const MAX_FAILS = 3;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/dream_status.php?id=${dreamId}`, {
          headers: { 'X-Api-Key': apiKey },
        }, 10000);
        const data: DreamStatusResponse = await res.json();
        failCount = 0; // Reset on success
        onUpdate?.(data);

        if (data.status === 'done') {
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
