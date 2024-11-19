<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@/components/ui/tags-input";
import JSZip from "jszip";
import { DownloadIcon } from "lucide-vue-next";
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxPortal,
  ComboboxRoot,
} from "radix-vue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTranslation } from "~/composables/useTranslation";
import { useTranslateStore } from "~/stores/translate";

const router = useRouter();
const { t } = useI18n();
const translation = useTranslation();
const store = useTranslateStore();

// 移除本地状态，使用 store 中的状态
const isOpen = ref(false);
const inputSearchTerm = ref("");

// 在组件挂载时初始化
onMounted(() => {
  // 如果 store 中已有数据，直接初始化语言
  if (store.sourceData) {
    store.initializeLanguages(t);
    return;
  }

  // 否则尝试从 localStorage 恢复
  const savedData = localStorage.getItem("translationSource");
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      store.setSourceData(data);
      store.initializeLanguages(t);
      localStorage.removeItem("translationSource");
    } catch (error) {
      console.error("Error parsing saved data:", error);
      router.push("/");
    }
  } else {
    router.push("/");
  }
});

// 过滤建议列表
const filteredKeys = computed(() => {
  const allKeys = store.possibleKeys;
  return allKeys.filter((key) => {
    if (store.ignoredKeys.includes(key.value)) {
      return false;
    }
    if (inputSearchTerm.value) {
      return key.label.toLowerCase().includes(inputSearchTerm.value.toLowerCase());
    }
    return true;
  });
});

// 开始翻译
async function startTranslation() {
  if (!store.sourceData || store.selectedLanguages.size === 0)
    return;

  store.setTranslating(true);
  store.reset();

  try {
    const translations = await Promise.all(
      Array.from(store.selectedLanguages).map(async (targetLang) => {
        store.updateProgress(targetLang, 0);
        const result = await translation.translateObject(
          store.sourceData!,
          targetLang as any,
          "auto",
          (progress) => {
            store.updateProgress(targetLang, progress);
          },
          store.ignoredKeys
        );
        return { targetLang, result };
      })
    );

    translations.forEach(({ targetLang, result }) => {
      store.setTranslatedData(targetLang, result);
    });

    if (translations.length > 0) {
      store.setExpandedLang(translations[0].targetLang);
    }
  } catch (error) {
    console.error("翻译错误:", error);
  } finally {
    store.setTranslating(false);
  }
}

// 处理键选择
function handleKeySelect(value: string) {
  inputSearchTerm.value = "";
  store.addIgnoredKey(value);
  if (filteredKeys.value.length === 0) {
    isOpen.value = false;
  }
}

// 处理键删除
function handleKeyDelete(key: string) {
  store.removeIgnoredKey(key);
}

// 下载所有翻译
async function downloadAllTranslations() {
  const zip = new JSZip();

  Object.entries(store.translatedData).forEach(([lang, data]) => {
    const langName = store.availableLanguages.find(l => l.code === lang)?.name || lang;
    const folderName = `${lang}-${langName}`;

    zip.folder(folderName)?.file("translation.json", JSON.stringify(data, null, 2));
  });

  zip.folder("source")?.file("original.json", JSON.stringify(store.sourceData, null, 2));

  try {
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations.zip";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error creating zip file:", error);
  }
}
</script>

<template>
  <main class="container mx-auto dark:text-white">
    <div class="h-[calc(100vh-100px)]">
      <div class="grid h-full" :class="store.splitView ? 'grid-cols-2' : 'grid-cols-1'">
        <!-- 源文件预览 -->
        <div class="border-r">
          <div class="flex flex-col gap-4 p-4">
            <!-- 忽略键输入 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-muted-foreground">
                {{ t("translate.ignoreKeys") }}
              </label>
              <TagsInput class="gap-0 px-0" :model-value="store.ignoredKeys">
                <div class="flex flex-wrap items-center gap-2 px-3">
                  <TagsInputItem
                    v-for="key in store.ignoredKeys"
                    :key="key"
                    :value="key"
                    @delete="handleKeyDelete(key)"
                  >
                    <TagsInputItemText />
                    <TagsInputItemDelete />
                  </TagsInputItem>
                </div>

                <ComboboxRoot
                  v-model="store.ignoredKeys"
                  v-model:open="isOpen"
                  v-model:search-term="inputSearchTerm"
                  class="w-full"
                  as-child
                >
                  <ComboboxAnchor as-child>
                    <ComboboxInput :placeholder="t('translate.ignoreKeysPlaceholder')" as-child>
                      <TagsInputInput
                        class="w-full px-3"
                        :class="store.ignoredKeys.length > 0 ? 'mt-2' : ''"
                        @keydown.enter.prevent
                      />
                    </ComboboxInput>
                  </ComboboxAnchor>

                  <ComboboxPortal>
                    <ComboboxContent>
                      <CommandList
                        position="popper"
                        class="mt-2 w-[--radix-popper-anchor-width] rounded-md border bg-popover text-popover-foreground shadow-md outline-none dark:border-border dark:bg-background"
                      >
                        <CommandEmpty class="px-4 py-2 text-sm text-muted-foreground">
                          {{ t("translate.noKeysFound") }}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            v-for="key in filteredKeys"
                            :key="key.value"
                            :value="key.label"
                            class="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                            @select.prevent="() => handleKeySelect(key.value)"
                          >
                            {{ key.label }}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </ComboboxContent>
                  </ComboboxPortal>
                </ComboboxRoot>
              </TagsInput>
              <p class="text-xs text-muted-foreground">
                {{ t("translate.ignoreKeysHelp") }}
              </p>
            </div>

            <!-- 语言选择和其他内容 -->
            <div class="flex items-center justify-between">
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="lang in store.availableLanguages"
                  :key="lang.code"
                  :variant="store.selectedLanguages.has(lang.code) ? 'default' : 'outline'"
                  :disabled="store.isTranslating"
                  size="sm"
                  @click="store.toggleLanguage(lang.code)"
                >
                  {{ lang.name }}
                </Button>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="store.selectedLanguages.size > 0"
                  :disabled="store.isTranslating"
                  size="sm"
                  @click="startTranslation"
                >
                  {{ t("translate.actions.startTranslate") }}
                </Button>
              </div>
            </div>

            <ScrollArea class="h-[calc(100vh-280px)]">
              <pre
                class="text-sm"
              ><code>{{ JSON.stringify(store.sourceData, null, 2) }}</code></pre>
            </ScrollArea>
          </div>
        </div>

        <!-- 翻译进度和预览 -->
        <div class="flex h-full flex-col">
          <div class="flex-1 overflow-hidden p-4">
            <ScrollArea class="h-full">
              <div class="space-y-2">
                <Accordion
                  v-if="store.selectedLanguages.size > 0"
                  v-model="store.expandedLang"
                  type="single"
                  collapsible
                >
                  <AccordionItem
                    v-for="lang in Array.from(store.selectedLanguages)"
                    :key="lang"
                    :value="lang"
                  >
                    <AccordionTrigger class="px-4 hover:no-underline">
                      <div class="flex flex-1 items-center gap-4">
                        <span class="min-w-[60px] text-sm">
                          {{ store.availableLanguages.find((l) => l.code === lang)?.name }}
                        </span>
                        <Progress v-model="store.translationProgress[lang]" class="flex-1" />
                        <span class="min-w-[40px] text-right text-sm text-muted-foreground">
                          {{ store.translationProgress[lang] }}%
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea class="h-[calc(100vh-280px)]">
                        <pre
                          class="whitespace-pre-wrap text-sm"
                        ><code>{{ JSON.stringify(store.translatedData[lang], null, 2) }}</code>
                        </pre>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </div>
          <!-- 下载按钮 -->
          <div v-if="Object.keys(store.translatedData).length > 0" class="border-t p-4">
            <Button variant="outline" size="sm" class="w-full" @click="downloadAllTranslations">
              <DownloadIcon class="mr-2 h-4 w-4" />
              {{ t("translate.actions.downloadAll") }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
