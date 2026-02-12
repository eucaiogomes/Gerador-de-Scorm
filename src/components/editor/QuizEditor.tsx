import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import type { CourseQuestion } from "@/types/unified-course";

interface QuizEditorProps {
    question: CourseQuestion;
    onChange: (question: CourseQuestion) => void;
}

export function QuizEditor({ question, onChange }: QuizEditorProps) {
    const handleAddAlternative = () => {
        onChange({
            ...question,
            alternatives: [...question.alternatives, "Nova alternativa"],
        });
    };

    const handleRemoveAlternative = (index: number) => {
        const newAlternatives = question.alternatives.filter((_, i) => i !== index);
        let newCorrectIndex = question.correctIndex;

        // Adjust correct index if needed
        if (index < question.correctIndex) {
            newCorrectIndex--;
        } else if (index === question.correctIndex) {
            newCorrectIndex = 0; // Reset to first if deleted was correct
        }

        onChange({
            ...question,
            alternatives: newAlternatives,
            correctIndex: Math.min(newCorrectIndex, Math.max(0, newAlternatives.length - 1)),
        });
    };

    const handleAlternativeChange = (index: number, value: string) => {
        const newAlternatives = [...question.alternatives];
        newAlternatives[index] = value;
        onChange({
            ...question,
            alternatives: newAlternatives,
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Pergunta</Label>
                <Input
                    value={question.text}
                    onChange={(e) => onChange({ ...question, text: e.target.value })}
                    placeholder="Digite a pergunta..."
                />
            </div>

            <div className="space-y-4">
                <Label>Alternativas (Selecione a correta)</Label>

                <RadioGroup
                    value={question.correctIndex.toString()}
                    onValueChange={(val) => onChange({ ...question, correctIndex: parseInt(val) })}
                >
                    {question.alternatives.map((alt, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <RadioGroupItem value={index.toString()} id={`alt-${index}`} />
                            <div className="flex-1">
                                <Input
                                    value={alt}
                                    onChange={(e) => handleAlternativeChange(index, e.target.value)}
                                    placeholder={`Alternativa ${index + 1}`}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAlternative(index)}
                                disabled={question.alternatives.length <= 2}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </RadioGroup>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAlternative}
                    className="w-full border-dashed"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Alternativa
                </Button>
            </div>
        </div>
    );
}
