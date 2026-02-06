export interface Alternative {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  alternatives: Alternative[];
  correctAlternativeId: string;
}

export interface QuizConfig {
  title: string;
  scormVersion: "1.2" | "2004";
  completionStatus: "completed" | "passed-failed";
  questions: Question[];
}

export interface ScormRequest {
  title: string;
  scormVersion: "1.2" | "2004";
  completionStatus: "completed" | "passed-failed";
  questions: {
    text: string;
    alternatives: string[];
    correctIndex: number;
  }[];
}
