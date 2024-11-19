<script setup lang="ts">
import { Download, FileJson, Languages } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useTranslateStore } from "~/stores/translate";

const router = useRouter();
const store = useTranslateStore();

async function handleFileUploaded(content: any) {
  store.setSourceData(content);
  localStorage.setItem("translationSource", JSON.stringify(content));
  await router.push("/translate");
}
</script>

<template>
  <main class="container relative">
    <div class="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
      <!-- Hero Content -->
      <div class="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
        <h1
          class="text-3xl font-bold leading-tight tracking-tighter text-foreground md:text-5xl lg:text-6xl lg:leading-[1.1]"
        >
          {{ $t("home.hero.title") }}
        </h1>
        <p class="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          {{ $t("home.hero.description") }}
        </p>
      </div>

      <!-- Upload Section -->
      <div class="mt-20 w-full max-w-[640px]">
        <FileUpload @file-uploaded="handleFileUploaded" />
      </div>

      <!-- Features -->
      <div class="mt-10 grid grid-cols-1 gap-8 text-white md:grid-cols-3">
        <div class="flex flex-col items-center text-center">
          <div class="mb-4 rounded-lg bg-primary/10 p-3">
            <Languages class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-foreground">
            {{ $t("home.features.languages.title") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ $t("home.features.languages.description") }}
          </p>
        </div>
        <div class="flex flex-col items-center text-center">
          <div class="mb-4 rounded-lg bg-primary/10 p-3">
            <FileJson class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-foreground">
            {{ $t("home.features.integrity.title") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ $t("home.features.integrity.description") }}
          </p>
        </div>
        <div class="flex flex-col items-center text-center">
          <div class="mb-4 rounded-lg bg-primary/10 p-3">
            <Download class="h-6 w-6 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-foreground">
            {{ $t("home.features.download.title") }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ $t("home.features.download.description") }}
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
