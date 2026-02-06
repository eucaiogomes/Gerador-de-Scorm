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
import { Sparkles, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { GeneratedCourse } from "@/types/course";
import { CoursePreview } from "./CoursePreview";

const SUGGESTIONS = [
  "Como fazer um bolo de chocolate",
  "Segurança no trabalho",
  "Introdução ao Excel",
  "Atendimento ao cliente",
  "Primeiros socorros",
  "Gestão de tempo",
];

export function AIPromptInput() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [scormVersion, setScormVersion] = useState<"1.2" | "2004">("1.2");
  const [completionStatus, setCompletionStatus] = useState<"completed" | "passed-failed">("completed");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
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

    setIsGenerating(true);
    setGeneratedCourse(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-course-ai", {
        body: {
          topic: topic.trim(),
          scormVersion,
          completionStatus,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar curso");
      }

      if (data?.course) {
        setGeneratedCourse(data.course);
        toast({
          title: "Curso gerado com sucesso!",
          description: `${data.course.slides.length} slides e ${data.course.questions.length} perguntas criadas.`,
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err) {
      console.error("Error generating course:", err);
      toast({
        variant: "destructive",
        title: "Erro ao gerar curso",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadScorm = async () => {
    if (!generatedCourse) return;

    setIsDownloading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-scorm-from-course", {
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
          description: "O arquivo ZIP foi baixado com sucesso.",
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

  return (
    <div className="space-y-6">
      {/* AI Prompt Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Curso com IA
          </CardTitle>
          <CardDescription>
            Digite um tema e a IA criará slides com conteúdo, imagens e um quiz completo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                Gerando curso com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Gerar Curso
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Course Preview */}
      {generatedCourse && (
        <>
          <CoursePreview course={generatedCourse} />

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
                Baixar SCORM
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
