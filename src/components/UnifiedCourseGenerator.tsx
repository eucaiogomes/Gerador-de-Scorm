import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Download, BookOpen, Film, HelpCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedCourse, GenerationStep } from "@/types/unified-course";
import { UnifiedCoursePreview } from "./UnifiedCoursePreview";
import { UnifiedGenerationProgress } from "./UnifiedGenerationProgress";

const SUGGESTIONS = [
  "Como fazer um bolo de chocolate",
  "Segurança no trabalho",
  "Introdução ao Excel",
  "Atendimento ao cliente",
  "Primeiros socorros",
  "Gestão de tempo",
];

import { useNavigate } from "react-router-dom";

export function UnifiedCourseGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2");
  const [completionStatus, setCompletionStatus] = useState<"completed" | "passed-failed">("completed");
  const [step, setStep] = useState<GenerationStep>("idle");
  const [generatedCourse, setGeneratedCourse] = useState<UnifiedCourse | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Tema obrigatório",
        description: "Digite um tema para gerar o curso.",
      });
      return;
    }

    setStep("generating-content");
    setGeneratedCourse(null);

    try {
      // Step 1: Generate unified course (content + video + quiz with images)
      const { data, error } = await supabase.functions.invoke("generate-unified-course", {
        body: { topic: topic.trim() },
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar curso");
      }

      if (!data?.course) {
        throw new Error("Resposta inválida do servidor");
      }

      setStep("generating-audio");

      // Step 2: Generate audio for video narration
      const course = data.course as UnifiedCourse;
      const fullScript = course.video?.scenes.map((s) => s.narration).join(" ") || "";

      if (fullScript) {
        try {
          const { data: audioData, error: audioError } = await supabase.functions.invoke(
            "generate-video-audio",
            { body: { script: fullScript } }
          );

          if (!audioError && audioData?.narration && course.video) {
            course.video.audioBase64 = audioData.narration;

            // Recalculate scene durations for perfect sync
            if (audioData.duration && audioData.duration > 0) {
              const totalAudioDuration = audioData.duration;
              course.video.totalDuration = totalAudioDuration;

              const totalChars = fullScript.length;
              let accumulatedDuration = 0;

              course.video.scenes.forEach((scene, index) => {
                // Last scene gets the remainder to ensure exact sum match
                if (index === course.video!.scenes.length - 1) {
                  scene.duration = Math.max(1, totalAudioDuration - accumulatedDuration);
                } else {
                  const proportion = scene.narration.length / totalChars;
                  const sceneDuration = proportion * totalAudioDuration;
                  scene.duration = sceneDuration;
                  accumulatedDuration += sceneDuration;
                }
              });
            }
          }
        } catch (audioErr) {
          console.warn("Audio generation failed, continuing without audio:", audioErr);
        }
      }

      setGeneratedCourse(course);
      setStep("complete");

      toast({
        title: "Curso completo gerado!",
        description: `${course.slides.length} slides, ${course.video?.scenes.length || 0} cenas de vídeo e ${course.questions.length} perguntas.`,
      });
    } catch (err) {
      console.error("Error generating course:", err);
      setStep("error");
      toast({
        variant: "destructive",
        title: "Erro ao gerar curso",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  };

  const handleDownloadScorm = async () => {
    if (!generatedCourse) return;

    setIsDownloading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-unified-scorm", {
        body: {
          course: generatedCourse,
          scormVersion,
          completionStatus,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar SCORM");
      }

      if (data?.zip) {
        const binaryString = atob(data.zip);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${generatedCourse.title.replace(/[^a-zA-Z0-9]/g, "_")}_scorm.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "SCORM baixado!",
          description: "O pacote SCORM completo foi baixado.",
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err) {
      console.error("Error downloading SCORM:", err);
      toast({
        variant: "destructive",
        title: "Erro ao baixar SCORM",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const isGenerating = step !== "idle" && step !== "complete" && step !== "error";

  return (
    <div className="space-y-6">
      {/* Course Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Curso Completo com IA
          </CardTitle>
          <CardDescription>
            A IA criará automaticamente: slides de conteúdo + vídeo resumo + quiz final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* What's included */}
          <div className="flex flex-wrap gap-3 p-3 bg-muted rounded-lg">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              4 Slides de Conteúdo
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Film className="h-3 w-3" />
              Vídeo de 1 Minuto
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              5 Perguntas de Quiz
            </Badge>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Tema do Curso</Label>
            <Input
              id="topic"
              placeholder="Ex: Como fazer um bolo de chocolate"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Sugestões</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* SCORM Settings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Versão SCORM</Label>
              <Select
                value={scormVersion}
                onValueChange={(value: "1.2" | "2004") => setScormVersion(value)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.2">SCORM 1.2</SelectItem>
                  <SelectItem value="2004">SCORM 2004</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status de Conclusão</Label>
              <Select
                value={completionStatus}
                onValueChange={(value: "completed" | "passed-failed") => setCompletionStatus(value)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="passed-failed">Passed / Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando curso completo...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Gerar Curso Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && <UnifiedGenerationProgress step={step} />}

      {/* Course Preview */}
      {generatedCourse && step === "complete" && (
        <>
          <UnifiedCoursePreview course={generatedCourse} />

          {/* Download Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleDownloadScorm}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando SCORM...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Baixar SCORM Completo
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full mt-2 border-primary/20 hover:bg-primary/5 text-primary"
            onClick={() => navigate("/editor", { state: { course: generatedCourse } })}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Editar no Editor Visual
          </Button>
        </>
      )}
    </div>
  );
}
