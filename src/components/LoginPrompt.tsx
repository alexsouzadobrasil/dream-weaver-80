import { motion } from "framer-motion";
import { LogIn, User, X } from "lucide-react";

interface LoginPromptProps {
  onClose: () => void;
  onLogin: () => void;
}

const LoginPrompt = ({ onClose, onLogin }: LoginPromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-x-4 bottom-4 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50"
    >
      <div className="bg-gradient-card border border-border rounded-2xl p-5 backdrop-blur-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-semibold text-foreground mb-1">
              Salve seu sonho
            </h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Crie uma conta para salvar seus sonhos e construir um diário onírico. 
              Seus sonhos anteriores ajudarão em interpretações futuras mais profundas.
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogin}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm flex items-center justify-center gap-2 glow-gold transition-all"
              >
                <LogIn className="w-4 h-4" />
                Criar conta
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground font-display text-sm border border-border hover:text-foreground transition-all"
              >
                Depois
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPrompt;
