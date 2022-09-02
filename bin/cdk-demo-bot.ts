#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDemoBotStack } from '../lib/cdk-demo-bot-stack.js';

if (!process.env['DIL_CDK_SCOPE']) {
    throw new Error('DIL_CDK_SCOPE environment variable is not set');
}

const app = new cdk.App();
new CdkDemoBotStack(app, 'CdkDemoBotStack', {
  stackName: `${process.env['DIL_CDK_SCOPE']}-cdk-demo-bot`,
  scope: process.env['DIL_CDK_SCOPE'],
});
