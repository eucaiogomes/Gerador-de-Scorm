export interface CourseSlide {
  title: string;
  content: string;
  imagePrompt?: string;
  imageBase64?: string;
}

export interface VideoScene {
  imagePrompt: string;
  narration: string;
  duration: number;
  imageBase64?: string | null;
  audioBase64?: string;
}

export interface VideoContent {
  title: string;
  scenes: VideoScene[];
  totalDuration: number;
  audioBase64?: string;
}

export interface CourseQuestion {
  text: string;
  alternatives: string[];
  correctIndex: number;
}

export interface UnifiedCourse {
  title: string;
  slides: CourseSlide[];
  video?: VideoContent;
  questions: CourseQuestion[];
}

export type GenerationStep =
  | "idle"
  | "generating-content"
  | "generating-images"
  | "generating-video"
  | "generating-audio"
  | "complete"
  | "error";
