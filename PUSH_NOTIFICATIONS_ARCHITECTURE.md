# 📖 Jerry — Arquitetura Frontend (Lovable)

> **Base URL da API:** `https://api.jerry.com.br`
> **Versão da API:** 1.1
> **Última atualização:** 2026-03-03

---

## 🏗️ Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                      │
│  Lovable Preview / jerry.com.br                              │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐             │
│  │ DreamForm│→ │ dreamApi  │→ │ IndexedDB    │             │
│  │ (audio/  │  │ (fetch +  │  │ (offline     │             │
│  │  text)   │  │  retry)   │  │  queue)      │             │
│  └──────────┘  └───────────┘  └──────────────┘             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (credentials: include)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (PHP + MySQL)                      │
│  api.jerry.com.br                                            │
│                                                              │
│  Endpoints:                                                  │
│  ├── /api/auth/key.php          (GET)  → gera API Key       │
│  ├── /api/submit_dream.php      (POST) → recebe sonho       │
│  ├── /api/dream_status.php      (GET)  → status/polling     │
│  ├── /api/comments.php          (GET/POST/DELETE)            │
│  ├── /api/reactions.php         (GET/POST)                   │
│  ├── /api/tts.php               (POST) → gera áudio TTS     │
│  ├── /api/transcribe.php        (POST) → transcreve áudio   │
│  ├── /api/billing.php           (POST) → PIX AbacatePay     │
│  ├── /api/billing/status.php    (GET)  → status pagamento   │
│  ├── /api/push/subscribe.php    (POST)                       │
│  ├── /api/push/unsubscribe.php  (DELETE)                     │
│  └── /api/push/test.php         (POST)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação

- **Sem login/senha.** Cada dispositivo recebe uma API Key anônima via `GET /api/auth/key.php`.
- Armazenada em `localStorage` como `jerry_api_key`.
- Cookie `jerry_api_key` é definido automaticamente pela API.
- Todas as chamadas usam `credentials: 'include'` + header `X-Api-Key`.

### Implementação (`src/lib/dreamApi.ts`)

```typescript
async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 15000) {
  const apiKey = localStorage.getItem('jerry_api_key') ?? '';
  return fetchWithTimeout(`https://api.jerry.com.br/${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'X-Api-Key': apiKey, ...options.headers },
  }, timeoutMs);
}
```

---

## 📝 Formato de Resposta da API

Todas as respostas seguem o envelope:
```json
{ "success": true, "data": { ... }, "error": null, "code": null }
```

---

## 🌙 Endpoints Integrados

### Sonhos
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/key.php` | GET | Gera API Key anônima |
| `/api/submit_dream.php` | POST | Envia sonho (áudio `multipart/form-data` ou texto `application/json`) |
| `/api/dream_status.php?id=X` | GET | Polling de status (processing → interpreted → eligible → published) |
| `/api/tts.php` | POST | Text-to-Speech (máx 4096 chars, retorna `audio/mpeg`) |
| `/api/transcribe.php` | POST | Transcrição via Whisper (máx 25MB) |

### Social
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/comments.php?dream_id=X` | GET | Lista comentários (paginação cursor-based) |
| `/api/comments.php` | POST | Cria comentário (`dream_id`, `comment_text`, `author_name`) |
| `/api/comments.php?id=X` | DELETE | Soft delete (apenas autor) |
| `/api/reactions.php?dream_id=X` | GET | Contadores e reação do usuário |
| `/api/reactions.php` | POST | Toggle like/dislike |

### Doações (AbacatePay)
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/billing.php` | POST | Cria cobrança PIX (retorna QR Code, pix_copy_paste, payment_url) |
| `/api/billing/status.php?txid=X` | GET | Polling status pagamento (pending → confirmed) |

### Push Notifications
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/push/subscribe.php` | POST | Registra subscription Web Push |
| `/api/push/unsubscribe.php` | DELETE | Remove subscription |
| `/api/push/test.php` | POST | Envia notificação de teste |

---

## 📂 Estrutura do Frontend

### Páginas
- **`Index.tsx`** — Controla o fluxo: hero → form → loading → result

### Componentes Principais
- **`HeroSection.tsx`** — Tela inicial com animação cósmica e histórico de sonhos
- **`DreamForm.tsx`** — Formulário de envio (áudio ou texto)
- **`DreamResult.tsx`** — Tela de resultado/espera (push notifications + doação Pix)
- **`DreamComments.tsx`** — Comentários via API (`GET/POST/DELETE /api/comments.php`)
- **`EmojiReactions.tsx`** — Reações like/dislike via API (`GET/POST /api/reactions.php`)
- **`DreamHistoryCard.tsx`** — Card de sonho no histórico
- **`DreamDetailModal.tsx`** — Modal de detalhes do sonho
- **`AudioPlayButton.tsx`** — Botão play/pause para TTS

### Hooks
- **`usePushNotifications.ts`** — Gerencia registro/cancelamento de push subscription
- **`useOnlineStatus.ts`** — Detecta status online/offline

### Libs
- **`dreamApi.ts`** — Todas as chamadas à API (auth, sonhos, comentários, reações, billing, TTS, STT)
- **`audioStorage.ts`** — IndexedDB para áudios pendentes offline
- **`offlineQueue.ts`** — Fila de requisições offline
- **`sounds.ts`** — Efeitos sonoros da UI

### Service Worker
- **`public/sw.js`** — Recebe push notifications e gerencia cliques

---

## 💳 Fluxo de Doação (AbacatePay)

1. Usuário escolhe valor (R$5, R$10 ou R$25)
2. `POST /api/billing.php` com `{ amount_cents, dream_id, description }`
3. API retorna `{ qr_code_url, pix_copy_paste, payment_url, txid }`
4. Frontend exibe QR Code + botão "Copiar código PIX"
5. Polling: `GET /api/billing/status.php?txid=X` a cada 5s
6. Quando `status === 'confirmed'` → exibe feedback positivo

---

## 🔔 Push Notifications

### Fluxo
1. Na tela de espera, verifica `Notification.permission`
2. Se `default`: exibe prompt explicando os benefícios
3. Se aceito: registra Service Worker (`/sw.js`)
4. Cria subscription via `PushManager.subscribe()` com VAPID key
5. Envia subscription para `POST /api/push/subscribe.php`

### Tipos de notificação
| Tipo | Quando |
|------|--------|
| `dream_ready` | Interpretação pronta |
| `new_comment` | Novo comentário no sonho |
| `new_reaction` | Nova reação no sonho |
| `donation_confirmed` | Doação confirmada |
| `test` | Teste manual |

### ⚠️ Pendente
- Inserir `VAPID_PUBLIC_KEY` real em `src/hooks/usePushNotifications.ts`

---

## 🔄 Offline-First

- Áudios salvos localmente via IndexedDB (`audioStorage.ts`)
- Retry automático quando conexão volta (`retryPendingAudios` em `Index.tsx`)
- Textos pendentes em `localStorage` (`pending_text_dream`)
- Banner offline via `useOnlineStatus` hook

---

## 📱 Responsividade

- Mobile (360-480px): textos e botões escalados via `sm:` breakpoints
- Tablet/Desktop: layout ampliado progressivamente
- Safe area iOS: `padding-bottom: env(safe-area-inset-bottom)`
- `viewport-fit=cover` no `index.html`

---

## 🎨 Design System

- **Fonts:** Cinzel (display), Inter (body)
- **Palette:** Noite cósmica com tons de dourado, púrpura e azul profundo
- **Tokens CSS:** Definidos em `src/index.css` como variáveis HSL
- **Tailwind:** Configurado em `tailwind.config.ts` com cores semânticas
- **Animações:** Framer Motion para transições, estrelas, cometas, partículas cósmicas
