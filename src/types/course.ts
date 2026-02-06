export interface CourseSlide {
  title: string;
  content: string;
  imagePrompt?: string;
  imageBase64?: string;
  videoUrl?: string;
}

export interface CourseQuestion {
  text: string;
  alternatives: string[];
  correctIndex: number;
}

export interface GeneratedCourse {
  title: string;
  slides: CourseSlide[];
  questions: CourseQuestion[];
}

export interface GenerateCourseRequest {
  topic: string;
  scormVersion: "1.2" | "2004";
  completionStatus: "completed" | "passed-failed";
}
