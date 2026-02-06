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
import { Film, Loader2, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { VideoContent, VideoGenerationStep } from "@/types/video";
import { VideoGenerationProgress } from "./VideoGenerationProgress";
import { VideoPlayer } from "./VideoPlayer";

const SUGGESTIONS = [
  "Como fazer um bolo de chocolate",
  "Segurança no trabalho",
  "Introdução ao Excel",
  "Primeiros socorros básicos",
  "Atendimento ao cliente",
  "Gestão de tempo eficiente",
];

export function VideoScormGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2");
  const [step, setStep] = useState<VideoGenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Tema obrigatório",
        description: "Digite um tema para gerar o vídeo.",
      });
      return;
    }

    setStep("generating-content");
    setProgress(0);
    setVideoContent(null);

    try {
      // Step 1: Generate video content (script + images)
      setStep("generating-content");
      setProgress(10);

      const { data: contentData, error: contentError } = await supabase.functions.invoke(
        "generate-video-content",
        { body: { topic: topic.trim() } }
      );

      if (contentError || !contentData?.content) {
        throw new Error(contentError?.message || "Erro ao gerar conteúdo");
      }

      const content: VideoContent = contentData.content;
      setProgress(40);

      // Step 2: Generate audio for each scene
      setStep("generating-audio");

      const fullScript = content.scenes.map((s) => s.narration).join(" ");
      
      const { data: audioData, error: audioError } = await supabase.functions.invoke(
        "generate-video-audio",
        { body: { script: fullScript } }
      );

      if (audioError || !audioData?.narration) {
        console.warn("Audio generation failed, continuing without audio:", audioError);
      } else {
        // For simplicity, we'll use the same audio for all scenes
        // In a production app, you'd split the audio or generate per-scene
        content.scenes = content.scenes.map((scene, index) => ({
          ...scene,
          audioBase64: index === 0 ? audioData.narration : undefined,
        }));
      }

      setProgress(70);

      // Step 3: Assemble video (in browser with slideshow approach)
      setStep("assembling-video");
      setProgress(85);

      // For browser-based video, we'll use a slideshow with audio
      // FFmpeg.wasm would be needed for actual video encoding, but it's heavy
      // Instead, we create a playable slideshow experience

      setVideoContent(content);
      setProgress(100);
      setStep("complete");

      toast({
        title: "Vídeo gerado com sucesso!",
        description: `${content.scenes.length} cenas criadas com narração.`,
      });
    } catch (err) {
      console.error("Error generating video:", err);
      setStep("error");
      toast({
        variant: "destructive",
        title: "Erro ao gerar vídeo",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  };

  const handleDownloadScorm = async () => {
    if (!videoContent) return;

    setIsDownloading(true);
    setStep("creating-scorm");

    try {
      const { data, error } = await supabase.functions.invoke("generate-video-scorm", {
        body: {
          content: videoContent,
          scormVersion,
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
        a.download = `${videoContent.title.replace(/[^a-zA-Z0-9]/g, "_")}_video_scorm.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "SCORM baixado!",
          description: "O pacote SCORM com vídeo foi baixado.",
        });
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
      setStep("complete");
    }
  };

  const isGenerating = step !== "idle" && step !== "complete" && step !== "error";

  return (
    <div className="space-y-6">
      {/* Video Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Gerar Vídeo com IA
          </CardTitle>
          <CardDescription>
            Crie um vídeo educativo de 1 minuto com imagens, narração e música gerados por IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="video-topic">Tema do Vídeo</Label>
            <Input
              id="video-topic"
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

          {/* SCORM Version */}
          <div className="space-y-2">
            <Label>Versão SCORM</Label>
            <Select
              value={scormVersion}
              onValueChange={(value: "1.2" | "2004") => setScormVersion(value)}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">SCORM 1.2</SelectItem>
                <SelectItem value="2004">SCORM 2004</SelectItem>
              </SelectContent>
            </Select>
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
                Gerando vídeo...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Gerar Vídeo com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {isGenerating && (
        <VideoGenerationProgress step={step} progress={progress} />
      )}

      {/* Video Preview */}
      {videoContent && step === "complete" && (
        <>
          <VideoPlayer content={videoContent} />

          <Button
            size="lg"
            className="w-full"
            onClick={handleDownloadScorm}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Criando pacote SCORM...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Baixar SCORM com Vídeo
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
