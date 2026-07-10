// The host's item-generation provider + API key.
//
// IMPORTANT: this is stored ONLY in the host's own browser (localStorage). It is
// never written to Firebase, never sent to any YourBid server, and never
// committed. When generating, the key goes directly from the host's browser to
// the chosen provider (Google or Anthropic). Because the request originates
// client-side, restrict your key in the provider console (e.g. an HTTP-referrer
// restriction for a Gemini key) for safety.

export type AiProvider = 'none' | 'gemini' | 'anthropic';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  /** Optional model override; empty means use the provider default. */
  model: string;
}

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  none: 'Offline demo (sample items)',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic Claude',
};

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  none: '',
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-sonnet-5',
};

const STORAGE_KEY = 'yourbid.ai.config';

const EMPTY: AiConfig = { provider: 'none', apiKey: '', model: '' };

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    return {
      provider: (parsed.provider as AiProvider) || 'none',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* storage unavailable — generation just falls back to the offline pack */
  }
}

/** The effective model for a config (falls back to the provider default). */
export function effectiveModel(config: AiConfig): string {
  return config.model.trim() || DEFAULT_MODELS[config.provider];
}

/** True when the host has entered a usable provider + key. */
export function isAiReady(config: AiConfig): boolean {
  return config.provider !== 'none' && config.apiKey.trim().length > 0;
}
