# 📱 Jerry — Push Notifications, Comentários & Offline Architecture

## Visão Geral

O Jerry implementa um sistema de notificações push, comentários em sonhos e reações com emoji, tudo com suporte offline-first.

---

## 1. Push Notifications (Web Push API)

### Fluxo de registro

```
1. Usuário abre o app → solicita permissão de notificação
2. Se aceito → navigator.serviceWorker.register('sw.js')
3. SW registrado → PushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
4. Endpoint de push obtido → POST /api/push/subscribe.php
   Body: { endpoint, keys: { p256dh, auth }, api_key }
5. Backend salva a subscription no banco (tabela push_subscriptions)
```

### Envio de notificações (Backend → Usuário)

```
1. Outro usuário comenta ou reage a um sonho
2. Backend identifica o dono do sonho
3. Backend busca push_subscriptions do dono
4. Backend envia web-push via biblioteca (ex: web-push PHP/Node)
   Payload: { title: "Jerry", body: "Alguém reagiu ao seu sonho ❤️", data: { dream_id: 42 } }
5. Service Worker recebe evento 'push' e exibe Notification
6. Ao clicar → abre /dream/42
```

### Endpoints necessários na API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/push/subscribe.php` | Registra subscription do push |
| DELETE | `/api/push/unsubscribe.php` | Remove subscription |
| POST | `/api/push/test.php` | Envia notificação de teste |

### Estrutura do banco (sugestão)

```sql
CREATE TABLE push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_hash VARCHAR(64) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint(500))
);
```

---

## 2. Comentários em Sonhos

### Fluxo

```
1. Usuário abre interpretação de um sonho (próprio ou público)
2. Área de comentários carrega via GET /api/comments.php?dream_id=42
3. Usuário digita comentário → POST /api/comments.php
   Body: { dream_id: 42, text: "Que sonho incrível!" }
4. Backend salva e dispara push notification ao dono do sonho
5. Frontend atualiza lista de comentários
```

### Endpoints necessários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/comments.php?dream_id=X` | Lista comentários de um sonho |
| POST | `/api/comments.php` | Adiciona comentário |
| DELETE | `/api/comments.php?id=X` | Remove comentário (próprio) |

### Estrutura do banco

```sql
CREATE TABLE dream_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dream_id INT NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL,
  author_name VARCHAR(100) DEFAULT 'Anônimo',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(dream_id)
);
```

---

## 3. Reações com Emoji

### Fluxo

```
1. Usuário clica em emoji (❤️, 😢, 😮, 🙏, ✨, 😨)
2. POST /api/reactions.php
   Body: { dream_id: 42, emoji: "❤️" }
3. Backend faz toggle (adiciona/remove)
4. Se adicionou → dispara push ao dono
5. Frontend atualiza contagem
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/reactions.php?dream_id=X` | Contagem de reações |
| POST | `/api/reactions.php` | Toggle reação |

### Estrutura do banco

```sql
CREATE TABLE dream_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dream_id INT NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dream_id, api_key_hash, emoji)
);
```

---

## 4. Sistema Offline-First

### Arquitetura

O app usa **IndexedDB** para manter uma fila de requisições quando offline:

```
┌──────────────┐     ┌────────────────┐     ┌─────────┐
│   UI Action  │ ──→ │  Offline Queue │ ──→ │   API   │
│ (comment,    │     │  (IndexedDB)   │     │ Backend │
│  reaction,   │     │                │     │         │
│  audio)      │     │  Syncs when    │     │         │
│              │     │  online        │     │         │
└──────────────┘     └────────────────┘     └─────────┘
```

### Detecção de conectividade

```javascript
// Eventos nativos do navegador
window.addEventListener('online', syncQueue);
window.addEventListener('offline', showBanner);
```

### Fila de requisições (IndexedDB)

```javascript
// Estrutura do registro
{
  id: auto,
  type: 'audio' | 'text' | 'reaction' | 'comment',
  payload: { dream_id, text, emoji, blob_key },
  createdAt: ISO string,
  retries: 0,
  status: 'pending' | 'processing' | 'failed'
}
```

### Sync automático

1. Ao detectar `online` → percorre fila de `pending`
2. Tenta enviar cada requisição
3. Sucesso → remove da fila
4. Falha → incrementa `retries` (máx 5)
5. Após 5 falhas → marca como `failed`

### UX Offline

- **Banner fixo no topo** quando offline: "Sem conexão — seus dados estão sendo salvos"
- **Reações/comentários** salvam localmente e aparecem imediatamente
- **Envio de sonho** salva áudio em IndexedDB e mostra "Aguardando conexão para enviar"
- **Interpretação** mostra "Aguardando resposta..." até reconectar
- **Ao reconectar** → toast de sucesso + sincronização automática

---

## 5. Service Worker (futuro)

Para push notifications funcionar, será necessário um Service Worker:

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Jerry', {
      body: data.body || 'Novidade no seu sonho!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const dreamId = event.notification.data?.dream_id;
  event.waitUntil(
    clients.openWindow(dreamId ? `/?dream=${dreamId}` : '/')
  );
});
```

---

## 6. Prioridade de Implementação

| Fase | Feature | Depende de |
|------|---------|------------|
| ✅ 1 | Reações emoji (local) | Nada |
| ✅ 1 | Comentários (local) | Nada |
| ✅ 1 | Offline queue | Nada |
| ✅ 1 | Banner offline | Nada |
| 🔜 2 | API de comentários | Backend |
| 🔜 2 | API de reações | Backend |
| 🔜 3 | Service Worker | Backend |
| 🔜 3 | Push subscribe | Backend + VAPID keys |
| 🔜 3 | Push send | Backend + web-push lib |

> Fase 1 está implementada no frontend. Fases 2 e 3 dependem dos endpoints da API `api.jerry.com.br`.
