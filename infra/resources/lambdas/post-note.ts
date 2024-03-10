import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { captureAWS } from 'aws-xray-sdk-core';
import * as aws from 'aws-sdk';
import { Note, headers } from './helpers';

const AWS = captureAWS(aws);
const noteDB = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.dynamoTableName as string;

export const handler = async (event: APIGatewayProxyEvent, __: Context) => {
  const payload = event.body as string;
  const note = JSON.parse(payload) as Note;
  const userId = event.requestContext.authorizer?.claims.sub;

  try {
    const result = await noteDB
      .update({
        TableName: TABLE,
        Key: { id: note.id, userId },
        UpdateExpression: 'set #text = :newText',
        ExpressionAttributeNames: {
          '#text': 'text',
        },
        ExpressionAttributeValues: {
          ':newText': note.text,
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    console.log('POST note request succeeded.', { note });
    return {
      headers,
      body: JSON.stringify(result?.Attributes),
      statusCode: 200,
    };
  } catch (e) {
    console.error('POST note request failed with an error.', { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};
