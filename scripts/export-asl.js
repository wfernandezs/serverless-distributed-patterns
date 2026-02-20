#!/usr/bin/env node

/**
 * Export ASL compatible with AWS Step Functions Workflow Studio
 *
 * This script replaces CloudFormation intrinsic functions (Fn::GetAtt)
 * with placeholder ARNs that Workflow Studio can render.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the serverless config as JSON
console.log('Generating ASL from serverless.yml...');
const slsOutput = execSync('sls print --format json', { encoding: 'utf8' });
const config = JSON.parse(slsOutput);

// Extract the state machine definition
const definition = config.stepFunctions.stateMachines.orderWorkflow.definition;

// Function to replace CloudFormation intrinsic functions with placeholder ARNs
function replaceIntrinsicFunctions(obj, functionMap) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceIntrinsicFunctions(item, functionMap));
  }

  // Check if this is a Fn::GetAtt intrinsic function
  if (obj['Fn::GetAtt'] && Array.isArray(obj['Fn::GetAtt'])) {
    const [functionName, attr] = obj['Fn::GetAtt'];
    if (attr === 'Arn' && functionMap[functionName]) {
      return functionMap[functionName];
    }
  }

  // Recursively process all properties
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = replaceIntrinsicFunctions(value, functionMap);
  }
  return result;
}

// Create placeholder ARN map for Lambda functions
const region = config.provider.region || 'us-east-1';
const accountId = '123456789012'; // Placeholder account ID
const serviceName = config.service;
const stage = 'dev';

const functionMap = {
  reserveInventory: `arn:aws:lambda:${region}:${accountId}:function:${serviceName}-${stage}-reserveInventory`,
  processPayment: `arn:aws:lambda:${region}:${accountId}:function:${serviceName}-${stage}-processPayment`,
  sendNotification: `arn:aws:lambda:${region}:${accountId}:function:${serviceName}-${stage}-sendNotification`,
  compensate: `arn:aws:lambda:${region}:${accountId}:function:${serviceName}-${stage}-compensate`,
};

// Replace intrinsic functions with placeholder ARNs
const aslDefinition = replaceIntrinsicFunctions(definition, functionMap);

// Write to file
const outputPath = path.join(process.cwd(), 'state-machine.asl.json');
fs.writeFileSync(outputPath, JSON.stringify(aslDefinition, null, 2));

console.log(`✓ ASL exported to state-machine.asl.json`);
console.log(`\nNote: Lambda function ARNs are placeholders.`);
console.log(`To get actual ARNs from deployed stack, run: npm run export-asl:deployed`);
