import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, BookOpen, HelpCircle } from "lucide-react";
import type { GeneratedCourse } from "@/types/course";

interface CoursePreviewProps {
  course: GeneratedCourse;
}

export function CoursePreview({ course }: CoursePreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  const totalSlides = course.slides.length;

  const handlePrev = () => {
    if (showQuiz) {
      setShowQuiz(false);
      setCurrentSlide(totalSlides - 1);
    } else if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (!showQuiz) {
      setShowQuiz(true);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {showQuiz ? (
              <>
                <HelpCircle className="h-5 w-5 text-primary" />
                Quiz - Preview
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5 text-primary" />
                {course.title}
              </>
            )}
          </CardTitle>
          <Badge variant="secondary">
            {showQuiz ? `Quiz: ${course.questions.length} perguntas` : `Slide ${currentSlide + 1} de ${totalSlides}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showQuiz ? (
          <div className="space-y-4">
            {course.questions.map((question, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <p className="font-medium">{idx + 1}. {question.text}</p>
                <ul className="space-y-1 pl-4">
                  {question.alternatives.map((alt, altIdx) => (
                    <li
                      key={altIdx}
                      className={`text-sm ${altIdx === question.correctIndex ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                    >
                      {String.fromCharCode(65 + altIdx)}) {alt}
                      {altIdx === question.correctIndex && " ✓"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
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

            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{course.slides[currentSlide].content}</p>
            </div>

            {course.slides[currentSlide].videoUrl && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🎬 Vídeo sugerido:{" "}
                  <a
                    href={course.slides[currentSlide].videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Assistir no YouTube
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSlide === 0 && !showQuiz}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex gap-1">
            {course.slides.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  !showQuiz && idx === currentSlide
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
                onClick={() => {
                  setShowQuiz(false);
                  setCurrentSlide(idx);
                }}
              />
            ))}
            <button
              className={`w-2 h-2 rounded-full transition-colors ${
                showQuiz ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              onClick={() => setShowQuiz(true)}
            />
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={showQuiz}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
