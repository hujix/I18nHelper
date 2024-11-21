import { PassThrough } from "node:stream";
import { type SourceLanguage, translate } from "deeplx";
import pLimit from "p-limit";
import type { TranslateEvent, TranslateRequest } from "~/types/translate.type";

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

    const stream = new PassThrough();
    event.node.res.socket?.setNoDelay(true);
    sendStream(event, stream);

    let isConnectionClosed = false;

    // 监听客户端断开连接
    event.node.req.on("close", () => {
      isConnectionClosed = true;
      stream.end();
    });

    const limit = pLimit(5);
    const weights = texts.map((text) => text.length);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const batchSize = 1;
    const batches: string[][] = [];
    const batchWeights: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
      batchWeights.push(weights.slice(i, i + batchSize));
    }

    let accumulatedWeight = 0;

    const sendProgressEvent = (progressEvent: TranslateEvent) => {
      if (!isConnectionClosed) {
        stream.write(`data: ${JSON.stringify(progressEvent)}\n\n`);
      }
    };

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (isConnectionClosed) {
        break;
      }

      const batch = batches[batchIndex];
      const batchWeight = batchWeights[batchIndex];

      const batchPromises = batch.map((text, index) =>
        limit(async () => {
          if (isConnectionClosed) {
            return;
          }

          try {
            let translateText = text;
            if (translateText.length <= 5) {
              translateText = `${translateText}(@)`;
            }

            // 将 signal 传递给翻译函数（如果 deeplx 支持的话）
            let result = await translate(
              translateText as string,
              targetLang,
              sourceLang as SourceLanguage
            );

            if (isConnectionClosed) {
              return;
            }

            accumulatedWeight += batchWeight[index];
            const progress = Math.floor((accumulatedWeight / totalWeight) * 100);
            const globalIndex = batchIndex * batchSize + index;

            result = result.replace("(@)", "");

            sendProgressEvent({
              type: "progress",
              progress,
              index: globalIndex,
              translation: result,
            });

            return { index: globalIndex, translation: result };
          } catch (error) {
            if (isConnectionClosed) {
              return;
            }

            console.error(`Translation failed for text at index ${index}:`, error);

            const globalIndex = batchIndex * batchSize + index;
            accumulatedWeight += batchWeight[index];
            const progress = Math.floor((accumulatedWeight / totalWeight) * 100);

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

    if (!isConnectionClosed) {
      sendProgressEvent({
        type: "progress",
        progress: 100,
        index: -1,
        translation: "",
      });
      stream.end();
    }
  } catch (error) {
    console.error("Translation error:", error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Translation failed",
    });
  }
});
