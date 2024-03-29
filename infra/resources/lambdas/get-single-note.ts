import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { captureAWS } from 'aws-xray-sdk-core';
import * as aws from 'aws-sdk';
import { headers } from './helpers';

const AWS = captureAWS(aws);
const noteDB = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.dynamoTableName as string;

export const handler = async (event: APIGatewayProxyEvent, __: Context) => {
  const id = event.pathParameters?.id;
  const userId = event.requestContext.authorizer?.claims.sub;

  try {
    const result = await noteDB
      .get({
        TableName: TABLE,
        Key: {
          id,
          userId,
        },
      })
      .promise();
    console.log('GET note request succeeded.', { note: result });
    return {
      headers,
      body: JSON.stringify(result),
      statusCode: 200,
    };
  } catch (e) {
    console.error('GET note request failed with an error.', { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};
