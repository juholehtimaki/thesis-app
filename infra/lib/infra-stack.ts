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
  }
}
