#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { productionVariables, stagingVariables } from '../lib/env';
import 'dotenv/config';

const app = new cdk.App();

const env = {
  region: process.env.AWS_REGION,
  account: process.env.ACCOUNT_ID,
};

new InfraStack(app, 'StagingInfraStack', stagingVariables, {
  env,
});

new InfraStack(app, 'ProductionInfraStack', productionVariables, {
  env,
});
