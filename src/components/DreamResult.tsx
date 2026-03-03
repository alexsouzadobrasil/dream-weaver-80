import { motion } from "framer-motion";
import { Sparkles, Heart, Eye, ArrowLeft, Share2, Gift, MessageCircle, WifiOff, RefreshCw, Bell, BellOff, Copy, Check } from "lucide-react";
import { playReveal, playClick } from "@/lib/sounds";
import { useEffect, useState, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { createBilling, pollBillingStatus, type BillingResponse } from "@/lib/dreamApi";
import EmojiReactions from "./EmojiReactions";
import DreamComments from "./DreamComments";
import AudioPlayButton from "./AudioPlayButton";
import { toast } from "sonner";

interface DreamInterpretation {
  title: string;
  emotion: string;
  symbols: string;
  emotions: string;
  message: string;
  thumbnailUrl: string;
  dreamId?: string;
  isWaiting?: boolean;
}

interface DreamResultProps {
  interpretation: DreamInterpretation;
  onNewDream: () => void;
  onGoHome: () => void;
}

const DONATION_AMOUNTS = [
  { label: 'R$ 5', cents: 500 },
  { label: 'R$ 10', cents: 1000 },
  { label: 'R$ 25', cents: 2500 },
];

const DreamResult = ({ interpretation, onNewDream, onGoHome }: DreamResultProps) => {
  const online = useOnlineStatus();
  const dreamId = interpretation.dreamId || interpretation.title.slice(0, 20);
  const { status: pushStatus, subscribe: subscribePush } = usePushNotifications();
  const [pixData, setPixData] = useState<BillingResponse | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [billingStatus, setBillingStatus] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const pollingRef = useRef(false);

  const isWaiting = interpretation.isWaiting || (!interpretation.symbols && !online);

  useEffect(() => {
    if (!isWaiting) playReveal();
  }, [isWaiting]);

  const handleRequestPush = async () => {
    playClick();
    const success = await subscribePush();
    if (success) {
      toast.success('Notificações ativadas!');
    }
  };

  const loadPixData = async (amountCents: number) => {
    setLoadingPix(true);
    setPixData(null);
    setBillingStatus(null);
    try {
      const numDreamId = parseInt(dreamId, 10);
      const data = await createBilling(
        amountCents,
        isNaN(numDreamId) ? undefined : numDreamId,
        'Apoio voluntário ao Jerry'
      );
      setPixData(data);
      // Start polling for payment status
      startStatusPolling(data.txid);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar QR Code');
    } finally {
      setLoadingPix(false);
    }
  };

  const startStatusPolling = async (txid: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const status = await pollBillingStatus(txid);
      setBillingStatus(status);
      if (status === 'confirmed') {
        toast.success('Doação confirmada! Muito obrigado! 💛');
      }
    } catch {
      setBillingStatus('error');
    } finally {
      pollingRef.current = false;
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.pix_copy_paste) return;
    playClick();
    try {
      await navigator.clipboard.writeText(pixData.pix_copy_paste);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch {}
  };

  const shareText = `🌙 Jerry interpretou meu sonho: "${interpretation.title}"\n\nDescubra o que seus sonhos significam em jerry.com.br`;
  const shareUrl = 'https://jerry.com.br';

  const handleShare = async (platform: string) => {
    playClick();
    const encoded = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
    };
    if (platform === 'native' && navigator.share) {
      try { await navigator.share({ title: 'Jerry - Entendendo seus sonhos', text: shareText, url: shareUrl }); } catch {}
      return;
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen py-8 px-4 bg-gradient-mystic relative safe-area-bottom"
    >
      {/* Stars bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-foreground"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 3 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onGoHome}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm font-display"
        >
          <ArrowLeft className="w-4 h-4" />
          Início
        </motion.button>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-display font-bold text-gradient-gold text-center mb-4"
        >
          {isWaiting ? "⏳ Aguardando resposta" : "✨ Sua interpretação"}
        </motion.h2>

        {/* Waiting state */}
        {isWaiting && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-card rounded-xl p-6 border border-primary/20 mb-4 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-3"
              >
                {online ? <RefreshCw className="w-8 h-8 text-primary" /> : <WifiOff className="w-8 h-8 text-muted-foreground" />}
              </motion.div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {interpretation.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {online
                  ? "Seu sonho está sendo processado. A interpretação estará pronta em breve."
                  : "Sem conexão no momento. Seu sonho foi salvo com segurança e será enviado automaticamente quando a conexão voltar."}
              </p>
              <p className="text-xs text-muted-foreground mt-3 opacity-60">
                🔒 Seu áudio está salvo localmente — nenhum sonho será perdido.
              </p>
            </motion.div>

            {/* Push notification prompt */}
            {pushStatus !== 'unsupported' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-card rounded-xl p-5 border border-border mb-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h4 className="font-display font-semibold text-foreground text-sm">Notificações</h4>
                </div>
                {pushStatus === 'granted' ? (
                  <p className="text-sm text-muted-foreground">
                    ✅ Notificações ativadas! Você será avisado quando sua interpretação estiver pronta.
                  </p>
                ) : pushStatus === 'denied' ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <BellOff className="w-3.5 h-3.5 inline mr-1" />
                      Notificações bloqueadas. Para ativá-las:
                    </p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">
                      Acesse as configurações do navegador → Permissões → Notificações → Permitir para este site.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      Receba um aviso quando sua interpretação estiver pronta e quando alguém comentar no seu sonho.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRequestPush}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Ativar notificações
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pix donation with AbacatePay billing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="bg-gradient-card rounded-xl p-5 border border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-primary" />
                <h4 className="font-display font-semibold text-foreground text-sm">Ajude o Jerry 💛</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Ajude-nos a manter esse serviço gratuito com uma doação via Pix. ✨
              </p>

              {billingStatus === 'confirmed' ? (
                <div className="text-center py-4">
                  <p className="text-lg mb-1">💛</p>
                  <p className="text-sm font-display font-semibold text-foreground">Obrigado pela sua doação!</p>
                  <p className="text-xs text-muted-foreground mt-1">Sua contribuição nos ajuda a continuar.</p>
                </div>
              ) : !pixData && !loadingPix ? (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    {DONATION_AMOUNTS.map(({ label, cents }) => (
                      <button
                        key={cents}
                        onClick={() => { playClick(); setSelectedAmount(cents); }}
                        className={`px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all ${
                          selectedAmount === cents
                            ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                            : 'bg-secondary text-muted-foreground border border-border/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => loadPixData(selectedAmount)}
                    className="flex w-full py-3 rounded-xl bg-accent text-accent-foreground font-display font-semibold text-sm items-center justify-center gap-2 transition-all"
                  >
                    <span className="text-lg">🥑</span>
                    Gerar QR Code Pix
                  </motion.button>
                </div>
              ) : loadingPix ? (
                <div className="flex justify-center py-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                </div>
              ) : pixData ? (
                <div className="space-y-4">
                  {pixData.qr_code_url && (
                    <div className="flex justify-center">
                      <div className="bg-foreground p-3 rounded-xl">
                        <img
                          src={pixData.qr_code_url}
                          alt="QR Code Pix"
                          className="w-40 h-40 md:w-48 md:h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {pixData.pix_copy_paste && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-xs text-muted-foreground font-mono truncate border border-border/40">
                        {pixData.pix_copy_paste}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyPix}
                        className="shrink-0 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-xs font-semibold flex items-center gap-1.5"
                      >
                        {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {pixCopied ? "Copiado!" : "Copiar"}
                      </motion.button>
                    </div>
                  )}
                  {pixData.payment_url && (
                    <a
                      href={pixData.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs text-primary underline font-display"
                    >
                      Ou pague pelo site do AbacatePay →
                    </a>
                  )}
                  {billingStatus === 'expired' && (
                    <p className="text-xs text-destructive text-center">Tempo expirado. Gere um novo QR Code.</p>
                  )}
                </div>
              ) : null}
            </motion.div>
          </>
        )}

        {/* ─── RESULT STATE ─── */}
        {!isWaiting && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl overflow-hidden mb-4 glow-purple"
            >
              <img
                src={interpretation.thumbnailUrl}
                alt={interpretation.title}
                className="w-full aspect-video object-cover"
              />
            </motion.div>

            <h3 className="text-lg font-display font-semibold text-foreground mb-1 text-center">
              {interpretation.title}
            </h3>

            <div className="flex justify-center mb-4">
              <EmojiReactions dreamId={dreamId} />
            </div>

            <div className="space-y-3">
              {interpretation.symbols && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-gradient-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <h4 className="font-display font-semibold text-foreground text-sm flex-1">Significados Simbólicos</h4>
                    <AudioPlayButton text={interpretation.symbols} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.symbols}</p>
                  <DreamComments dreamId={dreamId} />
                </motion.div>
              )}

              {interpretation.emotions && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="bg-gradient-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-accent" />
                    <h4 className="font-display font-semibold text-foreground text-sm">Emoções</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.emotions}</p>
                </motion.div>
              )}

              {interpretation.message && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="bg-gradient-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <h4 className="font-display font-semibold text-foreground text-sm">Possível Mensagem</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.message}</p>
                </motion.div>
              )}

              {/* Donation + share card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                className="bg-gradient-card rounded-xl p-4 border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-primary" />
                  <h4 className="font-display font-semibold text-foreground text-sm">Ajude o Jerry 💛</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Ajude-nos a manter esse serviço gratuito e compartilhe seu sonho. ✨
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => loadPixData(500)}
                  className="flex w-full mb-3 py-3 rounded-xl bg-accent text-accent-foreground font-display font-semibold text-sm items-center justify-center gap-2 transition-all"
                >
                  <span className="text-lg">🥑</span>
                  Doar via Pix
                </motion.button>
                <div className="flex flex-wrap gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-display text-xs font-semibold">
                    💬 WhatsApp
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShare('twitter')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground font-display text-xs font-semibold border border-border">
                    𝕏 Twitter
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShare('facebook')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground font-display text-xs font-semibold border border-border">
                    📘 Facebook
                  </motion.button>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleShare('native')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-display text-xs font-semibold">
                      <Share2 className="w-3 h-3" /> Mais
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default DreamResult;
