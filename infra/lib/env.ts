const DOMAIN = 'juholehtimaki.com';

type deploymentEnv = 'staging' | 'production';

export interface vars {
  DOMAIN: string;
  FRONTEND_DOMAIN: string;
  BACKEND_DOMAIN: string;
  ENV_NAME: deploymentEnv;
}

export const stagingVariables: vars = {
  DOMAIN,
  ENV_NAME: 'staging',
  BACKEND_DOMAIN: `stagingapi.${DOMAIN}`,
  FRONTEND_DOMAIN: `stagingapp.${DOMAIN}`,
};

export const productionVariables: vars = {
  DOMAIN,
  ENV_NAME: 'production',
  BACKEND_DOMAIN: `productionapi.${DOMAIN}`,
  FRONTEND_DOMAIN: `productionapp.${DOMAIN}`,
};
