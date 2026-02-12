import { Badge } from "@/components/ui/badge";
import type { EditorState } from "@/types/editor-types";

interface EditorCanvasProps {
    state: EditorState;
}

export function EditorCanvas({ state }: EditorCanvasProps) {
    const renderContent = () => {
        switch (state.activeTab) {
            case "slides": {
                const slide = state.course.slides[state.selectedSlideIndex];
                const style = state.slideStyles[state.selectedSlideIndex];

                if (!slide || !style) return <div className="text-center text-gray-400">Selecione um slide</div>;

                return (
                    <div
                        className="w-full h-full flex flex-col p-8 shadow-lg overflow-y-auto"
                        style={{
                            backgroundColor: style.backgroundColor,
                            color: style.textColor
                        }}
                    >
                        <h1 className="text-3xl font-bold mb-6" style={{ color: "#FF8C42" }}>{slide.title}</h1>

                        {slide.imageBase64 && (
                            <img
                                src={slide.imageBase64}
                                alt={slide.title}
                                className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
                            />
                        )}

                        <div
                            className="prose max-w-none text-lg leading-relaxed whitespace-pre-wrap"
                            style={{ width: `${style.contentWidth}%` }}
                        >
                            {slide.content}
                        </div>
                    </div>
                );
            }

            case "video": {
                const scene = state.course.video?.scenes[state.selectedSceneIndex];
                const style = state.sceneStyles[state.selectedSceneIndex];

                if (!scene || !style) return <div className="text-center text-gray-400">Selecione uma cena</div>;

                return (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        {scene.imageBase64 ? (
                            <img
                                src={scene.imageBase64}
                                alt="Scene"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                                Sem imagem
                            </div>
                        )}

                        {style.captionEnabled && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded text-white text-center max-w-[80%]">
                                {style.captionText || scene.narration}
                            </div>
                        )}

                        <div className="absolute top-4 right-4 flex gap-2">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                {scene.duration}s
                            </Badge>
                            {style.musicBase64 && (
                                <Badge variant="secondary" className="bg-[#FF8C42] text-white border-0">
                                    ♫ Música
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            }

            case "quiz": {
                const question = state.course.questions[state.selectedQuestionIndex];
                if (!question) return <div className="text-center text-gray-400">Selecione uma pergunta</div>;

                return (
                    <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-bold text-[#2B4B7C] mb-6">
                            {state.selectedQuestionIndex + 1}. {question.text}
                        </h2>

                        <div className="space-y-3">
                            {question.alternatives.map((alt, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border-2 transition-all ${idx === question.correctIndex
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200"
                                        }`}
                                >
                                    <span className={`font-bold mr-2 ${idx === question.correctIndex ? "text-green-700" : "text-gray-400"
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {alt}
                                    {idx === question.correctIndex && (
                                        <span className="float-right text-green-600 font-bold">✓ Correta</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-hidden">
            {renderContent()}
        </div>
    );
}
