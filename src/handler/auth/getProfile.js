// Import AWS SDK DynamoDB clients
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config(); 
/**
 * Handler function to fetch the user profile based on the request.
 * 
 * This function retrieves the userId from the query parameters,
 * looks up the user's record in the DynamoDB table.
 * 
 * @param {Object} request - The Hapi.js request object containing the query parameters.
 * @param {Object} h - The Hapi.js response toolkit used to send the response.
 * @returns {Object} - Returns a response object with status and user profile data if successful, or an error message if there's an issue.
 */
const getProfileHandler = async (request, h) => {
  // Retrieve the userId from the query parameters
  const {UserId} = request.params;

  // Initialize the DynamoDB client
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB,
    },
  });
  const docClient = DynamoDBDocumentClient.from(client);

  try {
    // Create the GetCommand to retrieve the user item
    const command = new GetCommand({
      TableName: "userAccess",
      Key: { UserId },
    });

    // Execute the command
    const result = await docClient.send(command);

    // If the item is not found, return a 404 response
    if (!result.Item) {
      return h.response({
        status: 404,
        message: "User not found",
      }).code(404);
    }

    const userData = result.Item;

    // Return the user data
    return h.response({
      status: 200,
      message: "User profile fetched successfully",
      data: {
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    }).code(200);
  } catch (error) {
    console.error(error);
    return h.response({
      status: 500,
      message: "Server error",
    }).code(500);
  }
};

// Export getProfileHandler to be used in other parts of the application
module.exports = getProfileHandler;
