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
}

export type VideoGenerationStep = 
  | "idle"
  | "generating-content"
  | "generating-images"
  | "generating-audio"
  | "assembling-video"
  | "creating-scorm"
  | "complete"
  | "error";
