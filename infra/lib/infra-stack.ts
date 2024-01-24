import {
  Stack,
  StackProps,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_route53 as route53,
  RemovalPolicy,
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_route53_targets as targets,
  aws_dynamodb as dynamodb,
  aws_lambda_nodejs as lambda,
  aws_apigateway as apigateway,
} from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { vars } from './env';

export class InfraStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    variables: vars,
    props?: StackProps,
  ) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: variables.DOMAIN,
    });

    const siteCertificate = new acm.DnsValidatedCertificate(
      this,
      'SiteCertificate',
      {
        domainName: variables.FRONTEND_DOMAIN,
        hostedZone: zone,
        region: 'us-east-1', //cloudfront cert has to be located in us-east-1
      },
    );

    const apiCertificate = new acm.DnsValidatedCertificate(
      this,
      'ApiCertificate',
      {
        domainName: variables.BACKEND_DOMAIN,
        hostedZone: zone,
        region: 'eu-west-1',
      },
    );

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: variables.FRONTEND_DOMAIN,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOAI',
    );

    siteBucket.grantRead(cloudFrontOAI);

    const siteDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      `CloudFrontDistribution`,
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
              originAccessIdentity: cloudFrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        viewerCertificate: {
          aliases: [variables.FRONTEND_DOMAIN],
          props: {
            acmCertificateArn: siteCertificate.certificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: 'TLSv1.2_2021',
          },
        },
      },
    );

    new route53.ARecord(this, 'SiteRecord', {
      recordName: variables.FRONTEND_DOMAIN,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(siteDistribution),
      ),
      zone,
    });

    new s3deploy.BucketDeployment(this, 'DeploymentToSiteBucket', {
      sources: [s3deploy.Source.asset('../client/build')],
      destinationBucket: siteBucket,
      distribution: siteDistribution,
      distributionPaths: ['/*'],
      retainOnDelete: false,
    });

    const dynamoTable = new dynamodb.Table(this, 'DynamoDbTable', {
      tableName: `${variables.ENV_NAME}-table`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const getNotesLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-get-notes-lambda`,
      {
        entry: 'resources/lambdas/get-all-notes.ts',
        handler: 'handler',
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const getSingleNoteLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-get-single-note-lambda`,
      {
        entry: 'resources/lambdas/get-single-note.ts',
        handler: 'handler',
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const postNoteLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-post-note-lambda`,
      {
        entry: 'resources/lambdas/post-note.ts',
        handler: 'handler',
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const updateNoteLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-update-note-lambda`,
      {
        entry: 'resources/lambdas/update-note.ts',
        handler: 'handler',
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    const deleteNoteLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-delete-note-lambda`,
      {
        entry: 'resources/lambdas/delete-note.ts',
        handler: 'handler',
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
        runtime: Runtime.NODEJS_18_X,
      },
    );

    dynamoTable.grantReadData(getNotesLambda);
    dynamoTable.grantReadData(getSingleNoteLambda);
    dynamoTable.grantReadWriteData(postNoteLambda);
    dynamoTable.grantReadWriteData(updateNoteLambda);
    dynamoTable.grantReadWriteData(deleteNoteLambda);

    const api = new apigateway.RestApi(this, `${variables.ENV_NAME}-api`, {
      description: `${variables.ENV_NAME}-api`,
      domainName: {
        domainName: variables.BACKEND_DOMAIN,
        certificate: apiCertificate,
        endpointType: apigateway.EndpointType.REGIONAL,
      },
      deployOptions: {
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowCredentials: true,
        allowOrigins: [
          // FOR DEV PURPOSES
          'http://localhost:3000',
          `https://${variables.FRONTEND_DOMAIN}`,
        ],
      },
    });

    const notes = api.root.addResource('notes');
    const note = notes.addResource('{id}');

    notes.addMethod('GET', new apigateway.LambdaIntegration(getNotesLambda));
    notes.addMethod('POST', new apigateway.LambdaIntegration(postNoteLambda));
    note.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getSingleNoteLambda),
    );
    note.addMethod('PUT', new apigateway.LambdaIntegration(updateNoteLambda));
    note.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteNoteLambda),
    );

    new route53.ARecord(this, 'BackendRecord', {
      zone: zone,
      recordName: variables.BACKEND_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
  }
}
