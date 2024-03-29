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
    await noteDB
      .delete({
        TableName: TABLE,
        Key: {
          id,
          userId,
        },
      })
      .promise();
    console.log('DELETE note request succeeded.', { id });
    return {
      headers,
      statusCode: 200,
    };
  } catch (e) {
    console.error('DELETE note request failed with an error.', { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};
