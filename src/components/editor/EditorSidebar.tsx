import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortableItem } from "./SortableItem";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EditorState, EditorTab } from "@/types/editor-types";

interface EditorSidebarProps {
    state: EditorState;
    onTabChange: (tab: EditorTab) => void;
    onSelect: (index: number) => void;
    onReorder: (activeId: string, overId: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export function EditorSidebar({
    state,
    onTabChange,
    onSelect,
    onReorder,
    onAdd,
    onRemove,
}: EditorSidebarProps) {
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            onReorder(active.id.toString(), over!.id.toString());
        }
    };

    const getItems = () => {
        switch (state.activeTab) {
            case "slides":
                return state.course.slides.map((s, i) => ({ id: `slide-${i}`, ...s }));
            case "video":
                return state.course.video?.scenes.map((s, i) => ({ id: `scene-${i}`, ...s })) || [];
            case "quiz":
                return state.course.questions.map((q, i) => ({ id: `quiz-${i}`, ...q }));
        }
    };

    const items = getItems();

    return (
        <div className="w-80 border-r bg-white flex flex-col h-full">
            <div className="p-4 border-b">
                <Tabs value={state.activeTab} onValueChange={(v) => onTabChange(v as EditorTab)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="slides">Slides</TabsTrigger>
                        <TabsTrigger value="video">Vídeo</TabsTrigger>
                        <TabsTrigger value="quiz">Quiz</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <ScrollArea className="flex-1 p-4">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    isSelected={
                                        (state.activeTab === "slides" && state.selectedSlideIndex === index) ||
                                        (state.activeTab === "video" && state.selectedSceneIndex === index) ||
                                        (state.activeTab === "quiz" && state.selectedQuestionIndex === index)
                                    }
                                    onClick={() => onSelect(index)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="truncate font-medium text-sm">
                                            {index + 1}. {(item as any).title || (item as any).text || `Cena ${index + 1}`}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(index);
                                            }}
                                        >
                                            <span className="sr-only">Remover</span>
                                            ×
                                        </Button>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </ScrollArea>

            <div className="p-4 border-t">
                <Button onClick={onAdd} className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar {state.activeTab === "slides" ? "Slide" : state.activeTab === "video" ? "Cena" : "Pergunta"}
                </Button>
            </div>
        </div>
    );
}
