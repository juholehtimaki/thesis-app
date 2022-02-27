const DOMAIN = "choso-dev.com";

export type deploymentEnv = "staging" | "production";

export interface vars {
  DOMAIN: string;
  FRONTEND_DOMAIN: string;
  BACKEND_DOMAIN: string;
  ENV_NAME: deploymentEnv;
}

export const stagingVariables: vars = {
  DOMAIN,
  ENV_NAME: "staging",
  BACKEND_DOMAIN: "stagingapi.choso-dev.com",
  FRONTEND_DOMAIN: "stagingapp.choso-dev.com",
};

export const productionVariables: vars = {
  DOMAIN,
  BACKEND_DOMAIN: "productionapi.choso-dev.com",
  FRONTEND_DOMAIN: "productionapp.choso-dev.com",
  ENV_NAME: "production",
};
