import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { MediaUploader } from "./MediaUploader";
import type { CourseSlide } from "@/types/unified-course";
import type { SlideStyle } from "@/types/editor-types";

interface SlideEditorProps {
    slide: CourseSlide;
    style: SlideStyle;
    onChange: (slide: CourseSlide) => void;
    onStyleChange: (style: SlideStyle) => void;
}

export function SlideEditor({ slide, style, onChange, onStyleChange }: SlideEditorProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Título do Slide</Label>
                <Input
                    value={slide.title}
                    onChange={(e) => onChange({ ...slide, title: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>Conteúdo de Texto</Label>
                <Textarea
                    value={slide.content}
                    onChange={(e) => onChange({ ...slide, content: e.target.value })}
                    rows={6}
                />
            </div>

            <div className="space-y-2">
                <Label>Imagem do Slide</Label>
                <MediaUploader
                    accept="image"
                    value={slide.imageBase64 || ""}
                    onChange={(base64) => onChange({ ...slide, imageBase64: base64 })}
                />
            </div>

            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <h3 className="font-medium text-sm text-gray-900">Estilo</h3>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label>Largura do Conteúdo</Label>
                        <span className="text-xs text-gray-500">{style.contentWidth}%</span>
                    </div>
                    <Slider
                        value={[style.contentWidth]}
                        min={50}
                        max={100}
                        step={5}
                        onValueChange={([val]) => onStyleChange({ ...style, contentWidth: val })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Cor de Fundo</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={style.backgroundColor}
                            onChange={(e) => onStyleChange({ ...style, backgroundColor: e.target.value })}
                            className="w-12 h-8 p-1"
                        />
                        <Input
                            value={style.backgroundColor}
                            onChange={(e) => onStyleChange({ ...style, backgroundColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={style.textColor}
                            onChange={(e) => onStyleChange({ ...style, textColor: e.target.value })}
                            className="w-12 h-8 p-1"
                        />
                        <Input
                            value={style.textColor}
                            onChange={(e) => onStyleChange({ ...style, textColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
