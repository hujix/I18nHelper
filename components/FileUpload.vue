<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-vue-next";
import { ref } from "vue";

const emit = defineEmits(["fileUploaded"]);
const isDragging = ref(false);

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    await processFile(file);
  }
}

async function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) {
    await processFile(file);
  }
}

async function processFile(file: File) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    emit("fileUploaded", json);
  } catch (error) {
    console.error("Error processing file:", error);
    // TODO: 添加错误提示
  }
}
</script>

<template>
  <div class="w-full" :class="{ 'border-primary': isDragging }">
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-colors"
      :class="{ 'border-primary bg-muted': isDragging, 'border-muted-foreground/25': !isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragend.prevent="isDragging = false"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <UploadIcon class="h-5 w-5" />
      </div>

      <div class="mb-2 mt-4 flex flex-col items-center justify-center text-center">
        <div class="mb-2 flex items-center gap-1">
          <Button variant="link" class="p-0" @click="$refs.fileInput.click()">
            {{ $t("home.hero.upload.choice") }}
          </Button>
          <span class="text-muted-foreground">
            {{ $t("home.hero.upload.drag") }}
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ $t("home.hero.upload.hint") }}
        </p>
      </div>

      <input ref="fileInput" type="file" class="hidden" accept=".json" @change="handleFileSelect" />
    </div>
  </div>
</template>
