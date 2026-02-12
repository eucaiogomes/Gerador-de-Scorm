import type { UnifiedCourse } from "./unified-course";

export type EditorTab = "slides" | "video" | "quiz";

export interface SlideStyle {
  backgroundColor: string;
  contentWidth: number; // percentage 50-100
  fontSize: number; // px
  textColor: string;
}

export interface VideoSceneStyle {
  captionEnabled: boolean;
  captionText: string;
  musicUrl: string;
  musicBase64: string;
  transitionType: "none" | "fade" | "slide" | "zoom";
}

export interface EditorState {
  course: UnifiedCourse;
  activeTab: EditorTab;
  selectedSlideIndex: number;
  selectedSceneIndex: number;
  selectedQuestionIndex: number;
  slideStyles: SlideStyle[];
  sceneStyles: VideoSceneStyle[];
  isDirty: boolean;
}

export const defaultSlideStyle: SlideStyle = {
  backgroundColor: "#ffffff",
  contentWidth: 100,
  fontSize: 16,
  textColor: "#1f2937",
};

export const defaultSceneStyle: VideoSceneStyle = {
  captionEnabled: true,
  captionText: "",
  musicUrl: "",
  musicBase64: "",
  transitionType: "fade",
};
