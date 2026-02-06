import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, BookOpen, Film, HelpCircle, Play, Pause } from "lucide-react";
import type { UnifiedCourse } from "@/types/unified-course";

interface UnifiedCoursePreviewProps {
  course: UnifiedCourse;
}

export function UnifiedCoursePreview({ course }: UnifiedCoursePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const totalSlides = course.slides.length;
  const totalScenes = course.video?.scenes.length || 0;
  const totalDuration = course.video?.totalDuration || 0;

  // Video playback logic
  useState(() => {
    // Reset when tab changes or course changes
    return () => {
      setIsVideoPlaying(false);
      setCurrentTime(0);
      setCurrentScene(0);
    };
  }, []); // Run on mount/unmount

  // Handle Play/Pause
  const togglePlay = () => {
    const audio = document.getElementById("preview-audio") as HTMLAudioElement;

    if (isVideoPlaying) {
      setIsVideoPlaying(false);
      if (audio) audio.pause();
    } else {
      setIsVideoPlaying(true);
      if (audio) {
        audio.currentTime = currentTime;
        audio.play().catch(e => {
          console.error("Audio play failed:", e);
          setAudioError(true);
        });
      }
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isVideoPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1; // 100ms increment

          if (newTime >= totalDuration) {
            setIsVideoPlaying(false);
            return 0; // Reset or stop
          }

          // Update current scene based on time
          let elapsedTime = 0;
          for (let i = 0; i < totalScenes; i++) {
            const sceneDuration = course.video!.scenes[i].duration;
            if (newTime >= elapsedTime && newTime < elapsedTime + sceneDuration) {
              setCurrentScene(i);
              break;
            }
            elapsedTime += sceneDuration;
          }

          return newTime;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isVideoPlaying, totalDuration, totalScenes, course.video]);

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{course.title} - Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="slides" className="w-full" onValueChange={() => setIsVideoPlaying(false)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="slides" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Slides
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Film className="h-4 w-4" />
              Vídeo
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              Quiz
            </TabsTrigger>
          </TabsList>

          {/* Slides Tab */}
          <TabsContent value="slides" className="space-y-4">
            <Badge variant="secondary">
              Slide {currentSlide + 1} de {totalSlides}
            </Badge>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{course.slides[currentSlide].title}</h3>

              {course.slides[currentSlide].imageBase64 && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={course.slides[currentSlide].imageBase64}
                    alt={course.slides[currentSlide].title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {course.slides[currentSlide].content}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex gap-1">
                {course.slides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                disabled={currentSlide === totalSlides - 1}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-4">
            {course.video && (
              <>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                  {/* Audio Element */}
                  {course.video.audioBase64 && (
                    <audio id="preview-audio" src={course.video.audioBase64} preload="auto" />
                  )}

                  {course.video.scenes[currentScene]?.imageBase64 ? (
                    <img
                      src={course.video.scenes[currentScene].imageBase64 || ""}
                      alt={`Cena ${currentScene + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">Cena {currentScene + 1}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full" onClick={togglePlay}>
                      {isVideoPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-sm text-center mb-2">
                      {course.video.scenes[currentScene]?.narration}
                    </p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <span>{formatTime(currentTime)}</span>
                      <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-100 ease-linear"
                          style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                        />
                      </div>
                      <span>{formatTime(totalDuration)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Cena {currentScene + 1} de {totalScenes}
                  </span>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={togglePlay}>
                      {isVideoPlaying ? "Pausar" : "Reproduzir"}
                    </Button>
                  </div>
                </div>
                {audioError && <p className="text-xs text-red-500">Erro ao reproduzir áudio. Verifique se o formato é suportado.</p>}
              </>
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-4">
            <Badge variant="secondary">{course.questions.length} perguntas</Badge>

            <div className="space-y-4">
              {course.questions.map((question, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <p className="font-medium">
                    {idx + 1}. {question.text}
                  </p>
                  <ul className="space-y-1 pl-4">
                    {question.alternatives.map((alt, altIdx) => (
                      <li
                        key={altIdx}
                        className={`text-sm ${altIdx === question.correctIndex
                          ? "text-green-600 font-medium"
                          : "text-muted-foreground"
                          }`}
                      >
                        {String.fromCharCode(65 + altIdx)}) {alt}
                        {altIdx === question.correctIndex && " ✓"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
