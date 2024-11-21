import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { KeySuggestion, Language } from "~/types/translate.type";

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
      { code: "zh", name: t("translate.languages.zh"), file: "zh-CN.json" },
      { code: "en", name: t("translate.languages.en"), file: "en-US.json" },
      { code: "es", name: t("translate.languages.es"), file: "es-ES.json" },
      { code: "fr", name: t("translate.languages.fr"), file: "fr-FR.json" },
      { code: "de", name: t("translate.languages.de"), file: "de-DE.json" },
      { code: "ru", name: t("translate.languages.ru"), file: "ru-RU.json" },
      { code: "pt", name: t("translate.languages.pt"), file: "pt-PT.json" },
      { code: "ja", name: t("translate.languages.ja"), file: "ja-JP.json" },
      { code: "it", name: t("translate.languages.it"), file: "it-IT.json" },
      { code: "pl", name: t("translate.languages.pl"), file: "pl-PL.json" },
      { code: "bg", name: t("translate.languages.bg"), file: "bg-BG.json" },
      { code: "sv", name: t("translate.languages.sv"), file: "sv-SE.json" },
      { code: "nl", name: t("translate.languages.nl"), file: "nl-NL.json" },
      { code: "da", name: t("translate.languages.da"), file: "da-DK.json" },
      { code: "cs", name: t("translate.languages.cs"), file: "cs-CZ.json" },
      { code: "hu", name: t("translate.languages.hu"), file: "hu-HU.json" },
      { code: "et", name: t("translate.languages.et"), file: "et-EE.json" },
      { code: "lv", name: t("translate.languages.lv"), file: "lv-LV.json" },
      { code: "lt", name: t("translate.languages.lt"), file: "lt-LT.json" },
      { code: "sk", name: t("translate.languages.sk"), file: "sk-SK.json" },
      { code: "ro", name: t("translate.languages.ro"), file: "ro-RO.json" },
      { code: "sl", name: t("translate.languages.sl"), file: "sl-SI.json" },
      { code: "el", name: t("translate.languages.el"), file: "el-GR.json" },
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
