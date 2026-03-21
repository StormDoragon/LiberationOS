import { z } from "zod";

export * from "./client";

export type ModelProvider = "openai" | "anthropic" | "google";

export interface CompletionRequest {
  system: string;
  prompt: string;
  provider: ModelProvider;
}

export interface CompletionClient {
  complete<T>(request: CompletionRequest, schema: z.ZodSchema<T>): Promise<T>;
}

export class MockCompletionClient implements CompletionClient {
  async complete<T>(_request: CompletionRequest, schema: z.ZodSchema<T>): Promise<T> {
    return schema.parse({});
  }
}
