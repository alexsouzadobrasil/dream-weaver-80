import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Keyboard, ArrowLeft } from "lucide-react";

interface DreamFormProps {
  onSubmitAudio: (blob: Blob) => void;
  onSubmitText: (text: string) => void;
  isLoading: boolean;
}

const ACCEPTED_FORMATS = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/aac', 'audio/mpeg', 'audio/x-m4a'];
const MAX_SIZE_MB = 25;

const DreamForm = ({ onSubmitAudio, onSubmitText, isLoading }: DreamFormProps) => {
  const [mode, setMode] = useState<"audio" | "text">("audio");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [text, setText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > MAX_SIZE_MB * 1024 * 1024) {
          alert('Áudio excede 25MB. Tente gravar um áudio mais curto.');
          return;
        }
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSendAudio = () => {
    if (audioBlob) onSubmitAudio(audioBlob);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) onSubmitText(text.trim());
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Pulsing rings for recording
  const PulseRings = () => (
    <>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-primary/30"
          animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
    </>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-20 px-4 flex-1 flex items-center justify-center"
      id="dream-form"
    >
      <div className="max-w-md mx-auto w-full text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-2">
          Conte seu sonho
        </h2>
        <p className="text-muted-foreground mb-12">
          {mode === "audio" ? "Pressione o botão e conte seu sonho em voz alta" : "Descreva com o máximo de detalhes possível"}
        </p>

        <AnimatePresence mode="wait">
          {mode === "audio" ? (
            <motion.div
              key="audio-mode"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Main record button */}
              <div className="relative flex items-center justify-center">
                {isRecording && <PulseRings />}
                <motion.button
                  type="button"
                  disabled={isLoading}
                  onMouseDown={!audioBlob && !isRecording ? startRecording : undefined}
                  onMouseUp={isRecording ? stopRecording : undefined}
                  onTouchStart={!audioBlob && !isRecording ? startRecording : undefined}
                  onTouchEnd={isRecording ? stopRecording : undefined}
                  onClick={audioBlob && !isRecording ? () => { setAudioBlob(null); setRecordingTime(0); } : undefined}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording
                      ? 'bg-destructive shadow-[0_0_40px_hsl(var(--destructive)/0.5)]'
                      : audioBlob
                        ? 'bg-accent shadow-[0_0_40px_hsl(var(--accent)/0.4)]'
                        : 'bg-primary glow-gold'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-destructive-foreground" />
                  ) : (
                    <Mic className="w-10 h-10 text-primary-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Status text */}
              <div className="h-8 flex items-center justify-center">
                {isRecording && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-destructive font-display font-semibold text-lg"
                  >
                    Gravando... {formatTime(recordingTime)}
                  </motion.p>
                )}
                {!isRecording && !audioBlob && (
                  <p className="text-muted-foreground text-sm">
                    Segure para gravar
                  </p>
                )}
                {audioBlob && !isRecording && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-accent-foreground text-sm"
                  >
                    Áudio gravado ({formatTime(recordingTime)}) • Toque para regravar
                  </motion.p>
                )}
              </div>

              {/* Send button */}
              <AnimatePresence>
                {audioBlob && !isRecording && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    type="button"
                    onClick={handleSendAudio}
                    disabled={isLoading}
                    className="w-full max-w-xs py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    Enviar sonho
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Switch to text */}
              <button
                type="button"
                onClick={() => setMode("text")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <Keyboard className="w-4 h-4" />
                Prefiro digitar
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="text-mode"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <form onSubmit={handleSendText} className="space-y-6">
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

                <motion.button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-gold transition-all"
                >
                  <Send className="w-5 h-5" />
                  Enviar sonho
                </motion.button>
              </form>

              <button
                type="button"
                onClick={() => setMode("audio")}
                className="mt-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mx-auto"
              >
                <Mic className="w-4 h-4" />
                Prefiro gravar áudio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default DreamForm;
