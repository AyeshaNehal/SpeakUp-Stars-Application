/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVACY_METRICS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
