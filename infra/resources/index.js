const AWSXRay = require("aws-xray-sdk-core");
const AWS = AWSXRay.captureAWS(require("aws-sdk"));

const noteDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const TABLE = process.env.dynamoTableName;
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };

  const path = event.resource;
  const httpMethod = event.httpMethod;
  const route = httpMethod.concat(" ").concat(path);

  try {
    switch (route) {
      case "GET /notes":
        body = await noteDB.scan({ TableName: TABLE }).promise();
        break;
      case "GET /notes/{id}":
        body = await noteDB
          .get({
            TableName: TABLE,
            Key: {
              id: event.pathParameters.id,
            },
          })
          .promise();
        break;
      case "PUT /notes":
        let requestJSON = JSON.parse(event.body);
        await noteDB
          .put({
            TableName: TABLE,
            Item: {
              id: requestJSON.id,
              text: requestJSON.text,
            },
          })
          .promise();
        body = `Put item ${requestJSON.id}`;
        break;
      case "DELETE /notes/{id}":
        await noteDB
          .delete({
            TableName: TABLE,
            Key: {
              id: event.pathParameters.id,
            },
          })
          .promise();
        body = `Deleted item ${event.pathParameters.id}`;
        break;

      default:
        throw new Error(`Unsupported route: "${route}"`);
    }
  } catch (err) {
    console.log(err);
    statusCode = 400;
    body = err.message;
  } finally {
    console.log(body);
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
