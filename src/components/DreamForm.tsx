import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

interface DreamFormProps {
  onSubmit: (dreamText: string) => void;
  isLoading: boolean;
}

const DreamForm = ({ onSubmit, isLoading }: DreamFormProps) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20 px-4"
      id="dream-form"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold text-center mb-2">
          Conte seu sonho
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          Descreva com o máximo de detalhes possível
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descrição do sonho
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descreva tudo que você lembra do sonho..."
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              required
            />
            <span className="text-xs text-muted-foreground mt-1 block text-right">
              {text.length}/2000
            </span>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !text.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-gold transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Interpretando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar sonho
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.section>
  );
};

export default DreamForm;
