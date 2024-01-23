import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { captureAWS } from "aws-xray-sdk-core";
import * as aws from "aws-sdk";
import { headers } from "./helpers";

const AWS = captureAWS(aws);
const noteDB = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.dynamoTableName as string;

export const handler = async (_: APIGatewayProxyEvent, __: Context) => {
  try {
    const result = await noteDB.scan({ TableName: TABLE }).promise();
    console.log("GET notes request succeeded.", { notes: result });
    return {
      headers,
      body: JSON.stringify(result.Items),
      statusCode: 200,
    };
  } catch (e) {
    console.error("GET notes request failed with an error.", { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};
