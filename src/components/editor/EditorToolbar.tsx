import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Download, Undo } from "lucide-react";

interface EditorToolbarProps {
    title: string;
    onTitleChange: (title: string) => void;
    onBack: () => void;
    onSave: () => void;
    onDownload: () => void;
    hasChanges: boolean;
}

export function EditorToolbar({
    title,
    onTitleChange,
    onBack,
    onSave,
    onDownload,
    hasChanges,
}: EditorToolbarProps) {
    return (
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Curso:</span>
                    <Input
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="w-64 h-8 font-semibold text-lg border-transparent hover:border-gray-200 focus:border-primary"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {hasChanges && (
                    <span className="text-xs text-amber-600 font-medium mr-2 animate-pulse">
                        Alterações não salvas
                    </span>
                )}

                <Button variant="outline" size="sm" onClick={onSave} disabled={!hasChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                </Button>

                <Button
                    size="sm"
                    onClick={onDownload}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar SCORM
                </Button>
            </div>
        </div>
    );
}
