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
} from "aws-cdk-lib";
import { Tracing } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { vars } from "./env";

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

    const siteCertificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: variables.FRONTEND_DOMAIN,
        hostedZone: zone,
        region: "us-east-1", //cloudfront cert has to be located in us-east-1
      }
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

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: variables.FRONTEND_DOMAIN,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      autoDeleteObjects: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    const siteDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      `CloudfrontDistribution`,
      {
        originConfigs: [
          {
            customOriginSource: {
              domainName: siteBucket.bucketWebsiteDomainName,
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
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

    const dynamoTable = new dynamodb.Table(this, "DynamoDbTable", {
      tableName: `${variables.ENV_NAME}-table`,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiLambda = new lambda.NodejsFunction(
      this,
      `${variables.ENV_NAME}-lambda`,
      {
        entry: "functions/index.ts",
        handler: "handler",
        environment: {
          dynamoTableName: dynamoTable.tableName,
        },
        tracing: Tracing.ACTIVE,
      }
    );

    dynamoTable.grantReadWriteData(apiLambda);

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
    notes.addMethod("POST", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("GET", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("PUT", new apigateway.LambdaIntegration(apiLambda));
    note.addMethod("DELETE", new apigateway.LambdaIntegration(apiLambda));

    new route53.ARecord(this, "BackendRecord", {
      zone: zone,
      recordName: variables.BACKEND_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
  }
}
