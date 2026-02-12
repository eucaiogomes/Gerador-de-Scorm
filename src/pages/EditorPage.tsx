import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { SlideEditor } from "@/components/editor/SlideEditor";
import { VideoSceneEditor } from "@/components/editor/VideoSceneEditor";
import { QuizEditor } from "@/components/editor/QuizEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedCourse, CourseSlide, VideoScene, CourseQuestion } from "@/types/unified-course";
import {
    EditorState,
    EditorTab,
    defaultSlideStyle,
    defaultSceneStyle,
    SlideStyle,
    VideoSceneStyle
} from "@/types/editor-types";

export default function EditorPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Initial state from navigation
    const initialCourse = location.state?.course as UnifiedCourse;

    const [state, setState] = useState<EditorState | null>(null);

    useEffect(() => {
        if (!initialCourse) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Nenhum curso selecionado para edição.",
            });
            navigate("/");
            return;
        }

        // Initialize state
        setState({
            course: JSON.parse(JSON.stringify(initialCourse)), // Deep copy
            activeTab: "slides",
            selectedSlideIndex: 0,
            selectedSceneIndex: 0,
            selectedQuestionIndex: 0,
            slideStyles: initialCourse.slides.map(() => ({ ...defaultSlideStyle })),
            sceneStyles: initialCourse.video?.scenes.map(() => ({ ...defaultSceneStyle })) || [],
            isDirty: false,
        });
    }, [initialCourse, navigate, toast]);

    if (!state) return null;

    const handleTabChange = (tab: EditorTab) => {
        setState(prev => prev ? ({ ...prev, activeTab: tab }) : null);
    };

    const handleSelect = (index: number) => {
        setState(prev => {
            if (!prev) return null;
            switch (prev.activeTab) {
                case "slides": return { ...prev, selectedSlideIndex: index };
                case "video": return { ...prev, selectedSceneIndex: index };
                case "quiz": return { ...prev, selectedQuestionIndex: index };
            }
        });
    };

    const handleReorder = (activeId: string, overId: string) => {
        // Parse IDs (e.g., "slide-0" -> 0)
        const oldIndex = parseInt(activeId.split("-")[1]);
        const newIndex = parseInt(overId.split("-")[1]);

        setState(prev => {
            if (!prev) return null;
            const newState = { ...prev, isDirty: true };

            switch (prev.activeTab) {
                case "slides":
                    newState.course.slides = arrayMove(prev.course.slides, oldIndex, newIndex);
                    newState.slideStyles = arrayMove(prev.slideStyles, oldIndex, newIndex);
                    newState.selectedSlideIndex = newIndex;
                    break;
                case "video":
                    if (newState.course.video) {
                        newState.course.video.scenes = arrayMove(prev.course.video.scenes, oldIndex, newIndex);
                        newState.sceneStyles = arrayMove(prev.sceneStyles, oldIndex, newIndex);
                        newState.selectedSceneIndex = newIndex;
                    }
                    break;
                case "quiz":
                    newState.course.questions = arrayMove(prev.course.questions, oldIndex, newIndex);
                    newState.selectedQuestionIndex = newIndex;
                    break;
            }
            return newState;
        });
    };

    const handleAdd = () => {
        setState(prev => {
            if (!prev) return null;
            const newState = { ...prev, isDirty: true };

            switch (prev.activeTab) {
                case "slides": {
                    const newSlide: CourseSlide = {
                        title: "Novo Slide",
                        content: "Conteúdo do novo slide...",
                    };
                    newState.course.slides.push(newSlide);
                    newState.slideStyles.push({ ...defaultSlideStyle });
                    newState.selectedSlideIndex = newState.course.slides.length - 1;
                    break;
                }
                case "video": {
                    if (newState.course.video) {
                        const newScene: VideoScene = {
                            imagePrompt: "",
                            narration: "Nova cena...",
                            duration: 5,
                        };
                        newState.course.video.scenes.push(newScene);
                        newState.sceneStyles.push({ ...defaultSceneStyle });
                        newState.selectedSceneIndex = newState.course.video.scenes.length - 1;
                        // Recalculate duration
                        newState.course.video.totalDuration += 5;
                    }
                    break;
                }
                case "quiz": {
                    const newQuestion: CourseQuestion = {
                        text: "Nova Pergunta",
                        alternatives: ["Opção 1", "Opção 2"],
                        correctIndex: 0,
                    };
                    newState.course.questions.push(newQuestion);
                    newState.selectedQuestionIndex = newState.course.questions.length - 1;
                    break;
                }
            }
            return newState;
        });
    };

    const handleRemove = (index: number) => {
        setState(prev => {
            if (!prev) return null;
            const newState = { ...prev, isDirty: true };

            switch (prev.activeTab) {
                case "slides":
                    if (newState.course.slides.length <= 1) return prev; // Prevent deleting last slide
                    newState.course.slides.splice(index, 1);
                    newState.slideStyles.splice(index, 1);
                    newState.selectedSlideIndex = Math.min(index, newState.course.slides.length - 1);
                    break;
                case "video":
                    if (newState.course.video && newState.course.video.scenes.length > 1) {
                        newState.course.video.scenes.splice(index, 1);
                        newState.sceneStyles.splice(index, 1);
                        newState.selectedSceneIndex = Math.min(index, newState.course.video.scenes.length - 1);
                    }
                    break;
                case "quiz":
                    if (newState.course.questions.length <= 1) return prev;
                    newState.course.questions.splice(index, 1);
                    newState.selectedQuestionIndex = Math.min(index, newState.course.questions.length - 1);
                    break;
            }
            return newState;
        });
    };

    const updateSlide = (slide: CourseSlide) => {
        setState(prev => {
            if (!prev) return null;
            const newSlides = [...prev.course.slides];
            newSlides[prev.selectedSlideIndex] = slide;
            return { ...prev, course: { ...prev.course, slides: newSlides }, isDirty: true };
        });
    };

    const updateSlideStyle = (style: SlideStyle) => {
        setState(prev => {
            if (!prev) return null;
            const newStyles = [...prev.slideStyles];
            newStyles[prev.selectedSlideIndex] = style;
            return { ...prev, slideStyles: newStyles, isDirty: true };
        });
    };

    const updateScene = (scene: VideoScene) => {
        setState(prev => {
            if (!prev) return null;
            if (!prev.course.video) return prev;
            const newScenes = [...prev.course.video.scenes];
            newScenes[prev.selectedSceneIndex] = scene;
            return {
                ...prev,
                course: {
                    ...prev.course,
                    video: { ...prev.course.video, scenes: newScenes }
                },
                isDirty: true
            };
        });
    };

    const updateSceneStyle = (style: VideoSceneStyle) => {
        setState(prev => {
            if (!prev) return null;
            const newStyles = [...prev.sceneStyles];
            newStyles[prev.selectedSceneIndex] = style;
            return { ...prev, sceneStyles: newStyles, isDirty: true };
        });
    };

    const updateQuestion = (question: CourseQuestion) => {
        setState(prev => {
            if (!prev) return null;
            const newQuestions = [...prev.course.questions];
            newQuestions[prev.selectedQuestionIndex] = question;
            return { ...prev, course: { ...prev.course, questions: newQuestions }, isDirty: true };
        });
    };

    const handleDownload = async () => {
        try {
            toast({ title: "Preparando download...", description: "Gerando pacote SCORM atualizado." });

            const { data, error } = await supabase.functions.invoke("generate-unified-scorm", {
                body: {
                    course: state.course,
                    scormVersion: "1.2", // Could receive from previous screen via state
                    completionStatus: "completed",
                },
            });

            if (error) throw error;

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
                a.download = `${state.course.title.replace(/[^a-zA-Z0-9]/g, "_")}_edited.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast({ title: "Sucesso!", description: "Download iniciado." });
            }
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar SCORM." });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <EditorToolbar
                title={state.course.title}
                onTitleChange={(t) => setState(prev => prev ? ({ ...prev, course: { ...prev.course, title: t }, isDirty: true }) : null)}
                onBack={() => navigate("/")}
                onSave={() => setState(prev => prev ? ({ ...prev, isDirty: false }) : null)}
                onDownload={handleDownload}
                hasChanges={state.isDirty}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <EditorSidebar
                    state={state}
                    onTabChange={handleTabChange}
                    onSelect={handleSelect}
                    onReorder={handleReorder}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                />

                {/* Canvas */}
                <EditorCanvas state={state} />

                {/* Properties Panel */}
                <div className="w-80 border-l bg-white flex flex-col h-full">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">Propriedades</h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        {state.activeTab === "slides" && (
                            <SlideEditor
                                slide={state.course.slides[state.selectedSlideIndex]}
                                style={state.slideStyles[state.selectedSlideIndex]}
                                onChange={updateSlide}
                                onStyleChange={updateSlideStyle}
                            />
                        )}
                        {state.activeTab === "video" && state.course.video && (
                            <VideoSceneEditor
                                scene={state.course.video.scenes[state.selectedSceneIndex]}
                                style={state.sceneStyles[state.selectedSceneIndex]}
                                onChange={updateScene}
                                onStyleChange={updateSceneStyle}
                            />
                        )}
                        {state.activeTab === "quiz" && (
                            <QuizEditor
                                question={state.course.questions[state.selectedQuestionIndex]}
                                onChange={updateQuestion}
                            />
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
