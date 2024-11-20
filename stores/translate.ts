import type { TargetLanguage } from "deeplx";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

interface KeySuggestion {
  value: string;
  label: string;
}

interface Language {
  code: TargetLanguage;
  name: string;
}

export const useTranslateStore = defineStore("translate", () => {
  // 状态
  const sourceData = ref<Record<string, any> | null>(null);
  const translationProgress = ref<Record<string, number>>({});
  const isTranslating = ref(false);
  const translatedData = ref<Record<string, any>>({});
  const selectedLanguages = ref<Set<string>>(new Set());
  const expandedLang = ref("");
  const ignoredKeys = ref<string[]>([]);
  const availableLanguages = ref<Language[]>([]);

  // Getters
  const possibleKeys = computed<KeySuggestion[]>(() => {
    if (!sourceData.value) {
      return [];
    }
    const keys: KeySuggestion[] = [];
    const commonKeys = new Set<string>();

    function traverse(obj: any, path: string[] = []) {
      for (const key in obj) {
        const currentPath = [...path, key];
        const fullPath = currentPath.join(".");
        keys.push({ value: fullPath, label: fullPath });

        if (typeof obj[key] === "object" && obj[key] !== null) {
          keys.push({ value: `${fullPath}.*`, label: `${fullPath}.*` });
          traverse(obj[key], currentPath);
        } else {
          commonKeys.add(key);
        }
      }
    }

    traverse(sourceData.value);
    commonKeys.forEach((key) => {
      keys.push({ value: `*.${key}`, label: `*.${key} (所有 ${key})` });
    });

    return keys;
  });

  // Actions
  function setSourceData(data: Record<string, any>) {
    sourceData.value = data;
  }

  function updateProgress(lang: string, progress: number) {
    translationProgress.value[lang] = progress;
  }

  function setTranslating(value: boolean) {
    isTranslating.value = value;
  }

  function setTranslatedData(lang: string, data: Record<string, any>) {
    translatedData.value[lang] = data;
  }

  function toggleLanguage(langCode: string) {
    if (selectedLanguages.value.has(langCode)) {
      selectedLanguages.value.delete(langCode);
    } else {
      selectedLanguages.value.add(langCode);
    }
  }

  function setExpandedLang(lang: string) {
    expandedLang.value = lang;
  }

  function addIgnoredKey(key: string) {
    if (!ignoredKeys.value.includes(key)) {
      ignoredKeys.value.push(key);
    }
  }

  function removeIgnoredKey(key: string) {
    ignoredKeys.value = ignoredKeys.value.filter(k => k !== key);
  }

  function initializeLanguages(t: (key: string) => string) {
    availableLanguages.value = [
      { code: "EN", name: t("translate.languages.en") },
      { code: "ZH", name: t("translate.languages.zh") },
      { code: "JA", name: t("translate.languages.ja") },
      { code: "FR", name: t("translate.languages.fr") },
      { code: "DE", name: t("translate.languages.de") },
      { code: "ES", name: t("translate.languages.es") },
      { code: "IT", name: t("translate.languages.it") },
      { code: "PT", name: t("translate.languages.pt") },
      { code: "RU", name: t("translate.languages.ru") },
    ];
  }

  function reset() {
    translationProgress.value = {};
    translatedData.value = {};
    expandedLang.value = "";
  }

  return {
    // 状态
    sourceData,
    translationProgress,
    isTranslating,
    translatedData,
    selectedLanguages,
    expandedLang,
    ignoredKeys,
    availableLanguages,
    // Getters
    possibleKeys,
    // Actions
    setSourceData,
    updateProgress,
    setTranslating,
    setTranslatedData,
    toggleLanguage,
    setExpandedLang,
    addIgnoredKey,
    removeIgnoredKey,
    initializeLanguages,
    reset,
  };
});
