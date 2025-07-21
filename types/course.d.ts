import { AVPlaybackSource } from "expo-av";

import { SupportedLanguageCode, Translations } from "@/types";

export interface ExerciseItemProps {
  onResult: (sucess: boolean) => void;
  onContinue: () => void;
}

export interface Exercise {
  id: number;
  question: Translations;
  type: "flashCard" | "translate" | "video" | "retelling";
}

export interface ExerciseWord {
  content: Translations;
  audio?: AudioSources;
}

export interface FlashCardExerciseWord extends ExerciseWord {
  id: number;
  image: string;
}

export interface FlashCardExercise extends Exercise {
  words: FlashCardExerciseWord[];
  correctWordId: number;
}

export interface VideoExercise extends Exercise{
  video: VideoSources;
  srt:  string;
}

export interface RetellingExercise extends Exercise {
  content: string;
}

export interface TranslateExerciseWord extends ExerciseWord {}

export type TranslateExerciseOption = {
  id: number;
  word: TranslateExerciseWord;
};

export interface TranslateExercise extends Exercise {
  sentence: TranslateExerciseWord;
  options: TranslateExerciseOption[];
  correctOrderIds: { [key in SupportedLanguageCode]: number[] };
}

export type ExerciseItemVariant = FlashCardExercise | TranslateExercise | VideoExercise | RetellingExercise;

export type ExerciseSetId={id: number};

export type ExerciseSet = {
  id: number;
  xp: number;
  difficulty: "easy" | "medium" | "hard";
  items: ExerciseItemVariant[];
};

export type Lesson = {
  id: number;
  description: Translations;
  exercises: number[];
};

export type Chapter = {
  id: number;
  title: Translations;
  description: Translations;
  lessons: Lesson[];
};

export type Section = {
  id: number;
  title: Translations;
  chapters: Chapter[];
};

export type Character = {
  role: string;
  dialogueItems: string[];
};

export type LanguageCharacters = {
  [key in SupportedLanguageCode]: Character[];
};

export type Course = {
  sections: Section[];
  characters: LanguageCharacters;
};

export type AudioSources = {
  [key in SupportedLanguageCode]: AVPlaybackSource;
};

export type VideoSources = {
  source: AVPlaybackSource
}

export type CourseAudios = {
  [key: string]: AudioSources;
};

export type CourseProgression = {
  sectionIdx: number;
  chapterIdx: number;
  lessonIdx: number;
  exerciseIdx: number;
};
