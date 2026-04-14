export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "ollama" | "custom" | "deepseek";
  model: string;
  envVar?: string;
  baseUrl?: string;
  description?: string;
}

export const SUPPORTED_MODELS: ModelConfig[] = [
  { id: "deepseek-chat", name: "DeepSeek Chat", provider: "deepseek", model: "deepseek-chat", envVar: "DEEPSEEK_API_KEY", baseUrl: "https://api.deepseek.com", description: "DeepSeek V3 - Cost effective Chinese model" },
  { id: "deepseek-coder", name: "DeepSeek Coder", provider: "deepseek", model: "deepseek-coder", envVar: "DEEPSEEK_API_KEY", baseUrl: "https://api.deepseek.com", description: "DeepSeek specialized for code" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", model: "gpt-4o-mini", envVar: "OPENAI_API_KEY", description: "Fast and cost-effective" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", model: "gpt-4o", envVar: "OPENAI_API_KEY", description: "Most capable OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", model: "gpt-3.5-turbo", envVar: "OPENAI_API_KEY", description: "Budget-friendly" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", model: "claude-3-5-sonnet-20241022", envVar: "ANTHROPIC_API_KEY", description: "Anthropic most intelligent" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", model: "claude-3-haiku-20240307", envVar: "ANTHROPIC_API_KEY", description: "Fast Anthropic" },
  { id: "llama3.1", name: "Llama 3.1", provider: "ollama", model: "llama3.1", description: "Self-hosted via Ollama" },
  { id: "mistral", name: "Mistral", provider: "ollama", model: "mistral", description: "Self-hosted via Ollama" }
];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return SUPPORTED_MODELS.find(m => m.id === modelId);
}

export function getProviderModels(provider: string): ModelConfig[] {
  return SUPPORTED_MODELS.filter(m => m.provider === provider);
}
