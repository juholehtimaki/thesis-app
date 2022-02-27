export type deploymentEnv = "staging" | "production";

export interface vars {
  DOMAIN: string;
  FRONTEND_DOMAIN: string;
  BACKEND_DOMAIN: string;
  ENV_NAME: deploymentEnv;
}
