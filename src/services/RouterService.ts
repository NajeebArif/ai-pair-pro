// src/services/RouterService.ts
import { AITask } from "../types";

export class RouterService {
  static determineTask(input: string): AITask {
    const cleanedInput = input.toLowerCase().trim();
    
    // Code-related patterns
    const codePatterns = [
      /\b(implement|write|complete|finish|code)\b/,
      /```[\s\S]*?```/, // Code blocks
      /(\bfunction\b|\bclass\b|\bdef\b|\bpublic\b)/,
      /\b(error|bug|fix|issue)\b.*\b(code|program|script)\b/
    ];

    // Code review patterns
    const reviewPatterns = [
      /\b(review|improve|optimize|refactor)\b.*\b(code)\b/,
      /\b(clean code|best practices)\b/
    ];

    // Test patterns
    const testPatterns = [
      /\b(test|spec|coverage)\b/,
      /\b(write tests|test cases)\b/
    ];

    if (codePatterns.some(p => p.test(cleanedInput))) {
      return AITask.CodeCompletion;
    }

    if (reviewPatterns.some(p => p.test(cleanedInput))) {
      return AITask.CodeReview;
    }

    if (testPatterns.some(p => p.test(cleanedInput))) {
      return AITask.TestGeneration;
    }

    // Default to General QA
    return AITask.GeneralQA;
  }
}