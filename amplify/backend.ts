import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { PayPalPlatformAccessTokenFunction } from './functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from './functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from './functions/paypal-retrieve-rest-credentials/resource';
import { getPayPalAuthJWT } from './functions/generate-paypal-auth-jwt/resource'
import { ExploreProductApiFunction } from './functions/api-explore-product/resource'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import {GetProductByIdApiFunction} from './functions/api-get-product-by-id/resource'
import { CheckoutApiFunction } from './functions/api-checkout/resource'
import { ShowOrdersApiFunction } from './functions/api-show-orders/resource'
import { ShowOrderByIdApiFunction } from './functions/api-show-order-by-id/resource'
import { deployBrandFunction } from './functions/deploy-brand/resource'
import { brandDeployStatus } from './functions/brand-deploy-status/resource'
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  PayPalPlatformAccessTokenFunction,
  PayPalMerchantAccessTokenFunction,
  PayPalRetrieveRestCredentialsFunction,
  getPayPalAuthJWT,
  ExploreProductApiFunction,
  GetProductByIdApiFunction,
  CheckoutApiFunction,
  ShowOrdersApiFunction,
  ShowOrderByIdApiFunction,
  deployBrandFunction,
  brandDeployStatus
});

// Grant the brand-deploy-status Lambda read-only access to CloudFormation so
// the dashboard can poll live deployment status and outputs.
backend.brandDeployStatus.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cloudformation:DescribeStacks',
      'cloudformation:DescribeStackEvents',
    ],
    resources: ['*'],
  })
);

// Grant the deploy-brand Lambda permission to provision per-brand CloudFormation
// stacks (ECS/Fargate, ALB, ElastiCache, ACM, Route 53, logs).
backend.deployBrandFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      // CloudFormation
      'cloudformation:CreateStack',
      'cloudformation:UpdateStack',
      'cloudformation:DescribeStacks',
      'cloudformation:DescribeStackEvents',
      'cloudformation:GetTemplate',
      // S3 (template storage)
      's3:GetObject',
      's3:PutObject',
      // IAM (stack creates roles)
      'iam:PassRole',
      'iam:CreateRole',
      'iam:AttachRolePolicy',
      'iam:PutRolePolicy',
      'iam:GetRole',
      'iam:GetRolePolicy',
      'iam:ListAttachedRolePolicies',
      'iam:ListRolePolicies',
      'iam:DeleteRole',
      'iam:DetachRolePolicy',
      'iam:DeleteRolePolicy',
      // ECS
      'ecs:*',
      // EC2 / networking
      'ec2:Describe*',
      'ec2:CreateSecurityGroup',
      'ec2:DeleteSecurityGroup',
      'ec2:AuthorizeSecurityGroupIngress',
      'ec2:AuthorizeSecurityGroupEgress',
      'ec2:RevokeSecurityGroupIngress',
      'ec2:RevokeSecurityGroupEgress',
      'ec2:CreateTags',
      // ALB
      'elasticloadbalancing:*',
      // ElastiCache
      'elasticache:*',
      // ACM
      'acm:RequestCertificate',
      'acm:DescribeCertificate',
      'acm:DeleteCertificate',
      'acm:AddTagsToCertificate',
      // Route 53
      'route53:ChangeResourceRecordSets',
      'route53:GetHostedZone',
      'route53:ListResourceRecordSets',
      'route53:GetChange',
      // CloudWatch Logs
      'logs:CreateLogGroup',
      'logs:DeleteLogGroup',
      'logs:PutRetentionPolicy',
      'logs:DescribeLogGroups',
    ],
    resources: ['*'],
  })
);

// Create a custom CDK stack within your Amplify deployment context
const customStack = backend.createStack('PayallyAPIStack');

const api = new apigateway.RestApi(customStack, 'PayallyAPI', {
  restApiName: 'payally-api',
  deployOptions: {
    stageName: 'v1',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
  },
});

const productsResource = api.root.addResource('explore-products');
const getProductbyIdResource = api.root.addResource('get-product-by-id');
const checkoutResource = api.root.addResource('checkout');
const showOrdersResource = api.root.addResource('show-orders');
const showOrderByIdResource = api.root.addResource('show-order-by-id');

checkoutResource.addMethod(
  'POST',
  new apigateway.LambdaIntegration(backend.CheckoutApiFunction.resources.lambda)
)

showOrdersResource.addMethod(
  'POST',
  new apigateway.LambdaIntegration(backend.ShowOrdersApiFunction.resources.lambda)
)

showOrderByIdResource.addMethod(
  'POST',
  new apigateway.LambdaIntegration(backend.ShowOrderByIdApiFunction.resources.lambda)
)

getProductbyIdResource.addMethod(
  'GET',
  new apigateway.LambdaIntegration(backend.GetProductByIdApiFunction.resources.lambda)
)

productsResource.addMethod(
  'GET',
  new apigateway.LambdaIntegration(backend.ExploreProductApiFunction.resources.lambda)
);

