import { motion } from "framer-motion";
import { Sparkles, Heart, MessageCircle, Eye, Home, ArrowLeft, Share2, Gift } from "lucide-react";
import { playReveal } from "@/lib/sounds";
import { useEffect } from "react";

interface DreamInterpretation {
  title: string;
  emotion: string;
  symbols: string;
  emotions: string;
  message: string;
  thumbnailUrl: string;
}

interface DreamResultProps {
  interpretation: DreamInterpretation;
  onNewDream: () => void;
  onGoHome: () => void;
}

const DreamResult = ({ interpretation, onNewDream, onGoHome }: DreamResultProps) => {
  useEffect(() => {
    playReveal();
  }, []);

  const shareText = `🌙 Jerry interpretou meu sonho: "${interpretation.title}"\n\nDescubra o que seus sonhos significam em jerry.com.br`;
  const shareUrl = 'https://jerry.com.br';

  const handleShare = async (platform: string) => {
    const encoded = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
    };
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'Jerry - Entendendo seus sonhos', text: shareText, url: shareUrl });
      } catch {}
      return;
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen py-12 px-4 bg-gradient-mystic relative"
    >
      {/* Subtle star bg */}
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
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onGoHome}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-base font-display"
        >
          <ArrowLeft className="w-5 h-5" />
          Início
        </motion.button>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-display font-bold text-gradient-gold text-center mb-6"
        >
          ✨ Sua interpretação
        </motion.h2>

        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden mb-6 glow-purple"
        >
          <img
            src={interpretation.thumbnailUrl}
            alt={interpretation.title}
            className="w-full aspect-video object-cover"
          />
        </motion.div>

        <h3 className="text-2xl font-display font-semibold text-foreground mb-5 text-center">
          {interpretation.title}
        </h3>

        <div className="space-y-4">
          {/* Symbols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground text-base">Significados Simbólicos</h4>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">{interpretation.symbols}</p>
          </motion.div>

          {/* Emotions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-mystic" />
              <h4 className="font-display font-semibold text-foreground text-base">Emoções</h4>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">{interpretation.emotions}</p>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-gold-light" />
              <h4 className="font-display font-semibold text-foreground text-base">Possível Mensagem</h4>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">{interpretation.message}</p>
          </motion.div>

          {/* Donation / share card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="bg-gradient-card rounded-xl p-6 border border-primary/20 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />

            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <h4 className="font-display font-semibold text-foreground text-base">Ajude o Jerry 💛</h4>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Ajude-nos a manter esse serviço gratuito e a ajudar mais pessoas a entenderem seus sonhos. Faça uma doação para{" "}
              <span className="text-primary font-semibold">doar@jerry.com.br</span>{" "}
              ou compartilhe com alguém que precisa. ✨
            </p>

            {/* Share buttons */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(142_70%_35%)] text-foreground font-display text-sm font-semibold transition-all"
              >
                💬 WhatsApp
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-foreground font-display text-sm font-semibold border border-border transition-all"
              >
                𝕏 Twitter
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[hsl(220_60%_45%)] text-foreground font-display text-sm font-semibold transition-all"
              >
                📘 Facebook
              </motion.button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleShare('native')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground font-display text-sm font-semibold transition-all"
                >
                  <Share2 className="w-4 h-4" /> Compartilhar
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        <div className="flex gap-3 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoHome}
            className="flex-1 py-4 rounded-xl bg-secondary text-foreground font-display text-base font-semibold border border-border hover:border-primary/30 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Voltar ao início
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewDream}
            className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-display text-base font-semibold glow-gold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Novo sonho
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export default DreamResult;
