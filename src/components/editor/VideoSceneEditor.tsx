import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploader } from "./MediaUploader";
import type { VideoScene } from "@/types/unified-course";
import type { VideoSceneStyle } from "@/types/editor-types";

interface VideoSceneEditorProps {
    scene: VideoScene;
    style: VideoSceneStyle;
    onChange: (scene: VideoScene) => void;
    onStyleChange: (style: VideoSceneStyle) => void;
}

export function VideoSceneEditor({ scene, style, onChange, onStyleChange }: VideoSceneEditorProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Imagem da Cena</Label>
                <MediaUploader
                    accept="image"
                    value={scene.imageBase64 || ""}
                    onChange={(base64) => onChange({ ...scene, imageBase64: base64 })}
                />
            </div>

            <div className="space-y-2">
                <Label>Narração (Script)</Label>
                <Textarea
                    value={scene.narration}
                    onChange={(e) => onChange({ ...scene, narration: e.target.value })}
                    rows={4}
                    placeholder="Texto que será narrado pela IA..."
                />
                <p className="text-xs text-muted-foreground">
                    A narração será gerada novamente se alterada.
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <Label>Duração (segundos)</Label>
                    <span className="text-xs text-gray-500">{scene.duration.toFixed(1)}s</span>
                </div>
                <Slider
                    value={[scene.duration]}
                    min={1}
                    max={60}
                    step={0.5}
                    onValueChange={([val]) => onChange({ ...scene, duration: val })}
                />
            </div>

            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <h3 className="font-medium text-sm text-gray-900">Configurações de Vídeo</h3>

                <div className="flex items-center justify-between">
                    <Label>Exibir Legenda</Label>
                    <Switch
                        checked={style.captionEnabled}
                        onCheckedChange={(checked) => onStyleChange({ ...style, captionEnabled: checked })}
                    />
                </div>

                {style.captionEnabled && (
                    <div className="space-y-2">
                        <Label>Texto da Legenda</Label>
                        <Input
                            value={style.captionText || scene.narration}
                            onChange={(e) => onStyleChange({ ...style, captionText: e.target.value })}
                            placeholder="Mesmo da narração se vazio"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Transição de Entrada</Label>
                    <Select
                        value={style.transitionType}
                        onValueChange={(val: any) => onStyleChange({ ...style, transitionType: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Corte Seco (None)</SelectItem>
                            <SelectItem value="fade">Fade In/Out</SelectItem>
                            <SelectItem value="slide">Deslizar</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Música de Fundo</Label>
                    <MediaUploader
                        accept="audio"
                        value={style.musicBase64 || ""}
                        onChange={(base64) => onStyleChange({ ...style, musicBase64: base64 })}
                        label="Upload Áudio"
                    />
                </div>
            </div>
        </div>
    );
}
