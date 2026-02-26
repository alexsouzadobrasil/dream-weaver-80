import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

interface DreamFormProps {
  onSubmit: (dream: { title: string; text: string; emotion: string }) => void;
  isLoading: boolean;
}

const emotions = [
  { value: "medo", label: "😨 Medo" },
  { value: "alegria", label: "😊 Alegria" },
  { value: "tristeza", label: "😢 Tristeza" },
  { value: "confusao", label: "😵 Confusão" },
  { value: "paz", label: "😌 Paz" },
  { value: "ansiedade", label: "😰 Ansiedade" },
];

const DreamForm = ({ onSubmit, isLoading }: DreamFormProps) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || !emotion) return;
    onSubmit({ title: title.trim(), text: text.trim(), emotion });
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
              Título do sonho
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Voando sobre o oceano"
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Como você se sentiu?
            </label>
            <div className="flex flex-wrap gap-2">
              {emotions.map((em) => (
                <button
                  key={em.value}
                  type="button"
                  onClick={() => setEmotion(em.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    emotion === em.value
                      ? "bg-primary text-primary-foreground glow-gold"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {em.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !title.trim() || !text.trim() || !emotion}
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
