import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, BookOpen, Film, Volume2 } from "lucide-react";
import type { GenerationStep } from "@/types/unified-course";

interface UnifiedGenerationProgressProps {
  step: GenerationStep;
}

const steps = [
  { id: "generating-content", label: "Gerando conteúdo e imagens", icon: BookOpen },
  { id: "generating-video", label: "Criando cenas do vídeo", icon: Film },
  { id: "generating-audio", label: "Gerando narração", icon: Volume2 },
];

export function UnifiedGenerationProgress({ step }: UnifiedGenerationProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === step);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 10;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Gerando curso completo...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-3">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isCompleted = currentIndex > index;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : isCompleted
                    ? "bg-muted"
                    : "opacity-50"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Icon className="h-5 w-5 text-muted-foreground" />
                )}
                <span
                  className={`text-sm ${
                    isActive ? "font-medium text-primary" : isCompleted ? "text-muted-foreground" : ""
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Isso pode levar alguns minutos...
        </p>
      </CardContent>
    </Card>
  );
}
