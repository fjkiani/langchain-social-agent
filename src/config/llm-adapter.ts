import { z } from "zod";
import { geminiPro } from "./llm.js";
// import { ChatAnthropic } from "@langchain/anthropic";
// import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";


export interface LLMResponse<T = unknown> {
  content: string;
  parsed?: T;
}

export interface LLMAdapter<T = unknown> {
  withStructuredOutput: <S>(schema: z.ZodSchema<S>, options: { name: string }) => LLMAdapter<S>;
  invoke: (messages: Array<{ role: string; content: string }>) => Promise<LLMResponse<T>>;
  withConfig: (config: { runName: string }) => LLMAdapter<T>;
}

// ##  Claude could be implemented Adapter for another provide - just needs API key 
// class ClaudeAdapter<T = unknown> implements LLMAdapter<T> {
//     private model: ChatAnthropic;
//     private schema?: z.ZodSchema<T>;
  
//     constructor() {
//       this.model = new ChatAnthropic({
//         model: "claude-3-5-sonnet-latest",
//         temperature: 0,
//         maxTokens: 4096,
//         topP: 1,
//         topK: 1,
//       });
//     }
  
//     withStructuredOutput<S>(schema: z.ZodSchema<S>, options: { name: string }): 
//     LLMAdapter<S> {
//       const adapter = new ClaudeAdapter<S>();
//       const modelConfig = {
//         model: this.model.model,
//         temperature: this.model.temperature,
//         maxTokens: this.model.maxTokens,
//         topP: this.model.topP,
//         topK: this.model.topK,
//       };
//       adapter.model = new ChatAnthropic(modelConfig).withStructuredOutput(schema, 
//       options);
//       adapter.schema = schema;
//       return adapter;
//     }
  
//     async invoke(messages: Array<{ role: string; content: string }>): 
//     Promise<LLMResponse<T>> {
//       const claudeMessages: BaseMessage[] = messages.map(m => {
//         switch (m.role) {
//           case "system":
//             return new SystemMessage(m.content);
//           case "user":
//             return new HumanMessage(m.content);
//           case "assistant":
//             return new AIMessage(m.content);
//           default:
//             throw new Error(`Unknown message role: ${m.role}`);
//         }
//       });
  
//       const response = await this.model.invoke(claudeMessages);
//       const content = response.content as string;
  
//       if (this.schema) {
//         try {
//           const parsed = this.schema.parse(content);
//           return { content, parsed };
//         } catch (e) {
//           console.error("Failed to parse response:", e);
//           return { content };
//         }
//       }
  
//       return { content };
//     }
  
//     withConfig(config: { runName: string }): LLMAdapter<T> {
//       const adapter = new ClaudeAdapter<T>();
//       const modelConfig = {
//         model: this.model.model,
//         temperature: this.model.temperature,
//         maxTokens: this.model.maxTokens,
//         topP: this.model.topP,
//         topK: this.model.topK,
//       };
//       adapter.model = new ChatAnthropic(modelConfig).withConfig(config);
//       adapter.schema = this.schema;
//       return adapter;
//     }
//   }
  
// Add debug logging
const DEBUG = process.env.DEBUG === 'true';

// Update Gemini model configuration
const GEMINI_CONFIG = {
  // Remove unsupported parameters
  generationConfig: {
    temperature: 0.7,
    // Note: Gemini uses different parameter names
    maxOutputTokens: 2048,
  }
};

class GeminiAdapter<T = unknown> implements LLMAdapter<T> {
  private schema?: z.ZodSchema<T>;

  withStructuredOutput<S>(schema: z.ZodSchema<S>, _options: { name: string }): LLMAdapter<S> {
    const adapter = new GeminiAdapter<S>();
    adapter.schema = schema;
    return adapter;
  }

  async invoke(messages: Array<{ role: string; content: string }>): Promise<LLMResponse<T>> {
    try {
      // Add JSON format instruction to the system message
      const jsonInstruction = this.schema ? 
        `You are a deep reasoning AI model. Analyze the content thoroughly and provide detailed reasoning.
You must respond in valid JSON format matching this schema:
${this.schema.toString()}

Example response format:
{
  "reasoning": "Provide detailed analysis here, considering multiple aspects...",
  "relevant": true or false
}` : '';

      // Combine system and user messages for Gemini
      const combinedContent = [
        jsonInstruction,
        ...messages.map(m => m.content)
      ].filter(Boolean).join("\n\n");

      if (DEBUG) {
        console.log('Gemini Request Config:', GEMINI_CONFIG);
        console.log('Gemini Request Content:', combinedContent);
      }

      const result = await geminiPro.generateContent({
        // Remove unsupported parameters, use only what Gemini accepts
        contents: [{
          role: "user",
          parts: [{ text: combinedContent }]
        }],
        generationConfig: GEMINI_CONFIG.generationConfig
      });

      const content = result.response.text();
      
      if (DEBUG) {
        console.log('Gemini Response:', content);
      }

      if (this.schema) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          const parsed = JSON.parse(jsonMatch[0]);
          const validatedData = this.schema.parse(parsed);
          return {
            content,
            parsed: validatedData
          };
        } catch (e) {
          // Don't return partial data on schema validation errors
          throw new Error(`Failed to validate response: ${e}`);
        }
      }
      
      return { content };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  withConfig(_config: { runName: string }): LLMAdapter<T> {
    // Gemini doesn't support run names, but we keep the interface consistent
    return this;
  }
}

export function createLLMAdapter<T = unknown>(): LLMAdapter<T> {
  return new GeminiAdapter<T>();
}