import { SupportedLanguageCode } from "@/types";

export const CURRENT_COURSE_ID_STORAGE_KEY = "CURRENT_COURSE_ID";
export const COURSE_PROGRESS_STORAGE_KEY = (code: SupportedLanguageCode) =>
  `EN_COURSE_PROGRESS`;
export const LANGUAGE_ID_STORAGE_KEY = "LANGUAGE_ID";
