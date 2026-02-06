import { Progress } from "@/components/ui/progress";
import { Loader2, Check, Image, Volume2, Film, Package, Sparkles } from "lucide-react";
import type { VideoGenerationStep } from "@/types/video";

interface VideoGenerationProgressProps {
  step: VideoGenerationStep;
  progress: number;
}

const STEPS = [
  { id: "generating-content", label: "Gerando roteiro com IA", icon: Sparkles },
  { id: "generating-images", label: "Criando imagens", icon: Image },
  { id: "generating-audio", label: "Gerando narração", icon: Volume2 },
  { id: "assembling-video", label: "Montando vídeo", icon: Film },
  { id: "creating-scorm", label: "Criando pacote SCORM", icon: Package },
];

export function VideoGenerationProgress({ step, progress }: VideoGenerationProgressProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso geral</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isComplete = index < currentStepIndex;
          const isCurrent = s.id === step;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isCurrent
                  ? "bg-primary/10 border border-primary/20"
                  : isComplete
                  ? "bg-green-500/10"
                  : "opacity-50"
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrent ? "text-primary" : isComplete ? "text-green-600" : ""
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
