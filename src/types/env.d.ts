declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_CANDIDATE_ID?: string;
    EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv & {
    [key: string]: string | undefined;
  };
};
