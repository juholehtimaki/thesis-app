import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { captureAWS } from "aws-xray-sdk-core";
import * as aws from "aws-sdk";
const AWS = captureAWS(aws);

const noteDB = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.dynamoTableName as string;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

interface Note {
  id: string;
  text: string;
}

export const handler = async (event: APIGatewayProxyEvent, _: Context) => {
  const path = event.resource ?? "";
  const httpMethod = event.httpMethod ?? "";
  const route = httpMethod.concat(path);
  const payload = event.body as string;

  switch (route) {
    case "GET/notes":
      const notes = await getNotes();
      return notes;
    case "GET/notes/{id}":
      return await getSingleNote(event.pathParameters?.id);
    case "POST/notes":
      return await postNote(JSON.parse(payload) as Note);
    case "DELETE/notes/{id}":
      return await deleteNote(event.pathParameters?.id);
    case "PUT/notes/{id}":
      return await updateNote(JSON.parse(payload) as Note);
    default:
      console.error("Invalid route.");
      return {
        headers,
        statusCode: 404,
      };
  }
};

const getNotes = async () => {
  try {
    const notes = await noteDB.scan({ TableName: TABLE }).promise();
    console.log("GET notes request succeeded.", { notes });
    return {
      headers,
      body: JSON.stringify(notes),
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

const getSingleNote = async (id?: string) => {
  try {
    const note = await noteDB
      .get({
        TableName: TABLE,
        Key: {
          id,
        },
      })
      .promise();
    console.log("GET note request succeeded.", { note });
    return {
      headers,
      body: JSON.stringify(note),
      statusCode: 200,
    };
  } catch (e) {
    console.error("GET note request failed with an error.", { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};

const postNote = async (noteToPost: Note) => {
  try {
    const note = await noteDB
      .put({
        TableName: TABLE,
        Item: {
          id: noteToPost.id,
          text: noteToPost.text,
        },
      })
      .promise();
    console.log("POST note request succeeded.", { note });
    return {
      headers,
      body: JSON.stringify(note),
      statusCode: 200,
    };
  } catch (e) {
    console.error("POST note request failed with an error.", { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};

const deleteNote = async (id?: string) => {
  try {
    await noteDB
      .delete({
        TableName: TABLE,
        Key: {
          id,
        },
      })
      .promise();
    console.log("DELETE note request succeeded.", { id });
    return {
      headers,
      statusCode: 200,
    };
  } catch (e) {
    console.error("DELETE note request failed with an error.", { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};

export const updateNote = async (noteToUpdate: Note) => {
  try {
    const note = await noteDB
      .update({
        TableName: TABLE,
        Key: { id: noteToUpdate.id },
        UpdateExpression: "set text = :newText",
        ExpressionAttributeValues: {
          ":newText": noteToUpdate.text,
        },
      })
      .promise();
    console.log("UPDATE note request succeeded.", { note });
    return {
      headers,
      body: JSON.stringify(note),
      statusCode: 200,
    };
  } catch (e) {
    console.error("UPDATE note request failed with an error.", { e });
    return {
      headers,
      statusCode: 500,
    };
  }
};
