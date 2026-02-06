import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionCard } from "./QuestionCard";
import { Plus, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question, QuizConfig, ScormRequest } from "@/types/quiz";
import { supabase } from "@/integrations/supabase/client";

function createEmptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    text: "",
    alternatives: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    correctAlternativeId: "",
  };
}

export function ScormForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<QuizConfig>({
    title: "",
    scormVersion: "1.2",
    completionStatus: "completed",
    questions: [createEmptyQuestion()],
  });

  const updateQuestion = (index: number, question: Question) => {
    const newQuestions = [...config.questions];
    newQuestions[index] = question;
    setConfig({ ...config, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    if (config.questions.length <= 1) return;
    const newQuestions = config.questions.filter((_, i) => i !== index);
    setConfig({ ...config, questions: newQuestions });
  };

  const addQuestion = () => {
    setConfig({
      ...config,
      questions: [...config.questions, createEmptyQuestion()],
    });
  };

  const validateForm = (): string | null => {
    if (!config.title.trim()) {
      return "O título do curso é obrigatório.";
    }

    for (let i = 0; i < config.questions.length; i++) {
      const q = config.questions[i];
      if (!q.text.trim()) {
        return `A pergunta ${i + 1} precisa de um texto.`;
      }
      if (q.alternatives.length < 2) {
        return `A pergunta ${i + 1} precisa de pelo menos 2 alternativas.`;
      }
      for (let j = 0; j < q.alternatives.length; j++) {
        if (!q.alternatives[j].text.trim()) {
          return `A alternativa ${j + 1} da pergunta ${i + 1} não pode estar vazia.`;
        }
      }
      if (!q.correctAlternativeId) {
        return `Selecione a alternativa correta da pergunta ${i + 1}.`;
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    const error = validateForm();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: error,
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Transform data for the API
      const payload: ScormRequest = {
        title: config.title.trim(),
        scormVersion: config.scormVersion,
        completionStatus: config.completionStatus,
        questions: config.questions.map((q) => ({
          text: q.text.trim(),
          alternatives: q.alternatives.map((a) => a.text.trim()),
          correctIndex: q.alternatives.findIndex(
            (a) => a.id === q.correctAlternativeId
          ),
        })),
      };

      const { data, error } = await supabase.functions.invoke("generate-scorm", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar SCORM");
      }

      // The response should contain base64 encoded zip
      if (data?.zip) {
        // Convert base64 to blob
        const binaryString = atob(data.zip);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.title.replace(/[^a-zA-Z0-9]/g, "_")}_scorm.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "SCORM gerado com sucesso!",
          description: "O download do arquivo ZIP foi iniciado.",
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err) {
      console.error("Error generating SCORM:", err);
      toast({
        variant: "destructive",
        title: "Erro ao gerar SCORM",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Curso</CardTitle>
          <CardDescription>
            Defina o título e as opções SCORM do seu quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Curso</Label>
            <Input
              id="title"
              placeholder="Ex: Quiz de Segurança do Trabalho"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Versão SCORM</Label>
              <Select
                value={config.scormVersion}
                onValueChange={(value: "1.2" | "2004") =>
                  setConfig({ ...config, scormVersion: value })
                }
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
                value={config.completionStatus}
                onValueChange={(value: "completed" | "passed-failed") =>
                  setConfig({ ...config, completionStatus: value })
                }
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
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Perguntas</h2>
          <Button variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pergunta
          </Button>
        </div>

        {config.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionIndex={index}
            onUpdate={(q) => updateQuestion(index, q)}
            onRemove={() => removeQuestion(index)}
            canRemove={config.questions.length > 1}
          />
        ))}
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
            Gerando SCORM...
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Gerar SCORM
          </>
        )}
      </Button>
    </div>
  );
}
