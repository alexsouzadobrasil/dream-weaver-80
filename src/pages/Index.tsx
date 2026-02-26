import { useState, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import DreamForm from "@/components/DreamForm";
import DreamResult from "@/components/DreamResult";
import LoadingOverlay from "@/components/LoadingOverlay";
import heroBg from "@/assets/hero-bg.jpg";

// Mock interpretations — will be replaced by real OpenAI integration
const mockInterpretations: Record<string, { symbols: string; emotions: string; message: string }> = {
  medo: {
    symbols: "Os elementos do seu sonho revelam medos inconscientes que estão pedindo atenção. Água turbulenta pode representar emoções reprimidas, enquanto perseguições simbolizam situações que você está evitando na vida real.",
    emotions: "O medo presente no sonho é um reflexo de inseguranças profundas. Seu subconsciente está processando ansiedades que talvez você não reconheça conscientemente durante o dia.",
    message: "Este sonho é um convite para enfrentar o que tem evitado. As respostas que você procura estão dentro de você. Coragem não é ausência de medo, mas sim a decisão de seguir em frente apesar dele.",
  },
  alegria: {
    symbols: "Voos, cores vibrantes e luz intensa indicam um período de expansão pessoal. Seu subconsciente está celebrando conquistas internas que talvez você ainda não reconheça no plano consciente.",
    emotions: "A alegria do sonho reflete uma harmonia interior crescente. Você está alinhando seus desejos com suas ações, criando um estado natural de contentamento.",
    message: "Aproveite esta energia positiva! O universo está sinalizando que você está no caminho certo. Continue nutrindo o que traz leveza à sua vida.",
  },
  tristeza: {
    symbols: "Chuva, ambientes vazios ou perdas no sonho representam um processo de luto saudável. Seu subconsciente está liberando emoções acumuladas para abrir espaço para novas experiências.",
    emotions: "A tristeza onírica é purificadora. Diferente da tristeza vigil, ela serve como mecanismo de cura emocional, permitindo que antigas feridas se fechem naturalmente.",
    message: "Permita-se sentir. A tristeza é temporária e necessária para o crescimento. Após a tempestade interior, um novo capítulo mais leve se abrirá.",
  },
  confusao: {
    symbols: "Labirintos, espelhos e cenários mutantes indicam um período de transformação. Sua mente está reorganizando crenças e padrões para criar uma nova versão de si mesmo.",
    emotions: "A confusão onírica revela que você está em uma encruzilhada. É natural sentir-se perdido quando está prestes a encontrar um novo caminho.",
    message: "Não force clareza. A resposta virá naturalmente quando você parar de buscá-la com tanta intensidade. Confie no processo.",
  },
  paz: {
    symbols: "Jardins, águas calmas e céu limpo simbolizam equilíbrio interior alcançado. Seu subconsciente está em estado meditativo, processando experiências com serenidade.",
    emotions: "A paz no sonho reflete um estado de aceitação profunda. Você está fazendo as pazes com aspectos de sua vida que antes geravam conflito.",
    message: "Este é um momento de colheita espiritual. Mantenha suas práticas de autocuidado e gratidão — elas estão funcionando.",
  },
  ansiedade: {
    symbols: "Atrasos, provas sem preparo e quedas são manifestações de pressões externas absorvidas pelo inconsciente. Representam cobranças que você internalizou excessivamente.",
    emotions: "A ansiedade no sonho é um alerta gentil. Seu corpo e mente pedem pausa e reavaliação de prioridades antes que o estresse se torne crônico.",
    message: "Respire. Nem tudo depende de você, e nem tudo precisa ser perfeito. Delegue, descanse e lembre-se: você é humano, não máquina.",
  },
};

const Index = () => {
  const [step, setStep] = useState<"hero" | "form" | "loading" | "result">("hero");
  const [interpretation, setInterpretation] = useState<any>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    setStep("form");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = (dream: { title: string; text: string; emotion: string }) => {
    setStep("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Simulate API call
    setTimeout(() => {
      const mock = mockInterpretations[dream.emotion] || mockInterpretations.confusao;
      setInterpretation({
        title: dream.title,
        emotion: dream.emotion,
        symbols: mock.symbols,
        emotions: mock.emotions,
        message: mock.message,
        thumbnailUrl: heroBg,
      });
      setStep("result");
    }, 4000);
  };

  const handleNewDream = () => {
    setStep("form");
    setInterpretation(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-mystic">
      {step === "hero" && <HeroSection onStart={handleStart} />}

      {step === "form" && (
        <div ref={formRef}>
          <DreamForm onSubmit={handleSubmit} isLoading={false} />
        </div>
      )}

      {step === "loading" && <LoadingOverlay />}

      {step === "result" && interpretation && (
        <DreamResult interpretation={interpretation} onNewDream={handleNewDream} />
      )}
    </div>
  );
};

export default Index;
