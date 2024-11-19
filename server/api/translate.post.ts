import { PassThrough } from "node:stream";
import { type SourceLanguage, type TargetLanguage, translate } from "deeplx";
import pLimit from "p-limit";

interface TranslateRequest {
  texts: string[];
  targetLang: TargetLanguage;
  sourceLang?: SourceLanguage;
}

interface TranslateEvent {
  type: "progress";
  progress: number;
  index: number;
  translation: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<TranslateRequest>(event);
    const { texts, targetLang, sourceLang = "auto" } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Invalid texts array",
      });
    }

    // 设置 SSE 响应头
    setResponseHeaders(event, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // 创建一个 PassThrough 流来保持连接
    const stream = new PassThrough();
    event.node.res.socket?.setNoDelay(true);

    // 设置响应流
    sendStream(event, stream);

    const limit = pLimit(5);
    const weights = texts.map(text => text.length);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const batchSize = 5;
    const batches: string[][] = [];
    const batchWeights: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
      batchWeights.push(weights.slice(i, i + batchSize));
    }

    let accumulatedWeight = 0;

    // 发送事件的辅助函数
    const sendProgressEvent = (progressEvent: TranslateEvent) => {
      stream.write(`data: ${JSON.stringify(progressEvent)}\n\n`);
    };

    // 逐批翻译
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchWeight = batchWeights[batchIndex];

      const batchPromises = batch.map((text, index) =>
        limit(async () => {
          try {
            const result = await translate(
              text as string,
              targetLang,
              sourceLang as SourceLanguage
            );

            accumulatedWeight += batchWeight[index];
            const progress = Math.floor((accumulatedWeight / totalWeight) * 100);
            const globalIndex = batchIndex * batchSize + index;

            // 实时发送进度和翻译结果
            sendProgressEvent({
              type: "progress",
              progress,
              index: globalIndex,
              translation: result,
            });

            return { index: globalIndex, translation: result };
          } catch (error) {
            console.error(`Translation failed for text at index ${index}:`, error);

            const globalIndex = batchIndex * batchSize + index;
            accumulatedWeight += batchWeight[index];
            const progress = Math.floor((accumulatedWeight / totalWeight) * 100);

            // 发送错误状态
            sendProgressEvent({
              type: "progress",
              progress,
              index: globalIndex,
              translation: text,
            });

            return { index: globalIndex, translation: text };
          }
        })
      );

      await Promise.all(batchPromises);
    }

    // 发送完成事件
    sendProgressEvent({
      type: "progress",
      progress: 100,
      index: -1,
      translation: "",
    });

    // 关闭流
    stream.end();
  } catch (error) {
    console.error("Translation error:", error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Translation failed",
    });
  }
});
