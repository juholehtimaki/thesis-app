import { vars } from "./types";

const DOMAIN = "choso-dev.com";

export const stagingVariables: vars = {
  DOMAIN,
  FRONTEND_DOMAIN: "stagingapp.choso-dev.com",
};

export const productionVariables: vars = {
  DOMAIN,
  FRONTEND_DOMAIN: "productionapp.choso-dev.com",
};
