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
  aws_lambda as lambda,
  aws_iam as iam,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { vars } from "./types";

export class InfraStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    variables: vars,
    props?: StackProps
  ) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: variables.DOMAIN,
    });

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: variables.FRONTEND_DOMAIN,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const siteCertificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: variables.FRONTEND_DOMAIN,
        hostedZone: zone,
        region: "us-east-1", //cloudfront cert has to be located in us-east-1
      }
    );

    const siteDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      `CloudfrontDistribution`,
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        viewerCertificate: {
          aliases: [variables.FRONTEND_DOMAIN],
          props: {
            acmCertificateArn: siteCertificate.certificateArn,
            sslSupportMethod: "sni-only",
            minimumProtocolVersion: "TLSv1.2_2021",
          },
        },
      }
    );

    new route53.ARecord(this, "SiteRecord", {
      recordName: variables.FRONTEND_DOMAIN,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(siteDistribution)
      ),
      zone,
    });

    new s3deploy.BucketDeployment(this, "DeploymentToSiteBucket", {
      sources: [s3deploy.Source.asset("../client/build")],
      destinationBucket: siteBucket,
      distribution: siteDistribution,
      distributionPaths: ["/*"],
      retainOnDelete: false,
    });

    const dynamoTable = new dynamodb.Table(
      this,
      `${variables.ENV_NAME}-table`,
      {
        tableName: "Notes",
        partitionKey: {
          name: "id",
          type: dynamodb.AttributeType.STRING,
        },
        readCapacity: 1,
        writeCapacity: 1,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const apiLambda = new lambda.Function(
      this,
      `${variables.ENV_NAME}-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: new lambda.AssetCode("cdk/resources"),
        handler: "index.handler",
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
      }
    );

    const tablePermissions = new iam.PolicyStatement({
      actions: [
        "dynamodb:BatchGetItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
      ],
      resources: [dynamoTable.tableArn],
    });

    apiLambda.role?.attachInlinePolicy(
      new iam.Policy(this, `${variables.ENV_NAME}-tablePermissions`, {
        statements: [tablePermissions],
      })
    );

    const apiCertificate = new acm.DnsValidatedCertificate(
      this,
      "ApiCertificate",
      {
        domainName: variables.BACKEND_DOMAIN,
        hostedZone: zone,
        region: "eu-west-1",
      }
    );

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
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
        allowCredentials: true,
        allowOrigins: [
          // FOR DEV PURPOSES
          "http://localhost:3000",
          `https://${variables.FRONTEND_DOMAIN}`,
        ],
      },
    });

    const notes = api.root.addResource("notes");
    const note = notes.addResource("{id}");

    notes.addMethod("GET", new apigateway.LambdaIntegration(apiLambda));
    notes.addMethod("PUT", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("POST", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("GET", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("DELETE", new apigateway.LambdaIntegration(apiLambda));

    new route53.ARecord(this, "BackendRecord", {
      zone: zone,
      recordName: variables.BACKEND_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
  }
}
