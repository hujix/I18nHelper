import type { SourceLanguage, TargetLanguage } from "deeplx";

export interface TranslateRequest {
  texts: string[];
  targetLang: TargetLanguage;
  sourceLang?: SourceLanguage;
}

export interface TranslateEvent {
  type: "progress";
  progress: number;
  index: number;
  translation: string;
}

export interface KeySuggestion {
  value: string;
  label: string;
}

export interface Language {
  code: TargetLanguage;
  name: string;
  file: string;
}
