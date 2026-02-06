import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { Question, Alternative } from "@/types/quiz";

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  onUpdate: (question: Question) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionCard({
  question,
  questionIndex,
  onUpdate,
  onRemove,
  canRemove,
}: QuestionCardProps) {
  const updateQuestionText = (text: string) => {
    onUpdate({ ...question, text });
  };

  const updateAlternativeText = (altId: string, text: string) => {
    onUpdate({
      ...question,
      alternatives: question.alternatives.map((alt) =>
        alt.id === altId ? { ...alt, text } : alt
      ),
    });
  };

  const setCorrectAlternative = (altId: string) => {
    onUpdate({ ...question, correctAlternativeId: altId });
  };

  const addAlternative = () => {
    if (question.alternatives.length >= 6) return;
    const newAlt: Alternative = {
      id: crypto.randomUUID(),
      text: "",
    };
    onUpdate({
      ...question,
      alternatives: [...question.alternatives, newAlt],
    });
  };

  const removeAlternative = (altId: string) => {
    if (question.alternatives.length <= 2) return;
    const newAlts = question.alternatives.filter((alt) => alt.id !== altId);
    // If we removed the correct one, reset
    const newCorrectId =
      question.correctAlternativeId === altId
        ? ""
        : question.correctAlternativeId;
    onUpdate({
      ...question,
      alternatives: newAlts,
      correctAlternativeId: newCorrectId,
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Pergunta {questionIndex + 1}
          </CardTitle>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor={`question-${question.id}`}>Texto da pergunta</Label>
          <Input
            id={`question-${question.id}`}
            placeholder="Digite a pergunta aqui..."
            value={question.text}
            onChange={(e) => updateQuestionText(e.target.value)}
          />
        </div>

        {/* Alternatives */}
        <div className="space-y-3">
          <Label>Alternativas (selecione a correta)</Label>
          <RadioGroup
            value={question.correctAlternativeId}
            onValueChange={setCorrectAlternative}
            className="space-y-2"
          >
            {question.alternatives.map((alt, altIndex) => (
              <div key={alt.id} className="flex items-center gap-2">
                <RadioGroupItem value={alt.id} id={`alt-${alt.id}`} />
                <Input
                  placeholder={`Alternativa ${altIndex + 1}`}
                  value={alt.text}
                  onChange={(e) => updateAlternativeText(alt.id, e.target.value)}
                  className="flex-1"
                />
                {question.alternatives.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAlternative(alt.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>

          {question.alternatives.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addAlternative}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar alternativa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
