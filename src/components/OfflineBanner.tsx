import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center py-2 px-4 text-sm font-display flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          Sem conexão — seus dados estão sendo salvos localmente
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
