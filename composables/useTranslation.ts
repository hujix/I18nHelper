import type { SourceLanguage, TargetLanguage } from "deeplx";

interface TranslateEvent {
  type: "progress";
  progress: number;
  index: number;
  translation: string;
}

export function useTranslation() {
  // 深拷贝函数
  function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => deepClone(item)) as unknown as T;
    }

    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  async function translateObject(
    obj: any,
    targetLang: TargetLanguage,
    sourceLang: SourceLanguage = "auto",
    onProgress?: (progress: number) => void,
    ignoredKeys: string[] = []
  ) {
    const texts: string[] = [];
    const paths: string[][] = [];

    // 提取需要翻译的文本
    function extractTexts(obj: any, path: string[] = []) {
      for (const key in obj) {
        const currentPath = [...path, key];
        const fullPath = currentPath.join(".");

        // 检查是否应该忽略这个路径
        const shouldIgnore = ignoredKeys.some((pattern) => {
          if (pattern.includes("*")) {
            const regex = new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
            return regex.test(fullPath);
          }
          return pattern === fullPath;
        });

        if (shouldIgnore) {
          continue;
        }

        if (typeof obj[key] === "string") {
          texts.push(obj[key]);
          paths.push(currentPath);
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          extractTexts(obj[key], currentPath);
        }
      }
    }

    extractTexts(obj);

    if (texts.length === 0) {
      return obj;
    }

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts,
          targetLang,
          sourceLang,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader)
        throw new Error("No reader available");

      // 使用自定义的深拷贝函数替代 structuredClone
      const result = deepClone(obj);

      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;

        const text = new TextDecoder().decode(value);
        const events = text.split("\n\n").filter(Boolean);

        for (const eventText of events) {
          if (eventText.startsWith("data: ")) {
            const event = JSON.parse(eventText.slice(6)) as TranslateEvent;

            // 更新进度
            if (onProgress) {
              onProgress(event.progress);
            }

            // 更新翻译结果
            if (event.index >= 0) {
              const path = paths[event.index];
              let current = result;
              for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
              }
              current[path[path.length - 1]] = event.translation;
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  return {
    translateObject,
  };
}
