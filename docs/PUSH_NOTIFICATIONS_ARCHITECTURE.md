# 📖 Jerry — Arquitetura Completa da API (para Claude Code)

> **Este documento é a especificação técnica completa para implementar o backend PHP da API do Jerry.**
> Leia este arquivo inteiro antes de codificar qualquer endpoint.

---

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                       │
│  jerry.com.br / localhost                                    │
│                                                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐              │
│  │ DreamForm│→ │ dreamApi  │→ │ IndexedDB    │              │
│  │ (audio/  │  │ (fetch +  │  │ (offline     │              │
│  │  text)   │  │  retry)   │  │  queue)      │              │
│  └──────────┘  └───────────┘  └──────────────┘              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (PHP + MySQL)                      │
│  api.jerry.com.br                                            │
│                                                               │
│  Endpoints:                                                   │
│  ├── /api/auth/key.php          (GET)  → gera API Key        │
│  ├── /api/submit_dream.php      (POST) → recebe sonho        │
│  ├── /api/dream_status.php      (GET)  → status/polling      │
│  ├── /api/comments.php          (GET/POST/DELETE)             │
│  ├── /api/reactions.php         (GET/POST)                    │
│  ├── /api/tts.php               (POST) → gera áudio TTS      │
│  ├── /api/transcribe.php        (POST) → transcreve áudio     │
│  ├── /api/push/subscribe.php    (POST)                        │
│  ├── /api/push/unsubscribe.php  (DELETE)                      │
│  └── /api/push/test.php         (POST)                        │
│                                                               │
│  Serviços:                                                    │
│  ├── OpenAI Whisper (transcrição de áudio)                   │
│  ├── OpenAI GPT-4 (interpretação)                            │
│  ├── OpenAI DALL-E (imagem do sonho)                         │
│  ├── OpenAI TTS (text-to-speech para interpretações)         │
│  └── Web Push (notificações)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação

### Modelo
- **Sem login/senha.** Cada dispositivo recebe uma API Key anônima.
- A API Key é gerada pelo backend, exibida UMA VEZ, e armazenada no `localStorage` do frontend.
- No backend, armazene apenas o **hash SHA-256** da key para verificação.

### Fluxo de Verificação (todo endpoint protegido)

```php
// Pseudocódigo de verificação
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
if (!$apiKey) → 401 { "error": "API Key ausente", "code": "MISSING_API_KEY" }

$hash = hash('sha256', $apiKey);
$stmt = $pdo->prepare("SELECT id, active FROM api_keys WHERE key_hash = ?");
$stmt->execute([$hash]);
$row = $stmt->fetch();

if (!$row) → 401 { "error": "API Key inválida", "code": "INVALID_API_KEY" }
if (!$row['active']) → 401 { "error": "API Key desativada", "code": "INVALID_API_KEY" }
```

### Tabela `api_keys`

```sql
CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  fingerprint VARCHAR(64),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  INDEX(key_hash)
);
```

---

## 📝 Endpoints Detalhados

### 1. `GET /api/auth/key.php` — Gerar API Key

**Propósito:** Cria uma nova API Key anônima para o dispositivo.

**Lógica:**
1. Gerar 32 bytes aleatórios → converter para hex (64 chars)
2. Gerar fingerprint do dispositivo (8 bytes hex)
3. Armazenar `hash('sha256', $key)` no banco
4. Retornar a key em plaintext (única vez)

**Response 200:**
```json
{
  "success": true,
  "api_key": "a3f8c2d19e7b4056f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
  "fingerprint": "9f4e2a1b3c7d8e5f",
  "message": "Guarde esta API Key. Ela não será exibida novamente.",
  "instructions": "Envie o header X-Api-Key: <sua_chave> em todas as requisições."
}
```

---

### 2. `POST /api/submit_dream.php` — Enviar Sonho

**Aceita dois modos:**

#### Modo ÁUDIO (`multipart/form-data`)
- Campo: `audio` (file upload)
- Formatos: `mp3, wav, webm, ogg, m4a, flac, aac`
- Máximo: 25MB
- MIME types válidos: `audio/mpeg, audio/wav, audio/webm, audio/ogg, audio/mp4, audio/x-m4a, audio/flac, audio/aac`

**Lógica:**
1. Validar API Key
2. Validar arquivo (formato, tamanho)
3. Salvar em `/storage/audio/dream_{id}_{timestamp}.{ext}`
4. Inserir registro na tabela `dreams` com `status='processing'`, `input_mode='audio'`
5. **Transcrever via OpenAI Whisper API** (síncrono, antes de retornar)
6. Salvar transcrição no campo `transcription`
7. Disparar processamento assíncrono (GPT-4 interpretação + DALL-E imagem) via fila ou cron
8. Retornar `dream_id` + `transcription`

**Response 200:**
```json
{
  "success": true,
  "dream_id": 42,
  "input_mode": "audio",
  "transcription": "Eu estava voando sobre uma cidade...",
  "message": "Sonho recebido! A interpretação estará pronta em breve."
}
```

#### Modo TEXTO (`application/json`)
- Body: `{ "dream": "texto do sonho" }`
- Mínimo: 10 caracteres
- Máximo: 5000 caracteres

**Lógica:**
1. Validar API Key
2. Validar texto (tamanho)
3. Inserir registro com `status='processing'`, `input_mode='text'`
4. `transcription = null`
5. Disparar processamento assíncrono
6. Retornar `dream_id`

**Response 200:**
```json
{
  "success": true,
  "dream_id": 43,
  "input_mode": "text",
  "transcription": null,
  "message": "Sonho recebido! A interpretação estará pronta em breve."
}
```

---

### 3. `GET /api/dream_status.php?id=X` — Polling de Status

**Lógica:**
1. Validar API Key
2. Buscar sonho por `id` (verificar que pertence à API Key)
3. Retornar status atual

**Response 200 (processing):**
```json
{
  "id": 42,
  "status": "processing",
  "interpretation": null,
  "image_url": null,
  "input_mode": "audio",
  "created_at": "2025-02-28 14:32:01",
  "processed_at": null
}
```

**Response 200 (done):**
```json
{
  "id": 42,
  "status": "done",
  "interpretation": "Seu sonho revela uma jornada profunda...",
  "image_url": "https://api.jerry.com.br/storage/images/dream_42_1740747121.png",
  "input_mode": "audio",
  "created_at": "2025-02-28 14:32:01",
  "processed_at": "2025-02-28 14:33:47"
}
```

### Tabela `dreams`

```sql
CREATE TABLE dreams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_hash VARCHAR(64) NOT NULL,
  input_mode ENUM('audio', 'text') NOT NULL,
  dream_text TEXT,
  transcription TEXT,
  audio_path VARCHAR(500),
  status ENUM('processing', 'done', 'failed') DEFAULT 'processing',
  interpretation TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX(api_key_hash),
  INDEX(status)
);
```

---

### 4. `GET/POST/DELETE /api/comments.php` — Comentários

#### `GET /api/comments.php?dream_id=X`

**Response 200:**
```json
{
  "success": true,
  "comments": [
    {
      "id": 1,
      "dream_id": 42,
      "author_name": "Anônimo",
      "text": "Que sonho incrível!",
      "created_at": "2025-02-28 15:00:00",
      "is_mine": false
    }
  ]
}
```

#### `POST /api/comments.php`

**Body:**
```json
{
  "dream_id": 42,
  "text": "Que sonho incrível!",
  "author_name": "Anônimo"
}
```

**Lógica:**
1. Validar API Key
2. Validar `dream_id` existe
3. Validar `text` (1-1000 chars)
4. Inserir comentário
5. **Disparar push notification ao dono do sonho** (se diferente do autor)
6. Retornar comentário criado

**Response 200:**
```json
{
  "success": true,
  "comment": {
    "id": 5,
    "dream_id": 42,
    "text": "Que sonho incrível!",
    "author_name": "Anônimo",
    "created_at": "2025-02-28 15:00:00"
  }
}
```

#### `DELETE /api/comments.php?id=X`

Apenas o autor (mesma API Key) pode deletar.

**Response 200:**
```json
{ "success": true, "message": "Comentário removido." }
```

### Tabela `dream_comments`

```sql
CREATE TABLE dream_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dream_id INT NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL,
  author_name VARCHAR(100) DEFAULT 'Anônimo',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(dream_id),
  FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
);
```

---

### 5. `GET/POST /api/reactions.php` — Reações Emoji

#### `GET /api/reactions.php?dream_id=X`

**Response 200:**
```json
{
  "success": true,
  "reactions": {
    "❤️": 5,
    "😢": 2,
    "😮": 3,
    "🙏": 1,
    "✨": 8,
    "😨": 0
  },
  "my_reactions": ["❤️", "✨"]
}
```

#### `POST /api/reactions.php` — Toggle Reação

**Body:**
```json
{
  "dream_id": 42,
  "emoji": "❤️"
}
```

**Lógica (toggle):**
1. Verificar se já existe reação `(dream_id, api_key_hash, emoji)`
2. Se existe → DELETE (remove reação) → retornar `{ "action": "removed" }`
3. Se não existe → INSERT → retornar `{ "action": "added" }`
4. Se adicionou → disparar push ao dono do sonho

**Emojis permitidos:** `❤️, 😢, 😮, 🙏, ✨, 😨`

**Response 200:**
```json
{
  "success": true,
  "action": "added",
  "emoji": "❤️",
  "new_count": 6
}
```

### Tabela `dream_reactions`

```sql
CREATE TABLE dream_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dream_id INT NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (dream_id, api_key_hash, emoji),
  FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
);
```

---

### 6. Push Notifications

#### `POST /api/push/subscribe.php`

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRd...",
    "auth": "tBHI..."
  }
}
```

**Lógica:**
1. Validar API Key
2. Upsert na tabela `push_subscriptions` (endpoint como unique)
3. Retornar sucesso

#### `DELETE /api/push/unsubscribe.php`

**Body:** `{ "endpoint": "https://..." }`

#### `POST /api/push/test.php`

Envia uma notificação de teste ao próprio usuário.

### Tabela `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_hash VARCHAR(64) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_endpoint (endpoint(500)),
  INDEX(api_key_hash)
);
```

### Envio de Push (função interna)

```php
// Usar biblioteca: minishlink/web-push (composer)
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

function sendPushToUser(string $apiKeyHash, array $payload): void {
    $auth = [
        'VAPID' => [
            'subject' => 'mailto:contato@jerry.com.br',
            'publicKey' => VAPID_PUBLIC_KEY,
            'privateKey' => VAPID_PRIVATE_KEY,
        ],
    ];
    $webPush = new WebPush($auth);
    
    $subs = getPushSubscriptions($apiKeyHash); // query tabela
    foreach ($subs as $sub) {
        $webPush->queueNotification(
            Subscription::create([
                'endpoint' => $sub['endpoint'],
                'keys' => ['p256dh' => $sub['p256dh'], 'auth' => $sub['auth']],
            ]),
            json_encode($payload)
        );
    }
    $webPush->flush();
}
```

---

## 🚦 Códigos de Erro Padronizados

| HTTP | code | Quando usar |
|------|------|-------------|
| 401 | `MISSING_API_KEY` | Header `X-Api-Key` ausente |
| 401 | `INVALID_API_KEY` | Key não encontrada ou desativada |
| 403 | `ORIGIN_FORBIDDEN` | Origin não está na whitelist |
| 404 | `DREAM_NOT_FOUND` | Dream ID não existe ou não pertence ao user |
| 413 | `FILE_TOO_LARGE` | Áudio > 25MB |
| 422 | `INVALID_AUDIO` | Formato de áudio não suportado |
| 422 | `INVALID_INPUT` | Texto muito curto/longo ou campo obrigatório faltando |
| 422 | `INVALID_EMOJI` | Emoji não está na lista permitida |
| 422 | `TRANSCRIPTION_FAILED` | Whisper não conseguiu transcrever |
| 429 | `RATE_LIMIT_EXCEEDED` | Mais de 10 req/hora por API Key |
| 500 | `INTERNAL_ERROR` | Erro genérico do servidor |

**Formato padrão de erro:**
```json
{
  "error": "Mensagem legível em português",
  "code": "CODIGO_PADRONIZADO"
}
```

---

## 🔒 CORS

```php
$allowed = ['https://jerry.com.br', 'http://localhost'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Headers: X-Api-Key, Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
```

---

## ⏱️ Rate Limiting

- **10 requisições/hora** por API Key em `/api/submit_dream.php`
- Implementar com tabela ou Redis
- Retornar header `Retry-After` com segundos restantes

```sql
CREATE TABLE rate_limits (
  api_key_hash VARCHAR(64) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (api_key_hash, endpoint)
);
```

---

## 🤖 Processamento Assíncrono (GPT-4 + DALL-E)

### Interpretação (GPT-4)

```
System prompt sugerido:
"Você é um intérprete de sonhos profundo, inspirado em Jung, Freud e tradições místicas. 
Analise o sonho com empatia e profundidade. Identifique símbolos, arquétipos e possíveis 
mensagens do inconsciente. Responda em português brasileiro, com tom acolhedor e místico.
Limite: 500-800 palavras."

User prompt:
"Interprete este sonho: {dream_text ou transcription}"
```

### Imagem (DALL-E 3)

```
Prompt sugerido:
"Create a dreamlike, surreal, mystical digital art illustration of this dream: {resumo do sonho em inglês}. 
Style: ethereal, soft lighting, cosmic elements, watercolor meets digital art. 
Colors: deep purples, golds, and soft blues. No text."

Size: 1024x1024
Quality: standard
```

### Fluxo de processamento

```
1. Sonho inserido com status='processing'
2. Cron ou worker pega sonhos com status='processing'
3. Chama GPT-4 → salva interpretation
4. Chama DALL-E → salva imagem em /storage/images/ → salva image_url
5. Atualiza status='done', processed_at=NOW()
6. Se erro → status='failed'
```

---

## 🔊 TTS — Text-to-Speech (Geração de Áudio)

### `POST /api/tts.php` — Gerar áudio da interpretação

**Propósito:** Converte texto da interpretação em áudio MP3 para o usuário ouvir.

**Headers:** `X-Api-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "text": "Seu sonho revela uma jornada profunda..."
}
```

**Limites:**
- Máximo: **40.000 caracteres** por requisição
- Mínimo: 10 caracteres

**Lógica:**
1. Validar API Key
2. Validar texto (10-40000 chars)
3. Enviar para OpenAI TTS API (`tts-1` ou `tts-1-hd`)
4. Retornar o áudio MP3 como binary stream

**Implementação PHP:**
```php
<?php
require_once 'includes/auth.php';
require_once 'includes/cors.php';

$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';

if (strlen($text) < 10) {
    http_response_code(422);
    echo json_encode(['error' => 'Texto muito curto', 'code' => 'INVALID_INPUT']);
    exit;
}

if (strlen($text) > 40000) {
    http_response_code(422);
    echo json_encode(['error' => 'Texto excede o limite de 40.000 caracteres', 'code' => 'INVALID_INPUT']);
    exit;
}

$response = callOpenAI('https://api.openai.com/v1/audio/speech', [
    'model' => 'tts-1',
    'input' => $text,
    'voice' => 'nova',       // Vozes: alloy, echo, fable, onyx, nova, shimmer
    'response_format' => 'mp3',
    'speed' => 1.0
]);

header('Content-Type: audio/mpeg');
header('Content-Disposition: inline; filename="interpretation.mp3"');
echo $response;
```

**Response:** Binary MP3 audio stream (Content-Type: audio/mpeg)

**Erro:**
```json
{
  "error": "Erro ao gerar áudio",
  "code": "TTS_FAILED"
}
```

---

## 🎤 STT — Speech-to-Text (Transcrição Dedicada)

### `POST /api/transcribe.php` — Transcrever áudio em texto

**Propósito:** Endpoint dedicado para transcrição de áudio (separado do submit_dream para reuso).

**Headers:** `X-Api-Key`

**Body:** `multipart/form-data` com campo `audio`
- Formatos: `mp3, wav, webm, ogg, m4a, flac, aac`
- Máximo: 25MB

**Lógica:**
1. Validar API Key
2. Validar arquivo de áudio
3. Enviar para OpenAI Whisper API
4. Retornar transcrição

**Implementação PHP:**
```php
<?php
require_once 'includes/auth.php';
require_once 'includes/cors.php';

$audioFile = $_FILES['audio'] ?? null;
if (!$audioFile || $audioFile['error'] !== UPLOAD_ERR_OK) {
    http_response_code(422);
    echo json_encode(['error' => 'Arquivo de áudio inválido', 'code' => 'INVALID_AUDIO']);
    exit;
}

if ($audioFile['size'] > 25 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Arquivo excede 25MB', 'code' => 'FILE_TOO_LARGE']);
    exit;
}

$ch = curl_init('https://api.openai.com/v1/audio/transcriptions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . OPENAI_API_KEY,
    ],
    CURLOPT_POSTFIELDS => [
        'file' => new CURLFile($audioFile['tmp_name'], $audioFile['type'], $audioFile['name']),
        'model' => 'whisper-1',
        'language' => 'pt',
        'response_format' => 'json',
    ],
]);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(422);
    echo json_encode(['error' => 'Falha na transcrição', 'code' => 'TRANSCRIPTION_FAILED']);
    exit;
}

$data = json_decode($result, true);

echo json_encode([
    'success' => true,
    'transcription' => $data['text'] ?? '',
]);
```

**Response 200:**
```json
{
  "success": true,
  "transcription": "Eu estava voando sobre uma cidade..."
}
```

---

## 📁 Estrutura de Pastas (Backend)

```
api/
├── auth/
│   └── key.php
├── submit_dream.php
├── dream_status.php
├── comments.php
├── reactions.php
├── tts.php                 (text-to-speech)
├── transcribe.php          (speech-to-text)
├── push/
│   ├── subscribe.php
│   ├── unsubscribe.php
│   └── test.php
├── includes/
│   ├── db.php              (conexão PDO)
│   ├── auth.php            (validação API Key)
│   ├── cors.php            (headers CORS)
│   ├── rate_limit.php      (rate limiting)
│   └── push_sender.php     (envio de push)
├── workers/
│   └── process_dreams.php  (cron: interpreta sonhos)
storage/
├── audio/                  (arquivos de áudio)
└── images/                 (imagens geradas)
```

---

## 🔄 Offline-First (Frontend → Backend)

O frontend salva tudo localmente em IndexedDB antes de enviar. Se o envio falhar:

1. **Áudio**: Blob salvo em IndexedDB (`jerry_dreams` → `pending_audio`)
2. **Texto**: Salvo em `localStorage('pending_text_dream')`
3. **Reações/Comentários**: Salvos em IndexedDB (`jerry_offline` → `request_queue`)

Quando o dispositivo volta online:
1. Frontend detecta via `navigator.onLine` + eventos `online`/`offline`
2. Percorre a fila e reenvia cada item
3. Sucesso → remove da fila
4. Falha → incrementa `retries` (máx 5)

**O backend não precisa fazer nada especial para suportar offline** — ele recebe as mesmas requests normalmente. A resiliência está toda no frontend.

---

## 🔊 Função Helper OpenAI (includes/openai.php)

```php
<?php
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY'));

function callOpenAI(string $url, array $body, bool $binary = false) {
    $ch = curl_init($url);
    $headers = [
        'Authorization: Bearer ' . OPENAI_API_KEY,
        'Content-Type: application/json',
    ];
    
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_TIMEOUT => 120,
    ]);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("OpenAI API error: HTTP $httpCode");
    }
    
    return $binary ? $result : json_decode($result, true);
}
```

---

## 🥑 Doações via Pix (AbacatePay)

### `GET /api/donate.php` — Redirecionar para página de doação

**Propósito:** Cria uma cobrança Pix via AbacatePay e redireciona o usuário para a página de pagamento.

**Lógica:**
1. Criar cobrança via `POST https://api.abacatepay.com/v1/billing/create`
2. Redirecionar usuário para a `url` retornada

**Implementação PHP:**
```php
<?php
require_once 'includes/cors.php';

$ABACATEPAY_API_KEY = getenv('ABACATEPAY_API_KEY');

$payload = [
    'frequency' => 'ONE_TIME',
    'methods' => ['PIX'],
    'products' => [
        [
            'externalId' => 'donation-jerry',
            'name' => 'Doação Jerry - Entendendo seus sonhos',
            'description' => 'Doação voluntária para manter o serviço gratuito',
            'quantity' => 1,
            'price' => 500, // R$ 5,00 em centavos (valor sugerido)
        ]
    ],
    'returnUrl' => 'https://jerry.com.br',
    'completionUrl' => 'https://jerry.com.br?donated=true',
];

$ch = curl_init('https://api.abacatepay.com/v1/billing/create');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $ABACATEPAY_API_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($result, true);
    $paymentUrl = $data['data']['url'] ?? null;
    if ($paymentUrl) {
        header("Location: $paymentUrl");
        exit;
    }
}

// Fallback
header("Location: https://jerry.com.br?donation_error=true");
```

**Variáveis de ambiente necessárias:**
- `ABACATEPAY_API_KEY` — Chave API do AbacatePay (obter em https://abacatepay.com)

---

## ✅ Checklist de Implementação

- [ ] `GET /api/auth/key.php`
- [ ] `POST /api/submit_dream.php` (áudio + texto)
- [ ] `GET /api/dream_status.php`
- [ ] Worker de processamento (GPT-4 + DALL-E)
- [ ] `POST /api/tts.php` (text-to-speech, limite 40k chars)
- [ ] `POST /api/transcribe.php` (speech-to-text, Whisper)
- [ ] `GET /api/donate.php` (Pix via AbacatePay)
- [ ] `GET/POST/DELETE /api/comments.php`
- [ ] `GET/POST /api/reactions.php`
- [ ] `POST /api/push/subscribe.php`
- [ ] `DELETE /api/push/unsubscribe.php`
- [ ] `POST /api/push/test.php`
- [ ] Push sender (ao comentar/reagir)
- [ ] `includes/openai.php` (helper)
- [ ] Rate limiting
- [ ] CORS
- [ ] Tabelas MySQL
