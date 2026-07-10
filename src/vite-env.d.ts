/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional external base URL for the item-generation API (used on static
   *  hosts like GitHub Pages). e.g. "https://your-app.vercel.app". */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
