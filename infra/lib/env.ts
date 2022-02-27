import { vars } from "./types";

const DOMAIN = "choso-dev.com";

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
