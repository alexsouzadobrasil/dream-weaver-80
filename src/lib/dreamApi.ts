const API_BASE = 'https://api.jerry.com.br';

export async function getApiKey(): Promise<string> {
  let key = localStorage.getItem('dreamapp_key');
  if (key) return key;

  const res = await fetch(`${API_BASE}/api/auth/key.php`);
  if (!res.ok) throw new Error('Falha ao obter API Key');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erro ao obter chave');
  localStorage.setItem('dreamapp_key', data.api_key);
  return data.api_key;
}

export async function submitAudio(audioBlob: Blob): Promise<{ dream_id: number; transcription: string | null }> {
  const apiKey = await getApiKey();
  const formData = new FormData();
  formData.append('audio', audioBlob, 'dream.webm');

  const res = await fetch(`${API_BASE}/api/submit_dream.php`, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao enviar áudio' }));
    throw new Error(err.error || 'Erro ao enviar sonho');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erro ao enviar sonho');
  return { dream_id: data.dream_id, transcription: data.transcription };
}

export async function submitText(dreamText: string): Promise<{ dream_id: number }> {
  const apiKey = await getApiKey();
  const res = await fetch(`${API_BASE}/api/submit_dream.php`, {
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

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dream_status.php?id=${dreamId}`, {
          headers: { 'X-Api-Key': apiKey },
        });
        const data: DreamStatusResponse = await res.json();
        onUpdate?.(data);

        if (data.status === 'done') {
          clearInterval(interval);
          resolve(data);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error('Processamento do sonho falhou'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 5000);
  });
}
