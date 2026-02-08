export interface AppConfig {
  zaiToken: string | null;
  githubToken: string | null;
  e2bApiKey: string | null;
}

export const DEFAULT_CONFIG: AppConfig = {
  zaiToken: null,
  githubToken: null,
  e2bApiKey: null,
};
