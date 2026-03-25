/// <reference types="vite/client" />
declare const __APP_KEY__: string;
declare const __APP_VERSION__: string;
declare const __BUILD_TIMESTAMP__: string;
declare const __APP_ENV__: string;

declare module 'virtual:pwa-register/react' {
    export interface RegisterSWOptions {
        swUrl?: string;
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: any) => void;
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: boolean;
        offlineReady: boolean;
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
}

interface Navigator {
    standalone?: boolean;
}
